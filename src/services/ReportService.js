// src/services/ReportService.js
const ReportFactory = require('../reports/ReportFactory');
const ExportFactory = require('../exporters/ExportFactory');

class ReportService {
    /**
     * Generates and exports a report.
     * @param {{ reportType: string, format: string, filters?: object }} options
     * @returns {Promise<{ buffer: Buffer, mimeType: string, fileExtension: string }>}
     */
    async generate({ reportType, format, filters = {} }) {
        const report = ReportFactory.create(reportType);
        const exporter = ExportFactory.create(format);

        const reportData = await report.generate(filters);
        const buffer = await exporter.export(reportData);

        return {
            buffer,
            mimeType: exporter.mimeType,
            fileExtension: exporter.fileExtension,
        };
    }
}

module.exports = new ReportService();
