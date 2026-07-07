// src/exporters/ExcelExporter.js
const ExcelJS = require('exceljs');

class ExcelExporter {
    /**
     * Converts report data into an Excel buffer.
     * @param {{ columns: string[], rows: object[] }} reportData
     * @returns {Promise<Buffer>}
     */
    async export({ columns, rows }) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Report');

        // Header row
        sheet.columns = columns.map((col) => ({
            header: col,
            key: col,
            width: 30,
        }));

        // Style header
        sheet.getRow(1).font = { bold: true };

        // Data rows
        sheet.addRows(rows);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    get mimeType() {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    get fileExtension() {
        return 'xlsx';
    }
}

module.exports = ExcelExporter;
