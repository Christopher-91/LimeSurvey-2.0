import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { ResponseService } from '../src/modules/responses/response.service.js';
import { StatsService } from '../src/modules/stats/stats.service.js';
import { SurveyService } from '../src/modules/surveys/survey.service.js';

describe('Survey, Response, and Statistics Service Unit Tests', () => {
  let createdSurveyId;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (createdSurveyId) {
      await prisma.survey.delete({ where: { id: createdSurveyId } }).catch(() => {});
    }
  });

  it('creates a new survey via SurveyService', async () => {
    const survey = await SurveyService.create(
      {
        title: 'Service Test Survey',
        description: 'Automated test suite survey',
        active: true,
      },
      null
    );

    expect(survey).toBeDefined();
    expect(survey.id).toBeGreaterThan(0);
    expect(survey.title).toBe('Service Test Survey');
    createdSurveyId = survey.id;
  });

  it('submits a valid response and aggregates stats', async () => {
    // Add question
    const question = await prisma.question.create({
      data: {
        surveyId: createdSurveyId,
        code: 'Q_TEST',
        text: 'How satisfied are you?',
        type: 'single_choice',
        mandatory: true,
        options: {
          create: [
            { code: 'OPT_YES', text: 'Yes', sortOrder: 1 },
            { code: 'OPT_NO', text: 'No', sortOrder: 2 },
          ],
        },
      },
    });

    const response = await ResponseService.submitResponse(
      createdSurveyId,
      { Q_TEST: 'OPT_YES' },
      null,
      '127.0.0.1'
    );

    expect(response).toBeDefined();
    expect(response.id).toBeGreaterThan(0);
    expect(response.answers.Q_TEST).toBe('OPT_YES');

    // Query stats
    const stats = await StatsService.getSurveyStatistics(createdSurveyId);
    expect(stats).toBeDefined();
    expect(stats.totalResponses).toBeGreaterThanOrEqual(1);

    const qStat = stats.questions.find((q) => q.code === 'Q_TEST');
    expect(qStat).toBeDefined();
    const yesOption = qStat.options.find((o) => o.code === 'OPT_YES');
    expect(yesOption.count).toBeGreaterThanOrEqual(1);
  });

  it('rejects submission when mandatory question is missing', async () => {
    await expect(
      ResponseService.submitResponse(createdSurveyId, {}, null, '127.0.0.1')
    ).rejects.toThrow('Please answer all mandatory questions before submitting.');
  });
});
