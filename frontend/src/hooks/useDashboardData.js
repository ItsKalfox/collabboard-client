import { useState, useEffect, useCallback } from 'react';
import {
  fetchTimelineData,
  fetchOngoingProjects,
  fetchTeamProgress,
  fetchRecentFiles,
  fetchRecentProjects
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
      setData(prev => (prev === null && initialData !== null ? initialData : prev));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFunction]);

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

export const useTeamProgress = (projectId = '') => {
  const fetchFn = useCallback(() => fetchTeamProgress(projectId), [projectId]);
  return useDashboardData(fetchFn, []);
};

export const useRecentFiles = () => {
  return useDashboardData(fetchRecentFiles, []);
};

export const useRecentProjects = () => {
  return useDashboardData(fetchRecentProjects, []);
};
