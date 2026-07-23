import React, { useState } from 'react';
import { useTaskLogs } from '../../hooks/useTaskLogs';
import TaskLogsPanel from '../../components/TaskLogsPanel';
import { REPORT_TYPES, REPORT_EXPORT_TYPES } from './report.constants';
import ProductFilters, { PRODUCT_FILTERS_DEFAULTS } from './components/ProductFilters';
import PriceFilters, { PRICE_FILTERS_DEFAULTS } from './components/PriceFilters';
import SellerFilters, { SELLER_FILTERS_DEFAULTS } from './components/SellerFilters';
import { downloadReport } from './api/report.api';
import './report.css';

// === Frontend Factory — mirrors src/reports/ReportFactory.js on the backend ===
const REPORT_REGISTRY = {
  [REPORT_TYPES.PRODUCT_SHORT]: {
    label: 'Краткий отчёт по товарам',
    FiltersComponent: ProductFilters,
    defaultFilters: PRODUCT_FILTERS_DEFAULTS,
  },
  [REPORT_TYPES.PRICE_HISTORY]: {
    label: 'История цен',
    FiltersComponent: PriceFilters,
    defaultFilters: PRICE_FILTERS_DEFAULTS,
  },
  [REPORT_TYPES.SELLER_LIST]: {
    label: 'Список продавцов',
    FiltersComponent: SellerFilters,
    defaultFilters: SELLER_FILTERS_DEFAULTS,
  },
};

const FORMAT_OPTIONS = [
  { value: REPORT_EXPORT_TYPES.XLS, label: 'XLS (Excel)' },
  { value: REPORT_EXPORT_TYPES.CSV, label: 'CSV' },
  { value: REPORT_EXPORT_TYPES.PDF, label: 'PDF' },
];

const INITIAL_TYPE = REPORT_TYPES.PRODUCT_SHORT;

export function ReportPage() {
  const [reportType, setReportType] = useState(INITIAL_TYPE);
  const [format, setFormat] = useState(REPORT_EXPORT_TYPES.XLS);
  const [filters, setFilters] = useState(REPORT_REGISTRY[INITIAL_TYPE].defaultFilters);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);

  const { logs, setLogs } = useTaskLogs(activeTaskId);

  const handleReportTypeChange = (newType) => {
    setReportType(newType);
    setFilters(REPORT_REGISTRY[newType].defaultFilters);
    setMessage('');
    setIsError(false);
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      await downloadReport({ reportType, format, filters });
      setMessage('✅ Отчёт успешно сформирован и скачан.');
      setIsError(false);
    } catch (err) {
      console.error(err);
      // When responseType is 'blob', error response data is also a Blob — read it as text
      let errText = null;
      if (err?.response?.data instanceof Blob) {
        errText = await err.response.data.text().catch(() => null);
      }
      let parsed = null;
      try { parsed = errText ? JSON.parse(errText) : null; } catch {}
      setMessage(parsed?.error || err.message || 'Ошибка при формировании отчёта');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const { FiltersComponent } = REPORT_REGISTRY[reportType];

  return (
    <div className="page-container">
      <h2 className="page-title">Отчёты</h2>

      {/* Вкладки — Frontend Factory: переключают тип отчёта и сбрасывают фильтры */}
      <div className="report-tabs">
        {Object.entries(REPORT_REGISTRY).map(([type, cfg]) => (
          <button
            key={type}
            type="button"
            className={`report-tab-btn${reportType === type ? ' report-tab-btn--active' : ''}`}
            onClick={() => handleReportTypeChange(type)}
            disabled={loading}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleDownload} className="action-section">

        {/* Формат выгрузки */}
        <div className="form-group">
          <label className="form-label" htmlFor="report-format">Формат выгрузки</label>
          <select
            id="report-format"
            className="form-control"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            disabled={loading}
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <hr className="divider" />

        {/* Динамические фильтры — определяются активным типом отчёта */}
        <FiltersComponent
          filters={filters}
          onChange={setFilters}
          disabled={loading}
        />

        <div className="form-group" style={{ marginTop: '8px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="report-spinner" />
                Формирование...
              </>
            ) : (
              '⬇ Скачать отчёт'
            )}
          </button>
        </div>
      </form>

      {message && (
        <div className={`alert-message${isError ? ' error' : ''}`} style={isError ? { borderLeftColor: '#dc2626', background: '#fef2f2', color: '#991b1b' } : {}}>
          {message}
        </div>
      )}

      <TaskLogsPanel
        activeTaskId={activeTaskId}
        logs={logs}
        onClose={() => { setActiveTaskId(null); setLogs([]); }}
      />
    </div>
  );
}

export default ReportPage;
