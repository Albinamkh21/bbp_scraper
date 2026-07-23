import { httpClient } from '../../../api/httpClient';

/**
 * Fetch product list for filter dropdowns.
 * @returns {Promise<Array<{id: number, title: string, sku: string}>>}
 */
export const getProducts = async () => {
  const { data } = await httpClient.get('/catalog/products');
  return data;
};

/**
 * Fetch category list for filter dropdowns.
 * @returns {Promise<Array<{id: string, name: string, parentId: string|null}>>}
 */
export const getCategories = async () => {
  const { data } = await httpClient.get('/catalog/categories');
  return data;
};

/**
 * Sends a POST request to /reports and triggers a browser file download.
 * The backend returns a binary buffer with Content-Disposition: attachment.
 *
 * @param {{ reportType: string, format: string, filters?: object }} params
 */
export const downloadReport = async ({ reportType, format, filters = {} }) => {
  const response = await httpClient.post(
    '/reports',
    { reportType, format, filters },
    { responseType: 'blob' }
  );

  // Extract filename from Content-Disposition header if present
  const disposition = response.headers['content-disposition'];
  let filename = `report_${reportType}_${Date.now()}`;
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    if (match) filename = match[1].trim();
  }

  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
