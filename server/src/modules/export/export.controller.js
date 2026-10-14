import { ExportService } from './export.service.js';

export class ExportController {
  static async exportResponses(req, res, next) {
    try {
      const { surveyId } = req.params;
      const { format = 'csv' } = req.query;

      const result = await ExportService.exportResponses(surveyId, format);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
}
