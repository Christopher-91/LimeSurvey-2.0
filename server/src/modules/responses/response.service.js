import { prisma } from '../../config/db.js';

export class ResponseService {
  static async submitResponse(surveyId, answers, token, ipAddress) {
    const sId = parseInt(surveyId, 10);

    const survey = await prisma.survey.findFirst({
      where: { id: sId, deletedAt: null },
      include: {
        questions: {
          where: { deletedAt: null },
        },
        groups: {
          include: {
            questions: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!survey || !survey.active) {
      const error = new Error('This survey is currently closed or inactive.');
      error.statusCode = 403;
      throw error;
    }

    // Collect all active questions
    const allQuestions = [
      ...survey.questions,
      ...survey.groups.flatMap((g) => g.questions),
    ];

    // Validate mandatory questions
    const mandatoryQuestions = allQuestions.filter((q) => q.mandatory);
    const missingFields = [];

    for (const q of mandatoryQuestions) {
      const val = answers[q.code] ?? answers[q.id];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        missingFields.push({
          questionId: q.id,
          code: q.code,
          text: q.text,
          message: `Question "${q.text}" is required.`,
        });
      }
    }

    if (missingFields.length > 0) {
      const error = new Error('Please answer all mandatory questions before submitting.');
      error.statusCode = 400;
      error.details = missingFields;
      throw error;
    }

    let voterId = null;

    // Check token if provided
    if (token) {
      const voter = await prisma.voter.findFirst({
        where: {
          surveyId: sId,
          OR: [
            { token: token.trim() },
            { token: token.trim().toUpperCase() },
          ],
          deletedAt: null,
        },
      });

      if (!voter) {
        const error = new Error('Invalid or expired voter access code.');
        error.statusCode = 401;
        throw error;
      }

      const isUnlimited = voter.usesLeft === -1 || voter.usesLeft >= 999999;

      if (!isUnlimited && voter.completed && voter.usesLeft <= 0) {
        const error = new Error('This voter access code has already completed the survey.');
        error.statusCode = 400;
        throw error;
      }

      // Update voter status
      if (!isUnlimited) {
        await prisma.voter.update({
          where: { id: voter.id },
          data: {
            completed: true,
            completedAt: new Date(),
            usesLeft: Math.max(0, voter.usesLeft - 1),
          },
        });
      } else {
        await prisma.voter.update({
          where: { id: voter.id },
          data: {
            completedAt: new Date(),
          },
        });
      }

      // If Zero Knowledge Protocol is ENABLED:
      // Strictly decouple voter identity from the response payload.
      // Voter attendance is recorded above, but the response remains anonymous.
      if (!survey.zeroKnowledgeEnabled) {
        voterId = voter.id;
      } else {
        voterId = null;
      }
    }

    // Save response with JSONB answers
    const response = await prisma.response.create({
      data: {
        surveyId: sId,
        voterId, // null when zeroKnowledgeEnabled is true
        answers: answers || {},
        ipAddress: survey.zeroKnowledgeEnabled ? null : (ipAddress || null),
        completed: true,
        submitDate: new Date(),
      },
    });

    return response;
  }

  static async listBySurvey(surveyId, query = {}) {
    const sId = parseInt(surveyId, 10);

    const survey = await prisma.survey.findUnique({
      where: { id: sId },
      select: { id: true, zeroKnowledgeEnabled: true, title: true },
    });

    if (!survey) {
      const error = new Error('Survey not found');
      error.statusCode = 404;
      throw error;
    }

    // Standard behavior when Zero Knowledge Protocol is disabled
    if (!survey.zeroKnowledgeEnabled) {
      const responses = await prisma.response.findMany({
        where: { surveyId: sId },
        include: {
          voter: {
            select: {
              id: true,
              voterId: true,
              token: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { submitDate: 'desc' },
      });

      return {
        zeroKnowledgeEnabled: false,
        responses,
      };
    }

    // Zero Knowledge Protocol is ACTIVE:
    // Strictly decouple into two mutually exclusive views.
    const view = query.view === 'attendance' ? 'attendance' : 'ghost_comments';

    if (view === 'attendance') {
      // View 2: User Profiles (Attendance) Data
      // Returns ONLY voter profiles sorted alphabetically by name + participation counts.
      // Strip out all comment / answer JSONB data.
      const voters = await prisma.voter.findMany({
        where: { surveyId: sId, deletedAt: null },
        select: {
          id: true,
          voterId: true,
          firstName: true,
          lastName: true,
          email: true,
          completed: true,
          completedAt: true,
        },
      });

      const totalSubmissions = await prisma.response.count({
        where: { surveyId: sId },
      });

      const formattedVoters = voters.map((v) => {
        const nameParts = [v.firstName, v.lastName].filter(Boolean);
        const name = nameParts.length > 0 ? nameParts.join(' ') : (v.email ? v.email.split('@')[0] : (v.voterId || 'Participant'));
        return {
          id: v.id,
          voterId: v.voterId,
          name,
          email: v.email || '—',
          has_completed: v.completed,
          completedAt: v.completedAt,
        };
      });

      // Sort alphabetically by name
      formattedVoters.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

      return {
        zeroKnowledgeEnabled: true,
        view: 'attendance',
        participation: {
          totalSubmissions,
          assignedVoters: voters.length,
          completionRate: voters.length > 0 ? Math.round((totalSubmissions / voters.length) * 100) : 100,
        },
        voters: formattedVoters,
      };
    }

    // View 1 (Default): Ghost Comments Data
    // Returns ONLY feedback/comments in a randomized (shuffled) order.
    // Strip out all user_id, voter, name, email, ipAddress, and correlating timestamps.
    const rawResponses = await prisma.response.findMany({
      where: { surveyId: sId },
      select: {
        answers: true,
      },
    });

    // Fisher-Yates shuffle
    const shuffled = [...rawResponses];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const ghostComments = shuffled.map((r, index) => ({
      id: `ghost-${index + 1}`,
      answers: r.answers || {},
      author: 'Anonymous Voter',
      isAnonymous: true,
    }));

    return {
      zeroKnowledgeEnabled: true,
      view: 'ghost_comments',
      totalComments: ghostComments.length,
      comments: ghostComments,
      responses: ghostComments, // Backwards compatible alias
    };
  }
}
