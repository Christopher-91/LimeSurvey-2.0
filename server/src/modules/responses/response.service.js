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

      voterId = voter.id;

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
    }

    // Save unified response with JSONB answers
    const response = await prisma.response.create({
      data: {
        surveyId: sId,
        voterId,
        answers: answers || {},
        ipAddress: ipAddress || null,
        completed: true,
        submitDate: new Date(),
      },
    });

    return response;
  }

  static async listBySurvey(surveyId) {
    const sId = parseInt(surveyId, 10);
    return prisma.response.findMany({
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
  }
}
