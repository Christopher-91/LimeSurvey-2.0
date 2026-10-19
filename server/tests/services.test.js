import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { QuestionService } from '../src/modules/questions/question.service.js';
import { ResponseService } from '../src/modules/responses/response.service.js';
import { StatsService } from '../src/modules/stats/stats.service.js';
import { SurveyService } from '../src/modules/surveys/survey.service.js';
import { VoterService } from '../src/modules/voters/voter.service.js';

describe('Survey, Response, and Statistics Service Unit Tests', () => {
  let createdSurveyId;
  let testQuestionId;

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
    testQuestionId = question.id;

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

  it('updates question code, text, mandatory status, and options via QuestionService.updateQuestion', async () => {
    const updated = await QuestionService.updateQuestion(testQuestionId, {
      code: 'Q_UPDATED',
      text: 'What is your updated feedback rating?',
      type: 'multiple_choice',
      mandatory: false,
      options: [
        { code: 'AO1', text: 'Excellent', sortOrder: 1 },
        { code: 'AO2', text: 'Good', sortOrder: 2 },
        { code: 'AO3', text: 'Needs Improvement', sortOrder: 3 },
      ],
    });

    expect(updated).toBeDefined();
    expect(updated.code).toBe('Q_UPDATED');
    expect(updated.text).toBe('What is your updated feedback rating?');
    expect(updated.type).toBe('multiple_choice');
    expect(updated.mandatory).toBe(false);
    expect(updated.options).toHaveLength(3);
    expect(updated.options.map((o) => o.text)).toEqual(['Excellent', 'Good', 'Needs Improvement']);
  });

  it('creates a universal access code and allows multiple users to submit responses with the same code', async () => {
    // Generate universal code for all participants
    const universalVoter = await VoterService.generateUniversal(createdSurveyId, 'ALL-STAFF-2026');
    expect(universalVoter).toBeDefined();
    expect(universalVoter.token).toBe('ALL-STAFF-2026');
    expect(universalVoter.usesLeft).toBe(-1);

    // Make question not mandatory so responses can be submitted easily
    await prisma.question.update({
      where: { id: testQuestionId },
      data: { mandatory: false },
    });

    // User 1 submits using universal code
    const res1 = await ResponseService.submitResponse(
      createdSurveyId,
      { Q_UPDATED: ['AO1'] },
      'ALL-STAFF-2026',
      '127.0.0.1'
    );
    expect(res1).toBeDefined();

    // User 2 submits using THE SAME universal code (must NOT be blocked)
    const res2 = await ResponseService.submitResponse(
      createdSurveyId,
      { Q_UPDATED: ['AO2'] },
      'ALL-STAFF-2026',
      '127.0.0.2'
    );
    expect(res2).toBeDefined();

    // User 3 submits using THE SAME universal code (must NOT be blocked)
    const res3 = await ResponseService.submitResponse(
      createdSurveyId,
      { Q_UPDATED: ['AO3'] },
      'ALL-STAFF-2026',
      '127.0.0.3'
    );
    expect(res3).toBeDefined();

    // Check listBySurvey reports 3 responses collected with this universal code
    const voters = await VoterService.listBySurvey(createdSurveyId);
    const uniInList = voters.find((v) => v.token === 'ALL-STAFF-2026');
    expect(uniInList).toBeDefined();
    expect(uniInList.usesLeft).toBe(-1);
    expect(uniInList._count.responses).toBe(3);
  });

  it('rejects submission when mandatory question is missing', async () => {
    // Make question mandatory again to test rejection
    await prisma.question.update({
      where: { id: testQuestionId },
      data: { mandatory: true },
    });

    await expect(
      ResponseService.submitResponse(createdSurveyId, {}, null, '127.0.0.1')
    ).rejects.toThrow('Please answer all mandatory questions before submitting.');
  });
});
