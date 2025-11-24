import api from './client';

/**
 * Generate personal mental health report
 * @returns {Promise<Object>} Report data
 */
export const generateReport = async () => {
  try {
    const response = await api.get('/api/report');
    return response;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

/**
 * Get report data with error handling
 * @returns {Promise<Object>} Report data or null if error
 */
export const getReport = async () => {
  try {
    const result = await generateReport();
    if (result.ok) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to generate report');
    }
  } catch (error) {
    console.error('Report generation failed:', error);
    return null;
  }
};
