const AdminImportService = require('../services/adminImportService');

class AdminImportController {
  static async importCsv(req, res, next) {
    try {
      const importType = String(req.body.import_type || '').trim().toLowerCase();

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required.'
        });
      }

      const result = await AdminImportService.importCsv({
        importType,
        csvBuffer: req.file.buffer,
        createdBy: req.user.id
      });

      return res.status(200).json({
        success: true,
        message: 'CSV import completed.',
        data: {
          result,
          supportedImportTypes: AdminImportService.getSupportedImportTypes(),
          templates: AdminImportService.getTemplateColumns()
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = AdminImportController;
