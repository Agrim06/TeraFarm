function SensorHistoryTable({ rows }) {
  if (!rows?.length) {
    return (
      <div className="card history-card empty">
        <h2>Sensor History</h2>
        <p>No sensor readings available yet.</p>
      </div>
    );
  }

  return (
    <div className="card history-card">
      <h2>Sensor History</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Device</th>
              <th>Moisture (%)</th>
              <th>Temperature (°C)</th>
              <th>Humidity (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id || row.timestamp}>
                <td>{new Date(row.timestamp).toLocaleString()}</td>
                <td>{row.deviceId || '—'}</td>
                <td>{typeof row.moisture === 'number' ? row.moisture.toFixed(1) : '—'}</td>
                <td>{typeof row.temperature === 'number' ? row.temperature.toFixed(1) : '—'}</td>
                <td>{typeof row.humidity === 'number' ? row.humidity.toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SensorHistoryTable;

