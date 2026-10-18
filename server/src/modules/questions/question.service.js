import { prisma } from '../../config/db.js';

export class QuestionService {
  static async addQuestion(surveyId, data) {
    const { code, text, helpText, type, mandatory, sortOrder, groupId, options } = data;
    const sId = parseInt(surveyId, 10);

    // Get next sort order if not provided
    let order = sortOrder;
    if (order === undefined) {
      const count = await prisma.question.count({ where: { surveyId: sId } });
      order = count + 1;
    }

    // Auto-generate code if not provided
    const qCode = code || `Q${order}`;

    return prisma.question.create({
      data: {
        surveyId: sId,
        groupId: groupId ? parseInt(groupId, 10) : null,
        code: qCode,
        text,
        helpText: helpText || '',
        type,
        mandatory: !!mandatory,
        sortOrder: order,
        options: options && options.length > 0
          ? {
              create: options.map((opt, idx) => ({
                code: opt.code || `A${idx + 1}`,
                text: opt.text,
                sortOrder: opt.sortOrder || idx + 1,
                assessmentValue: opt.assessmentValue || 0,
              })),
            }
          : undefined,
      },
      include: {
        options: true,
      },
    });
  }

  static async updateQuestion(id, data) {
    const qId = parseInt(id, 10);
    const { code, text, helpText, type, mandatory, sortOrder, options } = data;

    // If options are provided, update them
    if (options && Array.isArray(options)) {
      await prisma.answerOption.deleteMany({ where: { questionId: qId } });
      if (options.length > 0) {
        await prisma.answerOption.createMany({
          data: options.map((opt, idx) => ({
            questionId: qId,
            code: opt.code || `A${idx + 1}`,
            text: opt.text,
            sortOrder: opt.sortOrder || idx + 1,
            assessmentValue: opt.assessmentValue || 0,
          })),
        });
      }
    }

    return prisma.question.update({
      where: { id: qId },
      data: {
        code,
        text,
        helpText,
        type,
        mandatory: mandatory !== undefined ? !!mandatory : undefined,
        sortOrder,
      },
      include: {
        options: true,
      },
    });
  }

  static async deleteQuestion(id) {
    const qId = parseInt(id, 10);
    return prisma.question.update({
      where: { id: qId },
      data: { deletedAt: new Date() },
    });
  }
}
