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
    const { title, description, welcomeMessage, endMessage, active, format } = data;
    const zkEnabled = Boolean(data.zero_knowledge_enabled ?? data.zeroKnowledgeEnabled ?? false);
    return prisma.survey.create({
      data: {
        title,
        description: description || '',
        welcomeMessage: welcomeMessage || '',
        endMessage: endMessage || '',
        active: active ?? false,
        format: format || 'all_in_one',
        zeroKnowledgeEnabled: zkEnabled,
        ownerId,
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
  }

  static async update(id, data) {
    const surveyId = parseInt(id, 10);
    const updateData = { ...data };
    if ('zero_knowledge_enabled' in updateData) {
      updateData.zeroKnowledgeEnabled = Boolean(updateData.zero_knowledge_enabled);
      delete updateData.zero_knowledge_enabled;
    }
    return prisma.survey.update({
      where: { id: surveyId },
      data: updateData,
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
