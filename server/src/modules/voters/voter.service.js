import crypto from 'crypto';
import { prisma } from '../../config/db.js';

export class VoterService {
  static async listBySurvey(surveyId) {
    const sId = parseInt(surveyId, 10);
    return prisma.voter.findMany({
      where: { surveyId: sId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(surveyId, data) {
    const sId = parseInt(surveyId, 10);
    const { email, firstName, lastName, token, voterId } = data;

    // Generate random 12-char token if not provided
    const voterToken = token || crypto.randomBytes(6).toString('hex').toUpperCase();

    return prisma.voter.create({
      data: {
        surveyId: sId,
        voterId: voterId || `VOTER-${Date.now().toString().slice(-4)}`,
        token: voterToken,
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        usesLeft: 1,
        completed: false,
      },
    });
  }

  static async batchGenerate(surveyId, count = 5) {
    const sId = parseInt(surveyId, 10);
    const voters = [];
    for (let i = 0; i < count; i++) {
      const token = `TK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      voters.push({
        surveyId: sId,
        voterId: `VOTER-${Date.now().toString().slice(-4)}-${i + 1}`,
        token,
        usesLeft: 1,
        completed: false,
      });
    }

    await prisma.voter.createMany({
      data: voters,
      skipDuplicates: true,
    });

    return this.listBySurvey(sId);
  }

  static async delete(id) {
    return prisma.voter.update({
      where: { id: parseInt(id, 10) },
      data: { deletedAt: new Date() },
    });
  }
}
