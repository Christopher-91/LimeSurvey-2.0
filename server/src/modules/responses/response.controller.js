import { ResponseService } from './response.service.js';

export class ResponseController {
  static async submitResponse(req, res, next) {
    try {
      const { surveyId } = req.params;
      const { answers, token } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const response = await ResponseService.submitResponse(surveyId, answers, token, ipAddress);

      return res.status(201).json({
        success: true,
        data: {
          responseId: response.id,
          message: 'Thank you! Your survey responses have been securely submitted.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listBySurvey(req, res, next) {
    try {
      const responses = await ResponseService.listBySurvey(req.params.surveyId);
      return res.status(200).json({
        success: true,
        data: { responses },
      });
    } catch (error) {
      next(error);
    }
  }
}
