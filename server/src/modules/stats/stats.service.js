import { prisma } from '../../config/db.js';

export class StatsService {
  static async getSurveyStatistics(surveyId) {
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

    const responses = await prisma.response.findMany({
      where: { surveyId: sId },
      orderBy: { submitDate: 'desc' },
    });

    const allQuestions = [
      ...survey.questions,
      ...survey.groups.flatMap((g) => g.questions),
    ];

    const questionStats = allQuestions.map((q) => {
      const answersForQ = responses
        .map((r) => r.answers?.[q.code] ?? r.answers?.[q.id])
        .filter((val) => val !== undefined && val !== null && val !== '');

      const totalAnswered = answersForQ.length;

      // Stats for Choice Questions (Single, Multiple, Yes/No)
      if (['single_choice', 'multiple_choice', 'yes_no', 'rating'].includes(q.type)) {
        const optionCounts = {};

        // Initialize option counts
        if (q.options && q.options.length > 0) {
          q.options.forEach((opt) => {
            optionCounts[opt.code] = {
              code: opt.code,
              text: opt.text,
              count: 0,
              percentage: 0,
            };
          });
        } else if (q.type === 'yes_no') {
          optionCounts['Y'] = { code: 'Y', text: 'Yes', count: 0, percentage: 0 };
          optionCounts['N'] = { code: 'N', text: 'No', count: 0, percentage: 0 };
        } else if (q.type === 'rating') {
          for (let i = 1; i <= 5; i++) {
            optionCounts[String(i)] = { code: String(i), text: `${i} Stars`, count: 0, percentage: 0 };
          }
        }

        // Tally answers
        answersForQ.forEach((answer) => {
          if (Array.isArray(answer)) {
            answer.forEach((item) => {
              if (optionCounts[item]) {
                optionCounts[item].count += 1;
              } else {
                optionCounts[item] = { code: item, text: item, count: 1, percentage: 0 };
              }
            });
          } else {
            const key = String(answer);
            if (optionCounts[key]) {
              optionCounts[key].count += 1;
            } else {
              optionCounts[key] = { code: key, text: key, count: 1, percentage: 0 };
            }
          }
        });

        // Compute percentages
        Object.values(optionCounts).forEach((opt) => {
          opt.percentage = totalAnswered > 0 ? Math.round((opt.count / totalAnswered) * 100) : 0;
        });

        // Average for rating
        let averageRating = null;
        if (q.type === 'rating' && totalAnswered > 0) {
          const sum = answersForQ.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
          averageRating = (sum / totalAnswered).toFixed(1);
        }

        return {
          questionId: q.id,
          code: q.code,
          text: q.text,
          type: q.type,
          totalAnswered,
          options: Object.values(optionCounts),
          averageRating,
        };
      }

      // For Text or Other questions
      return {
        questionId: q.id,
        code: q.code,
        text: q.text,
        type: q.type,
        totalAnswered,
        recentResponses: answersForQ.slice(0, 10),
      };
    });

    return {
      surveyId: survey.id,
      title: survey.title,
      totalResponses: responses.length,
      totalVoters: survey._count.voters,
      completionRate:
        survey._count.voters > 0
          ? Math.round((responses.length / survey._count.voters) * 100)
          : 100,
      questions: questionStats,
    };
  }
}
