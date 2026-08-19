import { useState, useEffect, useCallback } from 'react';
import {
  fetchTimelineData,
  fetchOngoingProjects,
  fetchTeamProgress,
  fetchRecentFiles
} from '../services/dashboardService';

/**
 * Generic hook for fetching dashboard data
 * @param {Function} fetchFunction - The service function to call
 * @param {any} initialData - Initial state for data
 */
export const useDashboardData = (fetchFunction, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
      // Set to fallback initial data on error to prevent UI crashes if needed
      if (data === null && initialData !== null) {
          setData(initialData);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, initialData, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Specific hooks for each widget
export const useDashboardTimeline = () => {
  return useDashboardData(fetchTimelineData, []);
};

export const useOngoingProjects = () => {
  return useDashboardData(fetchOngoingProjects, []);
};

export const useTeamProgress = () => {
  return useDashboardData(fetchTeamProgress, []);
};

export const useRecentFiles = () => {
  return useDashboardData(fetchRecentFiles, []);
};
