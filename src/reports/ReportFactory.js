// src/reports/ReportFactory.js
const { REPORT_TYPES } = require('../constants/reports');
const ProductReport = require('./ProductReport');

class ReportFactory {
    /**
     * Returns an instance of the appropriate report class for the given type.
     * @param {string} reportType
     * @returns {ProductReport}
     */
    static create(reportType) {
        switch (reportType) {
            case REPORT_TYPES.PRODUCT_SHORT:
                return new ProductReport();
            default:
                throw new Error(`Unknown report type: "${reportType}"`);
        }
    }
}

module.exports = ReportFactory;
