// src/reports/ReportFactory.js
const { REPORT_TYPES } = require('../constants/reports');
const ProductReport = require('./ProductReport');
const PriceHistoryReport = require('./PriceHistoryReport');
const SellerReport = require('./SellerReport');

class ReportFactory {
    /**
     * Returns an instance of the appropriate report class for the given type.
     * @param {string} reportType
     * @returns {ProductReport|PriceHistoryReport|SellerReport}
     */
    static create(reportType) {
        switch (reportType) {
            case REPORT_TYPES.PRODUCT_SHORT:
                return new ProductReport();
            case REPORT_TYPES.PRICE_HISTORY:
                return new PriceHistoryReport();
            case REPORT_TYPES.SELLER_LIST:
                return new SellerReport();
            default:
                throw new Error(`Unknown report type: "${reportType}"`);
        }
    }
}

module.exports = ReportFactory;
