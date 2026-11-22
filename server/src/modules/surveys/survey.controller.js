import { prisma } from '../../config/db.js';
import { SurveyService } from './survey.service.js';

export class SurveyController {
  static async listPublic(req, res, next) {
    try {
      const surveys = await SurveyService.listPublic();
      return res.status(200).json({ success: true, data: { surveys } });
    } catch (error) {
      next(error);
    }
  }

  static async listAdmin(req, res, next) {
    try {
      const surveys = await SurveyService.listAdmin();
      return res.status(200).json({ success: true, data: { surveys } });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const isAdmin = req.user && req.user.role === 'admin';
      const survey = await SurveyService.getById(req.params.id, isAdmin);

      let tokenSchedule = null;

      if (req.query.token) {
        const tokenStr = String(req.query.token).trim();
        const voter = await prisma.voter.findFirst({
          where: {
            surveyId: parseInt(req.params.id, 10),
            OR: [
              { token: tokenStr },
              { token: tokenStr.toUpperCase() },
            ],
            deletedAt: null,
          },
        });

        if (voter) {
          const now = new Date();
          let status = 'active';
          let message = 'Access code verified and active.';

          if (voter.validFrom && now < new Date(voter.validFrom)) {
            status = 'scheduled';
            message = `Voting is not open yet. Voting opens on ${new Date(voter.validFrom).toLocaleString()}.`;
          } else if (voter.validUntil && now > new Date(voter.validUntil)) {
            status = 'expired';
            message = `The voting deadline for this access code has passed. Voting closed on ${new Date(voter.validUntil).toLocaleString()}.`;
          } else if (voter.completed && voter.usesLeft !== -1 && voter.usesLeft < 999999) {
            status = 'completed';
            message = 'This voter access code has already completed the survey.';
          }

          tokenSchedule = {
            token: voter.token,
            status,
            message,
            validFrom: voter.validFrom,
            validUntil: voter.validUntil,
            isUniversal: voter.usesLeft === -1,
          };
        }
      }

      return res.status(200).json({ success: true, data: { survey, tokenSchedule } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const survey = await SurveyService.create(req.body, req.user.id);
      return res.status(201).json({
        success: true,
        data: { survey, message: 'Survey successfully created.' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const survey = await SurveyService.update(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data: { survey, message: 'Survey successfully updated.' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleActive(req, res, next) {
    try {
      const survey = await SurveyService.toggleActive(req.params.id);
      return res.status(200).json({
        success: true,
        data: {
          survey,
          message: `Survey is now ${survey.active ? 'active' : 'inactive'}.`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const permanent = req.query.permanent === 'true';
      await SurveyService.delete(req.params.id, permanent);
      return res.status(200).json({
        success: true,
        data: {
          message: permanent ? 'Survey permanently deleted.' : 'Survey successfully deleted.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
