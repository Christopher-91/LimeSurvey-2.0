import { prisma } from '../../config/db.js';

export class SurveyService {
  static async listPublic() {
    return prisma.survey.findMany({
      where: {
        active: true,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        welcomeMessage: true,
        expires: true,
        startDate: true,
        zeroKnowledgeEnabled: true,
        createdAt: true,
        _count: {
          select: { questions: true, responses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async listAdmin() {
    return prisma.survey.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
            voters: true,
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id, includeAdminData = false) {
    const survey = await prisma.survey.findFirst({
      where: { id: parseInt(id, 10), deletedAt: null },
      include: {
        groups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            questions: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: {
                options: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        questions: {
          where: { groupId: null, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        _count: includeAdminData
          ? {
              select: {
                responses: true,
                voters: true,
                questions: true,
              },
            }
          : undefined,
      },
    });

    if (!survey) {
      const error = new Error('Survey not found');
      error.statusCode = 404;
      throw error;
    }

    return survey;
  }

  static async create(data, ownerId) {
    const {
      title,
      description,
      welcomeMessage,
      welcome_message,
      endMessage,
      end_message,
      active,
      is_active,
      format,
      questions = [],
    } = data;

    const zkEnabled = Boolean(
      data.zero_knowledge_enabled ?? data.zeroKnowledgeEnabled ?? false
    );
    const surveyActive = Boolean(active ?? is_active ?? false);
    const finalWelcome = welcomeMessage || welcome_message || '';
    const finalEnd = endMessage || end_message || '';

    return prisma.$transaction(async (tx) => {
      const survey = await tx.survey.create({
        data: {
          title,
          description: description || '',
          welcomeMessage: finalWelcome,
          endMessage: finalEnd,
          active: surveyActive,
          format: format || 'all_in_one',
          zeroKnowledgeEnabled: zkEnabled,
          ownerId: ownerId || null,
          groups: {
            create: [
              {
                name: 'Default Question Group',
                description: 'Primary group for survey questions',
                sortOrder: 1,
              },
            ],
          },
        },
        include: {
          groups: true,
        },
      });

      const defaultGroupId = survey.groups[0]?.id || null;

      if (Array.isArray(questions) && questions.length > 0) {
        const seenCodes = new Set();
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          let qCode = q.code ? q.code.trim() : `Q${i + 1}`;
          if (seenCodes.has(qCode)) {
            qCode = `${qCode}_${i + 1}`;
          }
          seenCodes.add(qCode);

          const qText = q.text ? q.text.trim() : `Question ${i + 1}`;
          const qType = q.type || 'single_choice';
          const isMandatory = Boolean(q.mandatory);
          const order = q.sortOrder || i + 1;
          const helpText = q.helpText || '';
          const settings = q.settings || null;

          let optionsCreate = undefined;
          if (Array.isArray(q.options) && q.options.length > 0) {
            const seenOptCodes = new Set();
            optionsCreate = {
              create: q.options.map((opt, optIdx) => {
                const rawCode = opt.code || `AO${optIdx + 1}`;
                let optCode = rawCode;
                if (seenOptCodes.has(optCode)) {
                  optCode = `${rawCode}_${optIdx + 1}`;
                }
                seenOptCodes.add(optCode);
                return {
                  code: optCode,
                  text: typeof opt === 'string' ? opt : (opt.text || `Option ${optIdx + 1}`),
                  sortOrder: opt.sortOrder || optIdx + 1,
                  assessmentValue: opt.assessmentValue || 0,
                };
              }),
            };
          }

          await tx.question.create({
            data: {
              surveyId: survey.id,
              groupId: defaultGroupId,
              code: qCode,
              text: qText,
              helpText,
              type: qType,
              mandatory: isMandatory,
              sortOrder: order,
              settings,
              options: optionsCreate,
            },
          });
        }
      }

      return tx.survey.findUnique({
        where: { id: survey.id },
        include: {
          groups: {
            include: {
              questions: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
                include: {
                  options: {
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
          questions: {
            where: { groupId: null, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              options: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });
    });
  }

  static async update(id, data) {
    const surveyId = parseInt(id, 10);
    const updateData = { ...data };

    if ('zero_knowledge_enabled' in updateData) {
      updateData.zeroKnowledgeEnabled = Boolean(updateData.zero_knowledge_enabled);
      delete updateData.zero_knowledge_enabled;
    }
    if ('is_active' in updateData) {
      updateData.active = Boolean(updateData.is_active);
      delete updateData.is_active;
    }
    if ('welcome_message' in updateData) {
      updateData.welcomeMessage = updateData.welcome_message;
      delete updateData.welcome_message;
    }
    if ('end_message' in updateData) {
      updateData.endMessage = updateData.end_message;
      delete updateData.end_message;
    }

    const questions = updateData.questions;
    delete updateData.questions;

    return prisma.$transaction(async (tx) => {
      const updatedSurvey = await tx.survey.update({
        where: { id: surveyId },
        data: updateData,
        include: { groups: true },
      });

      if (Array.isArray(questions)) {
        const defaultGroupId = updatedSurvey.groups[0]?.id || null;

        const existingQuestions = await tx.question.findMany({
          where: { surveyId, deletedAt: null },
        });
        const existingIds = existingQuestions.map((q) => q.id);
        const incomingIds = questions
          .filter((q) => q.id && !String(q.id).startsWith('temp-'))
          .map((q) => parseInt(q.id, 10));

        const toDeleteIds = existingIds.filter((eid) => !incomingIds.includes(eid));
        if (toDeleteIds.length > 0) {
          await tx.question.updateMany({
            where: { id: { in: toDeleteIds } },
            data: { deletedAt: new Date() },
          });
        }

        const seenCodes = new Set();
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          let qCode = q.code ? q.code.trim() : `Q${i + 1}`;
          if (seenCodes.has(qCode)) {
            qCode = `${qCode}_${i + 1}`;
          }
          seenCodes.add(qCode);

          const qText = q.text ? q.text.trim() : `Question ${i + 1}`;
          const qType = q.type || 'single_choice';
          const isMandatory = Boolean(q.mandatory);
          const order = i + 1;
          const helpText = q.helpText || '';
          const settings = q.settings || null;

          const optionsList = Array.isArray(q.options)
            ? q.options.map((opt, optIdx) => {
                const rawCode = opt.code || `AO${optIdx + 1}`;
                return {
                  code: rawCode,
                  text: typeof opt === 'string' ? opt : (opt.text || `Option ${optIdx + 1}`),
                  sortOrder: opt.sortOrder || optIdx + 1,
                  assessmentValue: opt.assessmentValue || 0,
                };
              })
            : [];

          const hasRealId = q.id && !String(q.id).startsWith('temp-') && existingIds.includes(parseInt(q.id, 10));

          if (hasRealId) {
            const qId = parseInt(q.id, 10);
            await tx.question.update({
              where: { id: qId },
              data: {
                code: qCode,
                text: qText,
                helpText,
                type: qType,
                mandatory: isMandatory,
                sortOrder: order,
                settings,
              },
            });

            await tx.answerOption.deleteMany({ where: { questionId: qId } });
            if (optionsList.length > 0) {
              await tx.answerOption.createMany({
                data: optionsList.map((opt) => ({
                  ...opt,
                  questionId: qId,
                })),
              });
            }
          } else {
            await tx.question.create({
              data: {
                surveyId,
                groupId: defaultGroupId,
                code: qCode,
                text: qText,
                helpText,
                type: qType,
                mandatory: isMandatory,
                sortOrder: order,
                settings,
                options: optionsList.length > 0
                  ? {
                      create: optionsList,
                    }
                  : undefined,
              },
            });
          }
        }
      }

      return tx.survey.findUnique({
        where: { id: surveyId },
        include: {
          groups: {
            include: {
              questions: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
                include: {
                  options: {
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
          questions: {
            where: { groupId: null, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              options: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });
    });
  }

  static async toggleActive(id) {
    const surveyId = parseInt(id, 10);
    const existing = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!existing) {
      const error = new Error('Survey not found');
      error.statusCode = 404;
      throw error;
    }
    return prisma.survey.update({
      where: { id: surveyId },
      data: { active: !existing.active },
    });
  }

  static async delete(id, permanent = false) {
    const surveyId = parseInt(id, 10);
    if (isNaN(surveyId)) {
      const error = new Error('Invalid survey ID provided');
      error.statusCode = 400;
      throw error;
    }

    const existing = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!existing) {
      const error = new Error('Survey not found or already deleted');
      error.statusCode = 404;
      throw error;
    }

    if (permanent) {
      return prisma.survey.delete({
        where: { id: surveyId },
      });
    }

    return prisma.survey.update({
      where: { id: surveyId },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
  }
}
