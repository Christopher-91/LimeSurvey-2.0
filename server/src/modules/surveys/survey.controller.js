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
      return res.status(200).json({ success: true, data: { survey } });
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
