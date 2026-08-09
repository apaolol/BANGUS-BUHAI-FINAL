import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import Message from "../components/Message";

const FEED_TYPES = ["pellet", "natural", "supplement"];

const emptyForm = { feed_type: "pellet", amount_grams: "", notes: "" };

export default function FeedingTab({ tanks, selectedTankId, setSelectedTankId }) {
  const [feedings, setFeedings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function loadFeedings(tankId) {
    if (!tankId) {
      setFeedings([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.listFeedingLogs(tankId, { limit: 100 });
      setFeedings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load feeding logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedings(selectedTankId);
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
    if (form.amount_grams === "") {
      setError("Amount (grams) is required.");
      return;
    }
    const payload = {
      feed_type: form.feed_type,
      amount_grams: Number(form.amount_grams),
      notes: form.notes || null,
    };
    setSubmitting(true);
    try {
      const created = await api.createFeedingLog(selectedTankId, payload);
      setSuccess(`Feeding #${created.id} added.`);
      setForm(emptyForm);
      await loadFeedings(selectedTankId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add feeding log.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(feedingId) {
    if (!confirm(`Delete feeding #${feedingId}?`)) return;
    setError("");
    setSuccess("");
    try {
      await api.deleteFeedingLog(selectedTankId, feedingId);
      setSuccess(`Feeding #${feedingId} deleted.`);
      await loadFeedings(selectedTankId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete feeding log.");
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
        <h2>Add Feeding Log {selectedTankId ? `(Tank #${selectedTankId})` : ""}</h2>
        <Message type="error">{error}</Message>
        <Message type="success">{success}</Message>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Feed type</label>
            <select
              value={form.feed_type}
              onChange={(e) => setForm({ ...form, feed_type: e.target.value })}
            >
              {FEED_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Amount (grams)</label>
            <input
              type="number"
              step="0.1"
              value={form.amount_grams}
              onChange={(e) => setForm({ ...form, amount_grams: e.target.value })}
              placeholder="50"
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
              {submitting ? "Adding..." : "Add Feeding"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>
          Feedings {selectedTankId ? `for Tank #${selectedTankId}` : ""} ({feedings.length})
        </h2>
        {loading && <p className="muted">Loading...</p>}
        {!loading && !selectedTankId && <p className="muted">Select a tank to view its feedings.</p>}
        {!loading && selectedTankId && feedings.length === 0 && (
          <p className="muted">No feeding logs yet for this tank.</p>
        )}
        {!loading && feedings.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Feed Type</th>
                <th>Amount (g)</th>
                <th>Fed At</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {feedings.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.feed_type}</td>
                  <td>{f.amount_grams}</td>
                  <td>{new Date(f.fed_at).toLocaleString()}</td>
                  <td>{f.notes || "-"}</td>
                  <td>
                    <button className="small danger" onClick={() => handleDelete(f.id)}>
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
