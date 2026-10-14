import { QuestionService } from './question.service.js';

export class QuestionController {
  static async addQuestion(req, res, next) {
    try {
      const question = await QuestionService.addQuestion(req.params.surveyId, req.body);
      return res.status(201).json({
        success: true,
        data: { question, message: 'Question created successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateQuestion(req, res, next) {
    try {
      const question = await QuestionService.updateQuestion(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data: { question, message: 'Question updated successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteQuestion(req, res, next) {
    try {
      await QuestionService.deleteQuestion(req.params.id);
      return res.status(200).json({
        success: true,
        data: { message: 'Question deleted successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
}
