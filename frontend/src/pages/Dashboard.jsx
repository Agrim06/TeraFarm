import { useState } from 'react';
import MoistureChart from '../components/MoistureChart.jsx';
import SensorHistoryTable from '../components/SensorHistoryTable.jsx';
import { useLiveSensorData } from '../hooks/useLiveSensorData.js';
import { useSensorHistory } from '../hooks/useSensorHistory.js';

const safeRange = { min: 20, max: 45 };

function Dashboard() {
  const [deviceId, setDeviceId] = useState('');
  const { data, error, loading, lastUpdated, refresh } = useLiveSensorData({
    deviceId,
    pollInterval: 10000
  });
  const {
    data: history,
    error: historyError,
    loading: historyLoading,
    refresh: refreshHistory
  } = useSensorHistory({
    deviceId,
    limit: 5,
    pollInterval: 15000
  });

  const handleRefresh = () => {
    refresh();
    refreshHistory();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <p>Smart Irrigation</p>
        <h1>Soil Moisture Monitor</h1>
      </header>

      <div className="controls">
        <input
          value={deviceId}
          placeholder="Filter by Device ID (optional)"
          onChange={(event) => setDeviceId(event.target.value)}
        />
        <button type="button" onClick={handleRefresh}>
          Refresh now
        </button>
      </div>

      {loading && <p className="loading">Looking for the latest moisture reading…</p>}
      {error && <p className="error-banner">{error}</p>}
      {historyLoading && <p className="loading">Loading sensor history…</p>}
      {historyError && <p className="error-banner">{historyError}</p>}

      {data && (
        <div className="card-grid">
          <MoistureChart
            moisture={data.moisture}
            temperature={data.temperature}
            humidity={data.humidity}
            timestamp={data.timestamp}
            deviceId={data.deviceId}
            safeRange={safeRange}
          />
        </div>
      )}

      {!loading && !error && !data && (
        <p className="error-banner">
          No readings found yet. Make sure your devices are posting data to `sensordatas`.
        </p>
      )}

      {lastUpdated && (
        <p className="meta">
          Last checked: {lastUpdated.toLocaleString()}
        </p>
      )}

      <SensorHistoryTable rows={history} />
    </div>
  );
}

export default Dashboard;
