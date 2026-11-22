import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { SurveyService } from '../src/modules/surveys/survey.service.js';
import { VoterService } from '../src/modules/voters/voter.service.js';
import { ResponseService } from '../src/modules/responses/response.service.js';
import { AuthService } from '../src/modules/auth/auth.service.js';

describe('Access Code Start Time & Deadline Enforcement Tests', () => {
  let testSurveyId;
  let testUser;

  beforeAll(async () => {
    await prisma.$connect();
    testUser = await prisma.user.findFirst();

    const survey = await SurveyService.create(
      {
        title: 'Access Code Schedule Test Survey',
        description: 'Testing start time and deadline enforcement',
        active: true,
        questions: [
          {
            code: 'Q1',
            text: 'Do you agree with the scheduled deadline?',
            type: 'single_choice',
            sortOrder: 1,
            options: [
              { code: 'Y', text: 'Yes', sortOrder: 1 },
              { code: 'N', text: 'No', sortOrder: 2 },
            ],
          },
        ],
      },
      testUser?.id || 1
    );
    testSurveyId = survey.id;
  });

  afterAll(async () => {
    if (testSurveyId) {
      await prisma.response.deleteMany({ where: { surveyId: testSurveyId } });
      await prisma.voter.deleteMany({ where: { surveyId: testSurveyId } });
      await prisma.question.deleteMany({ where: { surveyId: testSurveyId } });
      await prisma.survey.delete({ where: { id: testSurveyId } });
    }
    await prisma.$disconnect();
  });

  it('rejects code creation when start time is after deadline', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await expect(
      VoterService.create(testSurveyId, {
        token: 'INVALID-WINDOW-1',
        validFrom: futureDate.toISOString(),
        validUntil: pastDate.toISOString(),
      })
    ).rejects.toThrow('The start time must be before the deadline.');
  });

  it('blocks voting when current time is before validFrom (future start time)', async () => {
    const futureStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days in future
    const futureDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const voter = await VoterService.create(testSurveyId, {
      token: 'FUTURE-VOTE-1',
      validFrom: futureStart.toISOString(),
      validUntil: futureDeadline.toISOString(),
    });

    expect(voter.validFrom).toBeDefined();
    expect(voter.validUntil).toBeDefined();

    // 1. Check voter login attempt
    await expect(
      AuthService.login({ role: 'voter', identifier: voter.token })
    ).rejects.toThrow(/not active yet/i);

    // 2. Check direct response submission attempt
    await expect(
      ResponseService.submitResponse(testSurveyId, { Q1: 'Y' }, voter.token)
    ).rejects.toThrow(/Voting is not yet open for this access code/i);
  });

  it('blocks voting when current time is after validUntil (passed deadline)', async () => {
    const pastStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const pastDeadline = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    const voter = await VoterService.create(testSurveyId, {
      token: 'EXPIRED-VOTE-1',
      validFrom: pastStart.toISOString(),
      validUntil: pastDeadline.toISOString(),
    });

    // 1. Check voter login attempt
    await expect(
      AuthService.login({ role: 'voter', identifier: voter.token })
    ).rejects.toThrow(/expired/i);

    // 2. Check direct response submission attempt
    await expect(
      ResponseService.submitResponse(testSurveyId, { Q1: 'Y' }, voter.token)
    ).rejects.toThrow(/voting deadline for this access code has passed/i);
  });

  it('allows voting when current time is within active start and deadline window', async () => {
    const activeStart = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const activeDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours in future

    const voter = await VoterService.create(testSurveyId, {
      token: 'ACTIVE-VOTE-1',
      validFrom: activeStart.toISOString(),
      validUntil: activeDeadline.toISOString(),
    });

    // 1. Check voter login succeeds
    const loginResult = await AuthService.login({ role: 'voter', identifier: voter.token });
    expect(loginResult.role).toBe('voter');
    expect(loginResult.user.token).toBe(voter.token);
    expect(loginResult.user.validFrom).toBeDefined();
    expect(loginResult.user.validUntil).toBeDefined();

    // 2. Submit response succeeds
    const response = await ResponseService.submitResponse(testSurveyId, { Q1: 'Y' }, voter.token);
    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
  });

  it('supports setting start time and deadline on universal access codes', async () => {
    const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const universal = await VoterService.generateUniversal(testSurveyId, {
      token: 'ALL-DEADLINE-TEST',
      validFrom: futureStart.toISOString(),
      validUntil: deadline.toISOString(),
    });

    expect(universal.token).toBe('ALL-DEADLINE-TEST');
    expect(universal.usesLeft).toBe(-1);
    expect(universal.validFrom).toBeDefined();
    expect(universal.validUntil).toBeDefined();

    // Blocked before start time
    await expect(
      ResponseService.submitResponse(testSurveyId, { Q1: 'Y' }, 'ALL-DEADLINE-TEST')
    ).rejects.toThrow(/Voting is not yet open/i);
  });

  it('supports setting start time and deadline on batch generated access codes', async () => {
    const pastStart = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const pastDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000);

    const batchVoters = await VoterService.batchGenerate(testSurveyId, {
      count: 3,
      validFrom: pastStart.toISOString(),
      validUntil: pastDeadline.toISOString(),
    });

    expect(batchVoters.length).toBeGreaterThanOrEqual(3);
    const expiredBatchCode = batchVoters.find((v) => v.token.startsWith('TK-'));
    expect(expiredBatchCode).toBeDefined();

    // Blocked after deadline
    await expect(
      ResponseService.submitResponse(testSurveyId, { Q1: 'N' }, expiredBatchCode.token)
    ).rejects.toThrow(/voting deadline for this access code has passed/i);
  });

  it('allows updating deadline and start time on existing access codes', async () => {
    const voter = await VoterService.create(testSurveyId, {
      token: 'UPDATE-SCHEDULE-1',
    });
    expect(voter.validFrom).toBeNull();
    expect(voter.validUntil).toBeNull();

    const newStart = new Date(Date.now() - 3600000);
    const newDeadline = new Date(Date.now() + 86400000);

    const updated = await VoterService.update(voter.id, {
      validFrom: newStart.toISOString(),
      validUntil: newDeadline.toISOString(),
    });

    expect(new Date(updated.validFrom).getTime()).toBe(newStart.getTime());
    expect(new Date(updated.validUntil).getTime()).toBe(newDeadline.getTime());
  });
});
