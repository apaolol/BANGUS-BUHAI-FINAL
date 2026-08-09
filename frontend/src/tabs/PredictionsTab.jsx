import { useEffect, useState } from "react";
import { api, ApiError, REQUIRED_LOGS_FOR_PREDICTION } from "../api";
import Message from "../components/Message";

export default function PredictionsTab({ tanks, selectedTankId, setSelectedTankId }) {
  const [logCount, setLogCount] = useState(0);
  const [countLoading, setCountLoading] = useState(false);

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [runSuccess, setRunSuccess] = useState("");

  const [latest, setLatest] = useState(null);
  const [latestError, setLatestError] = useState("");
  const [latestLoading, setLatestLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadLogCount(tankId) {
    if (!tankId) {
      setLogCount(0);
      return;
    }
    setCountLoading(true);
    try {
      // limit=100 is the backend's max page size; enough to confirm the 48 threshold.
      const data = await api.listWaterLogs(tankId, { limit: 100 });
      setLogCount(data.length);
    } catch {
      setLogCount(0);
    } finally {
      setCountLoading(false);
    }
  }

  async function loadLatest(tankId) {
    if (!tankId) {
      setLatest(null);
      return;
    }
    setLatestLoading(true);
    setLatestError("");
    try {
      const data = await api.getLatestPrediction(tankId);
      setLatest(data);
    } catch (err) {
      setLatest(null);
      setLatestError(err instanceof ApiError ? err.message : "Failed to load latest prediction.");
    } finally {
      setLatestLoading(false);
    }
  }

  async function loadHistory(tankId) {
    if (!tankId) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const data = await api.listPredictions(tankId);
      setHistory(data);
    } catch (err) {
      setHistory([]);
      setHistoryError(err instanceof ApiError ? err.message : "Failed to load prediction history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  function refreshAll(tankId) {
    loadLogCount(tankId);
    loadLatest(tankId);
    loadHistory(tankId);
  }

  useEffect(() => {
    refreshAll(selectedTankId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTankId]);

  async function handleRunPrediction() {
    setRunError("");
    setRunSuccess("");
    if (!selectedTankId) {
      setRunError("Select a tank first.");
      return;
    }
    setRunning(true);
    try {
      const result = await api.runPrediction(selectedTankId);
      setRunSuccess(`Prediction #${result.id} created.`);
      setLatest(result);
      await loadHistory(selectedTankId);
      await loadLogCount(selectedTankId);
    } catch (err) {
      setRunError(err instanceof ApiError ? err.message : "Failed to run prediction.");
    } finally {
      setRunning(false);
    }
  }

  const pct = Math.min(100, Math.round((logCount / REQUIRED_LOGS_FOR_PREDICTION) * 100));
  const canPredict = logCount >= REQUIRED_LOGS_FOR_PREDICTION;

  return (
    <div>
      <div className="card">
        <h2>Select Tank</h2>
        <select
          className="tank-select"
          value={selectedTankId ?? ""}
          onChange={(e) => setSelectedTankId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- choose a tank --</option>
          {tanks.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.id} - {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h2>Log Progress</h2>
        {!selectedTankId && <p className="muted">Select a tank to see its log count.</p>}
        {selectedTankId && (
          <>
            <p>
              {countLoading ? "Checking..." : `${logCount} / ${REQUIRED_LOGS_FOR_PREDICTION} logs`}
              {canPredict ? " — ready for prediction" : ""}
            </p>
            <div className="progress-bar">
              <div style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>Run Prediction</h2>
        <Message type="error">{runError}</Message>
        <Message type="success">{runSuccess}</Message>
        <button onClick={handleRunPrediction} disabled={running || !selectedTankId}>
          {running ? "Running..." : "Run Prediction"}
        </button>
        {selectedTankId && !canPredict && (
          <p className="muted spacer-top">
            Needs {REQUIRED_LOGS_FOR_PREDICTION - logCount} more log(s) before this will succeed
            (backend will return an error if you try now).
          </p>
        )}
      </div>

      <div className="card">
        <h2>Latest Prediction</h2>
        {latestLoading && <p className="muted">Loading...</p>}
        {!latestLoading && latestError && <Message type="error">{latestError}</Message>}
        {!latestLoading && !latestError && !latest && (
          <p className="muted">No prediction yet for this tank.</p>
        )}
        {!latestLoading && latest && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Temperature</th>
                <th>pH</th>
                <th>Turbidity</th>
                <th>Predicted For</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{latest.id}</td>
                <td>{latest.temperature.toFixed(2)}</td>
                <td>{latest.pH.toFixed(2)}</td>
                <td>{latest.turbidity.toFixed(2)}</td>
                <td>{new Date(latest.predicted_for).toLocaleString()}</td>
                <td>{new Date(latest.created_at).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Prediction History ({history.length})</h2>
        {historyLoading && <p className="muted">Loading...</p>}
        {!historyLoading && historyError && <Message type="error">{historyError}</Message>}
        {!historyLoading && !historyError && history.length === 0 && (
          <p className="muted">No predictions recorded yet for this tank.</p>
        )}
        {!historyLoading && history.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Temperature</th>
                <th>pH</th>
                <th>Turbidity</th>
                <th>Predicted For</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
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
