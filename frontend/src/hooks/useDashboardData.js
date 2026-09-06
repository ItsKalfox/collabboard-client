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

  const executeFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.warn('Dashboard hook fetch error:', err);
      setError(err.message || 'An error occurred while fetching data');
      if (initialData !== null) setData(initialData);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, initialData]);

  useEffect(() => {
    let isMounted = true;
    
    setLoading(true);
    setError(null);
    
    fetchFunction()
      .then(result => {
        if (isMounted) {
          setData(result);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn('Dashboard fetch error:', err);
          setError(err.message || 'An error occurred while fetching data');
          if (initialData !== null) setData(initialData);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchFunction, initialData]);

  return { data, loading, error, refetch: executeFetch };
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
