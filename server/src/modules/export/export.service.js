import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { prisma } from '../../config/db.js';
import { StatsService } from '../stats/stats.service.js';

export class ExportService {
  static async exportResponses(surveyId, format = 'csv') {
    const sId = parseInt(surveyId, 10);

    // If PDF format requested, route directly to Executive PDF generator
    if (format && format.toLowerCase() === 'pdf') {
      return this.generateExecutivePdf(sId);
    }

    const survey = await prisma.survey.findUnique({
      where: { id: sId },
      include: {
        questions: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: { options: true },
        },
        groups: {
          include: {
            questions: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: { options: true },
            },
          },
        },
      },
    });

    if (!survey) {
      const error = new Error('Survey not found');
      error.statusCode = 404;
      throw error;
    }

    const responses = await prisma.response.findMany({
      where: { surveyId: sId },
      include: { voter: true },
      orderBy: { submitDate: 'asc' },
    });

    const allQuestions = [
      ...survey.questions,
      ...survey.groups.flatMap((g) => g.questions),
    ];

    // Build data rows
    const dataRows = responses.map((resp, idx) => {
      const isZk = survey.zeroKnowledgeEnabled;
      const row = {
        'Response ID': isZk ? `ZK-${idx + 1}` : resp.id,
        'Submit Date': isZk ? '[Shielded by ZK Protocol]' : (resp.submitDate ? new Date(resp.submitDate).toISOString() : ''),
        'Voter Token': isZk ? 'Anonymous (ZK Protocol)' : (resp.voter?.token || 'Anonymous'),
        'Voter Email': isZk ? '[Decoupled]' : (resp.voter?.email || ''),
        'IP Address': isZk ? '[Not Stored]' : (resp.ipAddress || ''),
      };

      // Add each question's answer
      allQuestions.forEach((q) => {
        const raw = resp.answers?.[q.code] ?? resp.answers?.[q.id];
        let displayVal = '';

        if (raw !== undefined && raw !== null) {
          if (Array.isArray(raw)) {
            if (q.type === 'ranking') {
              displayVal = raw
                .map((val, rIdx) => {
                  const codeVal = typeof val === 'object' && val !== null && val.code ? val.code : String(val);
                  const opt = q.options?.find((o) => o.code === codeVal);
                  const label = opt ? opt.text : codeVal;
                  return `#${rIdx + 1}: ${label}`;
                })
                .join('; ');
            } else {
              displayVal = raw
                .map((val) => {
                  const opt = q.options?.find((o) => o.code === val);
                  return opt ? opt.text : val;
                })
                .join('; ');
            }
          } else if (q.options && q.options.length > 0) {
            const opt = q.options.find((o) => o.code === String(raw));
            displayVal = opt ? opt.text : String(raw);
          } else {
            displayVal = String(raw);
          }
        }

        row[`[${q.code}] ${q.text}`] = displayVal;
      });

      return row;
    });

    // If Zero Knowledge Protocol is active, shuffle the export rows so ordering cannot leak identity
    let finalRows = dataRows;
    if (survey.zeroKnowledgeEnabled) {
      finalRows = [...dataRows];
      for (let i = finalRows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalRows[i], finalRows[j]] = [finalRows[j], finalRows[i]];
      }
    }

    // Create workbook using XLSX
    const worksheet = XLSX.utils.json_to_sheet(finalRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Responses');

    if (format.toLowerCase() === 'xlsx') {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return {
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `survey_${sId}_responses_${Date.now()}.xlsx`,
      };
    } else {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return {
        buffer: Buffer.from(csv, 'utf-8'),
        contentType: 'text/csv; charset=utf-8',
        filename: `survey_${sId}_responses_${Date.now()}.csv`,
      };
    }
  }

  /**
   * Generates a boardroom-ready Executive Summary PDF report
   */
  static async generateExecutivePdf(surveyId) {
    const sId = parseInt(surveyId, 10);

    const survey = await prisma.survey.findUnique({
      where: { id: sId },
      include: {
        questions: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
        groups: {
          include: {
            questions: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: { options: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
        _count: {
          select: { responses: true, voters: true },
        },
      },
    });

    if (!survey) {
      const error = new Error('Survey not found');
      error.statusCode = 404;
      throw error;
    }

    const stats = await StatsService.getSurveyStatistics(sId);

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));

    const contentWidth = doc.page.width - 80;

    // 1. Cover Banner
    doc.rect(0, 0, doc.page.width, 105).fill('#065f46');
    doc.fillColor('#ffffff').fontSize(18).text('EXECUTIVE SUMMARY REPORT', 40, 26, { characterSpacing: 1 });
    doc.fontSize(11).fillColor('#a7f3d0').text(survey.title || 'Untitled Survey', 40, 50, { width: contentWidth - 40, ellipsis: true });

    const genDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const adminInfo = survey.adminName || survey.adminEmail || 'Survey Administrator';
    doc.fontSize(8).fillColor('#d1fae5').text(
      `Generated: ${genDate}  •  Prepared by: ${adminInfo}  •  Platform: LimeSurvey Modern`,
      40,
      72
    );

    let currentY = 120;

    // 2. Zero-Knowledge Badge (if active)
    if (survey.zeroKnowledgeEnabled) {
      doc.rect(40, currentY, contentWidth, 24).fill('#ecfdf5');
      doc.rect(40, currentY, contentWidth, 24).stroke('#a7f3d0');
      doc.fontSize(8.5).fillColor('#065f46').text(
        'SHIELDED BY ZERO-KNOWLEDGE PROTOCOL: Participant identities and timestamps are cryptographically decoupled.',
        52,
        currentY + 7
      );
      currentY += 34;
    }

    // 3. High-Level KPI Scorecard (4 Cards)
    const cardGap = 10;
    const cardW = (contentWidth - 3 * cardGap) / 4;
    const cardH = 46;

    const kpis = [
      { label: 'TOTAL SUBMISSIONS', value: String(stats.totalResponses), color: '#10b981' },
      { label: 'COMPLETION RATE', value: `${stats.completionRate}%`, color: '#059669' },
      { label: 'INVITED PARTICIPANTS', value: stats.totalVoters > 0 ? String(stats.totalVoters) : 'Public Link', color: '#0f766e' },
      { label: 'SURVEY STATUS', value: survey.active ? 'Active' : 'Concluded', color: survey.active ? '#15803d' : '#64748b' },
    ];

    kpis.forEach((kpi, idx) => {
      const cardX = 40 + idx * (cardW + cardGap);
      doc.rect(cardX, currentY, cardW, cardH).fill('#f8fafc');
      doc.rect(cardX, currentY, cardW, cardH).stroke('#e2e8f0');

      doc.fontSize(7).fillColor('#64748b').text(kpi.label, cardX + 8, currentY + 7);
      doc.fontSize(14).fillColor(kpi.color).text(kpi.value, cardX + 8, currentY + 20, { width: cardW - 16, ellipsis: true });
    });

    currentY += cardH + 16;

    // 4. Executive Key Highlights Box
    doc.rect(40, currentY, contentWidth, 42).fill('#f1f5f9');
    doc.fontSize(8).fillColor('#475569').text('EXECUTIVE OVERVIEW & SYNTHESIS', 50, currentY + 6);
    doc.fontSize(8.5).fillColor('#1e293b').text(
      `This executive report synthesizes ${stats.totalResponses} participant response(s) across ${stats.questions.length} structured question(s). ${
        stats.completionRate >= 70
          ? 'Strong participation engagement was recorded with an above-average completion rate.'
          : 'Summary insights and answer distributions are presented below.'
      }`,
      50,
      currentY + 18,
      { width: contentWidth - 20, lineGap: 2 }
    );

    currentY += 54;

    // Section Title
    doc.fontSize(11).fillColor('#065f46').text('Detailed Response Breakdowns & Question Analytics', 40, currentY);
    doc.rect(40, currentY + 16, contentWidth, 1).fill('#cbd5e1');
    currentY += 26;

    // 5. Question-by-Question Analytics
    const questions = stats.questions || [];

    questions.forEach((q, qIdx) => {
      // Check page overflow
      if (currentY > doc.page.height - 110) {
        doc.addPage();
        currentY = 40;
      }

      // Question Title Banner
      doc.fontSize(9.5).fillColor('#0f172a').text(
        `Q${qIdx + 1}. [${q.code || `Q${qIdx + 1}`}] ${q.text}`,
        40,
        currentY,
        { width: contentWidth - 110 }
      );

      // Question Type & Count Badges
      const typeLabel = q.type ? q.type.replace('_', ' ').toUpperCase() : 'QUESTION';
      doc.fontSize(7.5).fillColor('#64748b').text(
        `${typeLabel}  •  ${q.totalAnswered} answered`,
        40,
        currentY + 13
      );
      currentY += 26;

      // Render Options (Single Choice, Multiple Choice, Yes/No)
      if (Array.isArray(q.options) && q.options.length > 0 && q.type !== 'ranking') {
        q.options.forEach((opt) => {
          if (currentY > doc.page.height - 50) {
            doc.addPage();
            currentY = 40;
          }

          const optText = opt.text || opt.code || 'Option';
          const pct = opt.percentage || 0;
          const count = opt.count || 0;

          // Option label
          doc.fontSize(8).fillColor('#334155').text(optText, 50, currentY, { width: 170, ellipsis: true });

          // Progress bar
          const barX = 225;
          const barW = 180;
          const barH = 7;
          doc.rect(barX, currentY + 1, barW, barH).fill('#e2e8f0');
          if (pct > 0) {
            doc.rect(barX, currentY + 1, (barW * pct) / 100, barH).fill('#10b981');
          }

          // Percentage & Count
          doc.fontSize(7.5).fillColor('#0f172a').text(`${pct}% (${count})`, barX + barW + 10, currentY);

          currentY += 13;
        });
      }

      // Rating Question
      if (q.type === 'rating' && q.averageRating) {
        doc.rect(50, currentY, contentWidth - 20, 20).fill('#fefce8');
        doc.fontSize(8.5).fillColor('#854d0e').text(
          `★ Average Rating: ${q.averageRating} / 5.0 Stars (${q.totalAnswered} evaluations)`,
          60,
          currentY + 5
        );
        currentY += 26;
      }

      // Ranking Question
      if (q.type === 'ranking' && Array.isArray(q.options)) {
        if (q.rankingSummary?.winner) {
          doc.rect(50, currentY, contentWidth - 20, 18).fill('#f0fdf4');
          doc.fontSize(8).fillColor('#15803d').text(
            `Top Preference (#1 Rank): ${q.rankingSummary.winner}`,
            60,
            currentY + 4
          );
          currentY += 24;
        }

        q.options.slice(0, 6).forEach((item, rIdx) => {
          if (currentY > doc.page.height - 40) {
            doc.addPage();
            currentY = 40;
          }
          const avg = item.averageRank !== undefined ? item.averageRank : 'N/A';
          doc.fontSize(8).fillColor('#334155').text(
            `#${rIdx + 1}  ${item.text || item.code}  —  Average Rank: ${avg} (${item.firstChoicePercentage || 0}% 1st choice)`,
            50,
            currentY
          );
          currentY += 12;
        });
      }

      // Text / Comments Question
      if (['short_text', 'long_text', 'multiple_short_text'].includes(q.type)) {
        const samples = q.recentResponses && q.recentResponses.length > 0 ? q.recentResponses.slice(0, 4) : [];
        if (samples.length > 0) {
          samples.forEach((comment) => {
            if (currentY > doc.page.height - 40) {
              doc.addPage();
              currentY = 40;
            }
            const cleanComment = typeof comment === 'string' ? comment.trim() : JSON.stringify(comment);
            doc.rect(50, currentY, contentWidth - 20, 18).fill('#f8fafc');
            doc.rect(50, currentY, contentWidth - 20, 18).stroke('#e2e8f0');
            doc.fontSize(7.5).fillColor('#334155').text(
              `"${cleanComment.slice(0, 140)}${cleanComment.length > 140 ? '...' : ''}"`,
              56,
              currentY + 4,
              { width: contentWidth - 32, ellipsis: true }
            );
            currentY += 22;
          });
        } else {
          doc.fontSize(7.5).fillColor('#94a3b8').text('No qualitative text answers recorded yet.', 50, currentY);
          currentY += 12;
        }
      }

      // File upload Question
      if (q.type === 'file_upload') {
        doc.fontSize(8).fillColor('#047857').text(`📎 Total Media Attachments Uploaded: ${q.totalFiles || 0}`, 50, currentY);
        currentY += 14;
      }

      // Divider line
      doc.rect(40, currentY + 4, contentWidth, 0.5).fill('#e2e8f0');
      currentY += 12;
    });

    // 6. Running Page Numbers & Footer on Every Buffered Page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7.5).fillColor('#94a3b8');
      doc.text('LimeSurvey Modern  •  Executive Summary Report', 40, doc.page.height - 25, { align: 'left' });
      doc.text(`Page ${i + 1} of ${range.count}`, 40, doc.page.height - 25, { align: 'right' });
    }

    doc.end();

    const buffer = await new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const safeTitle = (survey.title || 'Survey')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    return {
      buffer,
      contentType: 'application/pdf',
      filename: `Executive_Summary_${sId}_${safeTitle}_${Date.now()}.pdf`,
    };
  }
}
