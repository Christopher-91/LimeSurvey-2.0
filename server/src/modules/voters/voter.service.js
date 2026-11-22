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
    const { email, firstName, lastName, token, voterId, isUniversal, usesLeft, validFrom, validUntil } = data;

    const parsedValidFrom = validFrom ? new Date(validFrom) : null;
    const parsedValidUntil = validUntil ? new Date(validUntil) : null;

    if (parsedValidFrom && isNaN(parsedValidFrom.getTime())) {
      const error = new Error('Invalid start date and time format.');
      error.statusCode = 400;
      throw error;
    }

    if (parsedValidUntil && isNaN(parsedValidUntil.getTime())) {
      const error = new Error('Invalid deadline date and time format.');
      error.statusCode = 400;
      throw error;
    }

    if (parsedValidFrom && parsedValidUntil && parsedValidFrom >= parsedValidUntil) {
      const error = new Error('The start time must be before the deadline.');
      error.statusCode = 400;
      throw error;
    }

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
        validFrom: parsedValidFrom,
        validUntil: parsedValidUntil,
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  static async generateUniversal(surveyId, payload = {}) {
    const sId = parseInt(surveyId, 10);
    const customToken = typeof payload === 'string' ? payload : payload?.token;
    const validFrom = typeof payload === 'object' && payload !== null ? payload.validFrom : null;
    const validUntil = typeof payload === 'object' && payload !== null ? payload.validUntil : null;

    const parsedValidFrom = validFrom ? new Date(validFrom) : null;
    const parsedValidUntil = validUntil ? new Date(validUntil) : null;

    if (parsedValidFrom && isNaN(parsedValidFrom.getTime())) {
      const error = new Error('Invalid start date and time format.');
      error.statusCode = 400;
      throw error;
    }

    if (parsedValidUntil && isNaN(parsedValidUntil.getTime())) {
      const error = new Error('Invalid deadline date and time format.');
      error.statusCode = 400;
      throw error;
    }

    if (parsedValidFrom && parsedValidUntil && parsedValidFrom >= parsedValidUntil) {
      const error = new Error('The start time must be before the deadline.');
      error.statusCode = 400;
      throw error;
    }

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
        validFrom: parsedValidFrom,
        validUntil: parsedValidUntil,
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  static async batchGenerate(surveyId, payload = {}) {
    const sId = parseInt(surveyId, 10);
    const count = typeof payload === 'number' || typeof payload === 'string' ? payload : (payload?.count || 5);
    const validFrom = typeof payload === 'object' && payload !== null ? payload.validFrom : null;
    const validUntil = typeof payload === 'object' && payload !== null ? payload.validUntil : null;

    const parsedValidFrom = validFrom ? new Date(validFrom) : null;
    const parsedValidUntil = validUntil ? new Date(validUntil) : null;

    if (parsedValidFrom && isNaN(parsedValidFrom.getTime())) {
      const error = new Error('Invalid start date and time format.');
      error.statusCode = 400;
      throw error;
    }

    if (parsedValidUntil && isNaN(parsedValidUntil.getTime())) {
      const error = new Error('Invalid deadline date and time format.');
      error.statusCode = 400;
      throw error;
    }

    if (parsedValidFrom && parsedValidUntil && parsedValidFrom >= parsedValidUntil) {
      const error = new Error('The start time must be before the deadline.');
      error.statusCode = 400;
      throw error;
    }

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
        validFrom: parsedValidFrom,
        validUntil: parsedValidUntil,
      });
    }

    await prisma.voter.createMany({
      data: voters,
      skipDuplicates: true,
    });

    return this.listBySurvey(sId);
  }

  static async update(id, data) {
    const numId = parseInt(id, 10);
    const { validFrom, validUntil, email } = data;

    const parsedValidFrom = validFrom !== undefined ? (validFrom ? new Date(validFrom) : null) : undefined;
    const parsedValidUntil = validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : undefined;

    if (parsedValidFrom && isNaN(parsedValidFrom.getTime())) {
      const error = new Error('Invalid start date and time format.');
      error.statusCode = 400;
      throw error;
    }

    if (parsedValidUntil && isNaN(parsedValidUntil.getTime())) {
      const error = new Error('Invalid deadline date and time format.');
      error.statusCode = 400;
      throw error;
    }

    if (parsedValidFrom && parsedValidUntil && parsedValidFrom >= parsedValidUntil) {
      const error = new Error('The start time must be before the deadline.');
      error.statusCode = 400;
      throw error;
    }

    return prisma.voter.update({
      where: { id: numId },
      data: {
        ...(email !== undefined && { email }),
        ...(parsedValidFrom !== undefined && { validFrom: parsedValidFrom }),
        ...(parsedValidUntil !== undefined && { validUntil: parsedValidUntil }),
      },
    });
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


