import crypto from 'crypto';
import { prisma } from '../../config/db.js';

export class VoterService {
  static async listBySurvey(surveyId) {
    const sId = parseInt(surveyId, 10);
    return prisma.voter.findMany({
      where: { surveyId: sId, deletedAt: null },
      include: {
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(surveyId, data) {
    const sId = parseInt(surveyId, 10);
    const { email, firstName, lastName, token, voterId, isUniversal, usesLeft } = data;

    const isUni = Boolean(isUniversal || usesLeft === -1 || data.type === 'universal');

    // Generate token if not provided
    const voterToken = (token && token.trim())
      ? token.trim()
      : isUni
      ? `ALL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
      : crypto.randomBytes(6).toString('hex').toUpperCase();

    return prisma.voter.create({
      data: {
        surveyId: sId,
        voterId: voterId || (isUni ? `UNIVERSAL-${Date.now().toString().slice(-4)}` : `VOTER-${Date.now().toString().slice(-4)}`),
        token: voterToken,
        email: email || (isUni ? 'All Participants (Shared Code)' : null),
        firstName: firstName || null,
        lastName: lastName || null,
        usesLeft: isUni ? -1 : (usesLeft ? parseInt(usesLeft, 10) : 1),
        completed: false,
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  static async generateUniversal(surveyId, customToken) {
    const sId = parseInt(surveyId, 10);
    const token = (customToken && customToken.trim())
      ? customToken.trim()
      : `ALL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    return prisma.voter.create({
      data: {
        surveyId: sId,
        voterId: `UNIVERSAL-${Date.now().toString().slice(-4)}`,
        token,
        email: 'All Participants (Shared Code)',
        usesLeft: -1,
        completed: false,
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  static async batchGenerate(surveyId, count = 5) {
    const sId = parseInt(surveyId, 10);
    const numCount = Math.max(1, Math.min(parseInt(count, 10) || 5, 1000));
    const voters = [];
    for (let i = 0; i < numCount; i++) {
      const token = `TK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      voters.push({
        surveyId: sId,
        voterId: `VOTER-${Date.now().toString().slice(-4)}-${i + 1}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        token,
        usesLeft: 1, // Single-use: exactly one person per code
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
    const numId = parseInt(id, 10);
    const isNum = !isNaN(numId) && String(numId) === String(id).trim();

    if (isNum) {
      return prisma.voter.update({
        where: { id: numId },
        data: { deletedAt: new Date() },
      });
    }

    return prisma.voter.updateMany({
      where: {
        OR: [
          { token: String(id).trim() },
          { voterId: String(id).trim() },
        ],
      },
      data: { deletedAt: new Date() },
    });
  }

  static async deleteAll(surveyId) {
    const sId = parseInt(surveyId, 10);
    return prisma.voter.updateMany({
      where: { surveyId: sId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}


