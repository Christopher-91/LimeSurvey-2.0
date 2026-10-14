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
    const dataRows = responses.map((resp) => {
      const row = {
        'Response ID': resp.id,
        'Submit Date': resp.submitDate ? new Date(resp.submitDate).toISOString() : '',
        'Voter Token': resp.voter?.token || 'Anonymous',
        'Voter Email': resp.voter?.email || '',
        'IP Address': resp.ipAddress || '',
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

    // Create workbook using XLSX
    const worksheet = XLSX.utils.json_to_sheet(dataRows);
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
