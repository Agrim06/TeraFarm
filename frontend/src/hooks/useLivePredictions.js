import { useEffect, useMemo, useState, useRef } from 'react';
import { fetchLatestPrediction } from '../api/backend.js';

export function useLivePredictions({
  deviceId,
  pollInterval = 10000
} = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const previousDataRef = useRef(null);
  const intervalRef = useRef(null);

  const activeDevice = useMemo(() => deviceId?.trim() || undefined, [deviceId]);

  // Helper to compare predictions
  const predictionsEqual = (pred1, pred2) => {
    if (!pred1 && !pred2) return true;
    if (!pred1 || !pred2) return false;
    return (
      pred1.predictionId === pred2.predictionId &&
      pred1.pumpStatus === pred2.pumpStatus &&
      pred1.waterMM === pred2.waterMM &&
      pred1.pumpTimeSec === pred2.pumpTimeSec &&
      pred1.used === pred2.used
    );
  };

  const load = async (isInitial = false) => {
    if (!isInitial) {
      setIsRefreshing(true);
    }
    
    try {
      const latest = await fetchLatestPrediction(activeDevice);
      
      // Check if data actually changed
      const changed = !predictionsEqual(latest, previousDataRef.current);
      
      if (changed) {
        setHasChanged(true);
        // Reset the change flag after animation
        setTimeout(() => setHasChanged(false), 1000);
      }
      
      setData(latest);
      previousDataRef.current = latest;
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[useLivePredictions] Error fetching prediction:', err);
      setError(err.message || 'Unable to reach backend');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Reset state when device changes
    setData(null);
    setError(null);
    setLoading(true);
    previousDataRef.current = null;
    
    // Initial load
    load(true);
    
    // Set up polling interval
    intervalRef.current = setInterval(() => {
      load(false);
    }, pollInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDevice, pollInterval]);

  return {
    data,
    error,
    loading,
    lastUpdated,
    isRefreshing,
    hasChanged,
    refresh: () => load(false)
  };
}

