import * as XLSX from 'xlsx';
import { prisma } from '../../config/db.js';

export class ExportService {
  static async exportResponses(surveyId, format = 'csv') {
    const sId = parseInt(surveyId, 10);

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
            // Multiple choice
            displayVal = raw
              .map((val) => {
                const opt = q.options?.find((o) => o.code === val);
                return opt ? opt.text : val;
              })
              .join('; ');
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
}
