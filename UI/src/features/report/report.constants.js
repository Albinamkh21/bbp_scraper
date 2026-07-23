// Зеркало серверных констант src/constants/reports.js
// Держим значения в синхроне с бэкендом (см. ReportFactory.js / ExportFactory.js).

export const REPORT_TYPES = {
  PRODUCT_SHORT: 'product_short',
  PRICE_HISTORY: 'price_history',
  SELLER_LIST: 'seller_list',
};

export const REPORT_EXPORT_TYPES = {
  XLS: 'xls',
  CSV: 'csv',
  PDF: 'pdf',
};
