import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { ResponseService } from '../src/modules/responses/response.service.js';
import { StatsService } from '../src/modules/stats/stats.service.js';
import { SurveyService } from '../src/modules/surveys/survey.service.js';
import { VoterService } from '../src/modules/voters/voter.service.js';

describe('Zero Knowledge Protocol Backend Tests', () => {
  let zkSurveyId;
  let standardSurveyId;
  let voter1, voter2, voter3;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (zkSurveyId) {
      await prisma.survey.delete({ where: { id: zkSurveyId } }).catch(() => {});
    }
    if (standardSurveyId) {
      await prisma.survey.delete({ where: { id: standardSurveyId } }).catch(() => {});
    }
  });

  it('creates a survey with zero_knowledge_enabled: true', async () => {
    const survey = await SurveyService.create(
      {
        title: 'Secret Ballot Executive Review',
        description: 'Zero Knowledge survey testing',
        active: true,
        zero_knowledge_enabled: true,
      },
      null
    );

    expect(survey).toBeDefined();
    expect(survey.zeroKnowledgeEnabled).toBe(true);
    zkSurveyId = survey.id;

    // Create a question
    await prisma.question.create({
      data: {
        surveyId: zkSurveyId,
        code: 'FEEDBACK',
        text: 'Anonymous leadership feedback',
        type: 'long_text',
        mandatory: false,
      },
    });
  });

  it('proves voter token submission decouples voterId and ipAddress in database when ZK is active', async () => {
    // Create voters
    voter1 = await VoterService.create(zkSurveyId, {
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@peanuts.com',
    });
    voter2 = await VoterService.create(zkSurveyId, {
      firstName: 'Alice',
      lastName: 'Wonderland',
      email: 'alice@wonderland.com',
    });
    voter3 = await VoterService.create(zkSurveyId, {
      firstName: 'Bob',
      lastName: 'Builder',
      email: 'bob@builder.com',
    });

    // Voter 1 submits
    const response1 = await ResponseService.submitResponse(
      zkSurveyId,
      { FEEDBACK: 'Great vision and culture!' },
      voter1.token,
      '192.168.1.50'
    );

    // Voter 2 submits
    const response2 = await ResponseService.submitResponse(
      zkSurveyId,
      { FEEDBACK: 'Need more communication on roadmap.' },
      voter2.token,
      '192.168.1.51'
    );

    // Verify response objects in database have voterId: null and ipAddress: null
    const dbResp1 = await prisma.response.findUnique({ where: { id: response1.id } });
    expect(dbResp1.voterId).toBeNull();
    expect(dbResp1.ipAddress).toBeNull();

    // Verify voter1 and voter2 have completed: true (attendance recorded)
    const updatedVoter1 = await prisma.voter.findUnique({ where: { id: voter1.id } });
    const updatedVoter2 = await prisma.voter.findUnique({ where: { id: voter2.id } });
    const updatedVoter3 = await prisma.voter.findUnique({ where: { id: voter3.id } });

    expect(updatedVoter1.completed).toBe(true);
    expect(updatedVoter2.completed).toBe(true);
    expect(updatedVoter3.completed).toBe(false);
  });

  it('returns Ghost Comments Data: randomized, no voter identity, no timestamps', async () => {
    const result = await ResponseService.listBySurvey(zkSurveyId, { view: 'ghost_comments' });

    expect(result.zeroKnowledgeEnabled).toBe(true);
    expect(result.view).toBe('ghost_comments');
    expect(result.comments).toHaveLength(2);

    // Comments must NOT contain voter, email, name, ipAddress, submitDate
    result.comments.forEach((c) => {
      expect(c.voter).toBeUndefined();
      expect(c.email).toBeUndefined();
      expect(c.name).toBeUndefined();
      expect(c.ipAddress).toBeUndefined();
      expect(c.submitDate).toBeUndefined();
      expect(c.author).toBe('Anonymous Voter');
      expect(c.isAnonymous).toBe(true);
      expect(c.answers).toBeDefined();
    });
  });

  it('returns User Profiles (Attendance) Data: alphabetically sorted, no comment payloads', async () => {
    const result = await ResponseService.listBySurvey(zkSurveyId, { view: 'attendance' });

    expect(result.zeroKnowledgeEnabled).toBe(true);
    expect(result.view).toBe('attendance');
    expect(result.participation.totalSubmissions).toBe(2);
    expect(result.participation.assignedVoters).toBe(3);
    expect(result.participation.completionRate).toBe(67);

    expect(result.voters).toHaveLength(3);

    // Must be sorted alphabetically: Alice Wonderland, Bob Builder, Charlie Brown
    expect(result.voters[0].name).toBe('Alice Wonderland');
    expect(result.voters[0].has_completed).toBe(true);
    expect(result.voters[1].name).toBe('Bob Builder');
    expect(result.voters[1].has_completed).toBe(false);
    expect(result.voters[2].name).toBe('Charlie Brown');
    expect(result.voters[2].has_completed).toBe(true);

    // Must NOT contain answers or comments
    result.voters.forEach((v) => {
      expect(v.answers).toBeUndefined();
      expect(v.comments).toBeUndefined();
      expect(v.feedback).toBeUndefined();
    });
  });

  it('returns standard responses when Zero Knowledge Protocol is disabled', async () => {
    const survey = await SurveyService.create(
      {
        title: 'Standard Non-ZK Survey',
        active: true,
        zero_knowledge_enabled: false,
      },
      null
    );
    standardSurveyId = survey.id;

    const voter = await VoterService.create(standardSurveyId, {
      firstName: 'Standard',
      lastName: 'User',
      email: 'standard@example.com',
    });

    await ResponseService.submitResponse(
      standardSurveyId,
      { test: 'sample answer' },
      voter.token,
      '127.0.0.1'
    );

    const result = await ResponseService.listBySurvey(standardSurveyId);
    expect(result.zeroKnowledgeEnabled).toBe(false);
    expect(result.responses).toHaveLength(1);
    expect(result.responses[0].voter).toBeDefined();
    expect(result.responses[0].voter.email).toBe('standard@example.com');
  });

  it('includes zeroKnowledgeEnabled in StatsService payload', async () => {
    const stats = await StatsService.getSurveyStatistics(zkSurveyId);
    expect(stats.zeroKnowledgeEnabled).toBe(true);
    expect(stats.totalResponses).toBe(2);
    expect(stats.totalVoters).toBe(3);
  });
});
