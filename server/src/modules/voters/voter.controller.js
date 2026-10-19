import { VoterService } from './voter.service.js';

export class VoterController {
  static async listBySurvey(req, res, next) {
    try {
      const voters = await VoterService.listBySurvey(req.params.surveyId);
      return res.status(200).json({ success: true, data: { voters } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const voter = await VoterService.create(req.params.surveyId, req.body);
      return res.status(201).json({
        success: true,
        data: { voter, message: 'Voter access code created.' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateUniversal(req, res, next) {
    try {
      const voter = await VoterService.generateUniversal(req.params.surveyId, req.body.token);
      return res.status(201).json({
        success: true,
        data: { voter, message: 'Universal access code created for all participants.' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async batchGenerate(req, res, next) {
    try {
      const count = req.body.count ? parseInt(req.body.count, 10) : 5;
      const voters = await VoterService.batchGenerate(req.params.surveyId, count);
      return res.status(201).json({
        success: true,
        data: { voters, message: `Generated ${count} voter access tokens.` },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await VoterService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        data: { message: 'Voter removed.' },
      });
    } catch (error) {
      next(error);
    }
  }
}
