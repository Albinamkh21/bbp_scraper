// src/api/controllers/ReportController.js
const reportService = require('../../services/ReportService');
const { REPORT_TYPES, REPORT_EXPORT_TYPES } = require('../../constants/reports');

const VALID_REPORT_TYPES = Object.values(REPORT_TYPES);
const VALID_EXPORT_TYPES = Object.values(REPORT_EXPORT_TYPES);

const generateReport = async (req, res, next) => {
    try {
        const { reportType, format, filters = {} } = req.body;

        if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
            return res.status(400).json({
                error: `Параметр reportType обязателен. Допустимые значения: ${VALID_REPORT_TYPES.join(', ')}`,
            });
        }

        if (!format || !VALID_EXPORT_TYPES.includes(format)) {
            return res.status(400).json({
                error: `Параметр format обязателен. Допустимые значения: ${VALID_EXPORT_TYPES.join(', ')}`,
            });
        }

        const { buffer, mimeType, fileExtension } = await reportService.generate({
            reportType,
            format,
            filters,
        });

        const filename = `report_${reportType}_${Date.now()}.${fileExtension}`;

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = { generateReport };
