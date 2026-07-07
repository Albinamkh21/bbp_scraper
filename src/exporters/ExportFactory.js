// src/exporters/ExportFactory.js
const { REPORT_EXPORT_TYPES } = require('../constants/reports');
const ExcelExporter = require('./ExcelExporter');

class ExportFactory {
    /**
     * Returns an instance of the appropriate exporter for the given format.
     * @param {string} format
     * @returns {ExcelExporter}
     */
    static create(format) {
        switch (format) {
            case REPORT_EXPORT_TYPES.XLS:
                return new ExcelExporter();
            default:
                throw new Error(`Unknown export format: "${format}"`);
        }
    }
}

module.exports = ExportFactory;
