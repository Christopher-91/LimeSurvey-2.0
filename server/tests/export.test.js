import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { ExportService } from '../src/modules/export/export.service.js';

describe('Export Service & Executive Summary PDF Tests', () => {
  let testSurvey;

  beforeAll(async () => {
    await prisma.$connect();
    // Find an existing survey or create a test survey
    testSurvey = await prisma.survey.findFirst({
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!testSurvey) {
      testSurvey = await prisma.survey.create({
        data: {
          title: 'Executive PDF Test Survey',
          description: 'Survey created for testing executive summary PDF generation',
          active: true,
          questions: {
            create: [
              {
                code: 'Q1',
                text: 'How satisfied are you with our enterprise platform?',
                type: 'single_choice',
                sortOrder: 1,
                options: {
                  create: [
                    { code: 'A1', text: 'Very Satisfied', sortOrder: 1 },
                    { code: 'A2', text: 'Neutral', sortOrder: 2 },
                  ],
                },
              },
              {
                code: 'Q2',
                text: 'Rate your overall onboarding experience',
                type: 'rating',
                sortOrder: 2,
              },
            ],
          },
        },
        include: {
          questions: {
            include: { options: true },
          },
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('generates an Executive Summary PDF report buffer successfully', async () => {
    const result = await ExportService.generateExecutivePdf(testSurvey.id);

    expect(result).toBeDefined();
    expect(result.contentType).toBe('application/pdf');
    expect(result.filename).toMatch(/^Executive_Summary_\d+.*\.pdf$/);
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(1000);

    // Verify PDF header %PDF-
    const header = result.buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('routes format=pdf via exportResponses to the Executive PDF generator', async () => {
    const result = await ExportService.exportResponses(testSurvey.id, 'pdf');

    expect(result).toBeDefined();
    expect(result.contentType).toBe('application/pdf');
    expect(result.filename).toMatch(/\.pdf$/);
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(1000);
  });

  it('exports responses in CSV and XLSX formats', async () => {
    const csvResult = await ExportService.exportResponses(testSurvey.id, 'csv');
    expect(csvResult.contentType).toContain('text/csv');
    expect(csvResult.filename).toMatch(/\.csv$/);
    expect(Buffer.isBuffer(csvResult.buffer)).toBe(true);

    const xlsxResult = await ExportService.exportResponses(testSurvey.id, 'xlsx');
    expect(xlsxResult.contentType).toContain('spreadsheetml.sheet');
    expect(xlsxResult.filename).toMatch(/\.xlsx$/);
    expect(Buffer.isBuffer(xlsxResult.buffer)).toBe(true);
  });
});
