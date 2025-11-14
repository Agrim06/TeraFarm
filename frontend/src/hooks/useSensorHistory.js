import { useEffect, useMemo, useState } from 'react';
import { fetchSensorHistory } from '../api/backend.js';

export function useSensorHistory({
  deviceId,
  limit = 100,
  pollInterval = 15000
} = {}) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeDevice = useMemo(() => deviceId?.trim() || undefined, [deviceId]);

  const load = async () => {
    try {
      const history = await fetchSensorHistory({
        deviceId: activeDevice,
        limit
      });
      setData(history);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load sensor history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, pollInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDevice, limit, pollInterval]);

  return {
    data,
    error,
    loading,
    refresh: load
  };
}

