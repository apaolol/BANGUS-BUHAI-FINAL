import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import Message from "../components/Message";

export default function HistoryTab({ tanks, refreshTanks }) {
  const [filterTankId, setFilterTankId] = useState("");

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const [predictions, setPredictions] = useState([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [predictionsError, setPredictionsError] = useState("");

  const [feedings, setFeedings] = useState([]);
  const [feedingsLoading, setFeedingsLoading] = useState(false);
  const [feedingsError, setFeedingsError] = useState("");

  useEffect(() => {
    refreshTanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLogs() {
    setLogsLoading(true);
    setLogsError("");
    try {
      const data = filterTankId
        ? await api.listWaterLogs(filterTankId, { limit: 100 })
        : await api.listAllWaterLogs({ limit: 100 });
      setLogs(data);
    } catch (err) {
      setLogs([]);
      setLogsError(err instanceof ApiError ? err.message : "Failed to load water logs.");
    } finally {
      setLogsLoading(false);
    }
  }

  async function loadPredictions() {
    setPredictionsLoading(true);
    setPredictionsError("");
    try {
      if (filterTankId) {
        const data = await api.listPredictions(filterTankId);
        setPredictions(data.map((p) => ({ ...p, tank_id: Number(filterTankId) })));
      } else {
        // No "all tanks" prediction endpoint on the backend, so fetch per tank and merge.
        const results = await Promise.all(
          tanks.map((t) =>
            api
              .listPredictions(t.id)
              .then((data) => data)
              .catch(() => [])
          )
        );
        setPredictions(results.flat());
      }
    } catch (err) {
      setPredictions([]);
      setPredictionsError(err instanceof ApiError ? err.message : "Failed to load predictions.");
    } finally {
      setPredictionsLoading(false);
    }
  }

  async function loadFeedings() {
    setFeedingsLoading(true);
    setFeedingsError("");
    try {
      if (filterTankId) {
        const data = await api.listFeedingLogs(filterTankId, { limit: 100 });
        setFeedings(data.map((f) => ({ ...f, tank_id: Number(filterTankId) })));
      } else {
        // No "all tanks" feedings endpoint on the backend, so fetch per tank and merge.
        const results = await Promise.all(
          tanks.map((t) =>
            api
              .listFeedingLogs(t.id, { limit: 100 })
              .then((data) => data.map((f) => ({ ...f, tank_id: t.id })))
              .catch(() => [])
          )
        );
        setFeedings(results.flat());
      }
    } catch (err) {
      setFeedings([]);
      setFeedingsError(err instanceof ApiError ? err.message : "Failed to load feeding logs.");
    } finally {
      setFeedingsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
    loadPredictions();
    loadFeedings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTankId, tanks.length]);

  const visibleTanks = filterTankId
    ? tanks.filter((t) => t.id === Number(filterTankId))
    : tanks;

  return (
    <div>
      <div className="card">
        <h2>Filter</h2>
        <label>Tank</label>
        <select
          className="tank-select"
          value={filterTankId}
          onChange={(e) => setFilterTankId(e.target.value)}
        >
          <option value="">All tanks</option>
          {tanks.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.id} - {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h2>Tanks ({visibleTanks.length})</h2>
        {visibleTanks.length === 0 ? (
          <p className="muted">No tanks to show.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Stage</th>
                <th>Volume (mL)</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {visibleTanks.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.growth_stage}</td>
                  <td>{t.volume_ml}</td>
                  <td>{t.date_added}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Water Logs ({logs.length})</h2>
        {logsLoading && <p className="muted">Loading...</p>}
        {!logsLoading && logsError && <Message type="error">{logsError}</Message>}
        {!logsLoading && !logsError && logs.length === 0 && (
          <p className="muted">No water logs found.</p>
        )}
        {!logsLoading && logs.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tank</th>
                <th>Temp (°C)</th>
                <th>pH</th>
                <th>Turbidity</th>
                <th>Status</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.tank_id}</td>
                  <td>{l.temperature}</td>
                  <td>{l.pH}</td>
                  <td>{l.turbidity}</td>
                  <td>
                    <span className={`badge ${l.status}`}>{l.status}</span>
                  </td>
                  <td>{new Date(l.recorded_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Feeding Logs ({feedings.length})</h2>
        {feedingsLoading && <p className="muted">Loading...</p>}
        {!feedingsLoading && feedingsError && <Message type="error">{feedingsError}</Message>}
        {!feedingsLoading && !feedingsError && feedings.length === 0 && (
          <p className="muted">No feeding logs found.</p>
        )}
        {!feedingsLoading && feedings.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tank</th>
                <th>Feed Type</th>
                <th>Amount (g)</th>
                <th>Fed At</th>
              </tr>
            </thead>
            <tbody>
              {feedings.map((f) => (
                <tr key={`${f.tank_id}-${f.id}`}>
                  <td>{f.id}</td>
                  <td>{f.tank_id}</td>
                  <td>{f.feed_type}</td>
                  <td>{f.amount_grams}</td>
                  <td>{new Date(f.fed_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Predictions ({predictions.length})</h2>
        {predictionsLoading && <p className="muted">Loading...</p>}
        {!predictionsLoading && predictionsError && <Message type="error">{predictionsError}</Message>}
        {!predictionsLoading && !predictionsError && predictions.length === 0 && (
          <p className="muted">No predictions found.</p>
        )}
        {!predictionsLoading && predictions.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tank</th>
                <th>Temperature</th>
                <th>pH</th>
                <th>Turbidity</th>
                <th>Predicted For</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr key={`${p.tank_id}-${p.id}`}>
                  <td>{p.id}</td>
                  <td>{p.tank_id}</td>
                  <td>{p.temperature.toFixed(2)}</td>
                  <td>{p.pH.toFixed(2)}</td>
                  <td>{p.turbidity.toFixed(2)}</td>
                  <td>{new Date(p.predicted_for).toLocaleString()}</td>
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
