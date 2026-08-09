import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import Message from "../components/Message";

const emptyForm = { temperature: "", pH: "", turbidity: "", notes: "" };

export default function WaterLogsTab({ tanks, selectedTankId, setSelectedTankId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function loadLogs(tankId) {
    if (!tankId) {
      setLogs([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.listWaterLogs(tankId, { limit: 100 });
      setLogs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load water logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs(selectedTankId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTankId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedTankId) {
      setError("Select a tank first.");
      return;
    }
    if (form.temperature === "" || form.pH === "" || form.turbidity === "") {
      setError("Temperature, pH, and turbidity are required.");
      return;
    }
    const payload = {
      temperature: Number(form.temperature),
      pH: Number(form.pH),
      turbidity: Number(form.turbidity),
      notes: form.notes || null,
    };
    setSubmitting(true);
    try {
      const created = await api.createWaterLog(selectedTankId, payload);
      setSuccess(`Log #${created.id} added (status: ${created.status}).`);
      setForm(emptyForm);
      await loadLogs(selectedTankId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add water log.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(logId) {
    if (!confirm(`Delete log #${logId}?`)) return;
    setError("");
    setSuccess("");
    try {
      await api.deleteWaterLog(selectedTankId, logId);
      setSuccess(`Log #${logId} deleted.`);
      await loadLogs(selectedTankId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete log.");
    }
  }

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
        {tanks.length === 0 && (
          <p className="muted spacer-top">No tanks yet. Create one in the Tanks tab first.</p>
        )}
      </div>

      <div className="card">
        <h2>Add Water Log {selectedTankId ? `(Tank #${selectedTankId})` : ""}</h2>
        <Message type="error">{error}</Message>
        <Message type="success">{success}</Message>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: e.target.value })}
              placeholder="28.5"
            />
          </div>
          <div className="field">
            <label>pH</label>
            <input
              type="number"
              step="0.1"
              value={form.pH}
              onChange={(e) => setForm({ ...form, pH: e.target.value })}
              placeholder="7.8"
            />
          </div>
          <div className="field">
            <label>Turbidity</label>
            <input
              type="number"
              step="0.1"
              value={form.turbidity}
              onChange={(e) => setForm({ ...form, turbidity: e.target.value })}
              placeholder="15"
            />
          </div>
          <div className="field">
            <label>Notes (optional)</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="optional"
            />
          </div>
          <div className="actions">
            <button type="submit" disabled={submitting || !selectedTankId}>
              {submitting ? "Adding..." : "Add Log"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Logs {selectedTankId ? `for Tank #${selectedTankId}` : ""} ({logs.length})</h2>
        {loading && <p className="muted">Loading...</p>}
        {!loading && !selectedTankId && <p className="muted">Select a tank to view its logs.</p>}
        {!loading && selectedTankId && logs.length === 0 && (
          <p className="muted">No logs yet for this tank.</p>
        )}
        {!loading && logs.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Temp (°C)</th>
                <th>pH</th>
                <th>Turbidity</th>
                <th>Status</th>
                <th>Warnings</th>
                <th>Recorded At</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.temperature}</td>
                  <td>{l.pH}</td>
                  <td>{l.turbidity}</td>
                  <td>
                    <span className={`badge ${l.status}`}>{l.status}</span>
                  </td>
                  <td style={{ whiteSpace: "normal", maxWidth: 220 }}>
                    {l.warnings?.length ? l.warnings.join("; ") : "-"}
                  </td>
                  <td>{new Date(l.recorded_at).toLocaleString()}</td>
                  <td>{l.notes || "-"}</td>
                  <td>
                    <button className="small danger" onClick={() => handleDelete(l.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
