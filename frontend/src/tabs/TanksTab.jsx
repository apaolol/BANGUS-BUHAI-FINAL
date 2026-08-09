import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import Message from "../components/Message";

const GROWTH_STAGES = ["fry", "fingerling", "juvenile", "adult"];

const emptyForm = { name: "", volume_ml: "", growth_stage: "fry", owner_id: "" };

export default function TanksTab({ tanks, refreshTanks, selectedTankId, setSelectedTankId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [viewTank, setViewTank] = useState(null);
  const [summary, setSummary] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    refreshTanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name || !form.volume_ml) {
      setError("Name and volume are required.");
      return;
    }
    const payload = {
      name: form.name,
      volume_ml: Number(form.volume_ml),
      growth_stage: form.growth_stage,
      owner_id: form.owner_id ? Number(form.owner_id) : null,
    };
    setLoading(true);
    try {
      if (editingId) {
        await api.updateTank(editingId, payload);
        setSuccess(`Tank #${editingId} updated.`);
      } else {
        const created = await api.createTank(payload);
        setSuccess(`Tank #${created.id} created.`);
      }
      resetForm();
      await refreshTanks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save tank.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(tank) {
    setEditingId(tank.id);
    setForm({
      name: tank.name,
      volume_ml: tank.volume_ml,
      growth_stage: tank.growth_stage,
      owner_id: tank.owner_id ?? "",
    });
    setError("");
    setSuccess("");
  }

  async function handleDelete(id) {
    if (!confirm(`Delete tank #${id}? This cannot be undone.`)) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.deleteTank(id);
      setSuccess(`Tank #${id} deleted.`);
      if (viewTank?.id === id) {
        setViewTank(null);
        setSummary(null);
      }
      if (selectedTankId === id) setSelectedTankId(null);
      await refreshTanks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete tank.");
    } finally {
      setLoading(false);
    }
  }

  async function handleView(id) {
    setError("");
    setViewLoading(true);
    setViewTank(null);
    setSummary(null);
    try {
      const [tank, summaryData] = await Promise.all([
        api.getTank(id),
        api.getTankSummary(id).catch(() => null),
      ]);
      setViewTank(tank);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tank.");
    } finally {
      setViewLoading(false);
    }
  }

  return (
    <div>
      <div className="card">
        <h2>{editingId ? `Edit Tank #${editingId}` : "Create Tank"}</h2>
        <Message type="error">{error}</Message>
        <Message type="success">{success}</Message>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tank A"
            />
          </div>
          <div className="field">
            <label>Volume (mL)</label>
            <input
              type="number"
              value={form.volume_ml}
              onChange={(e) => setForm({ ...form, volume_ml: e.target.value })}
              placeholder="50000"
            />
          </div>
          <div className="field">
            <label>Growth stage</label>
            <select
              value={form.growth_stage}
              onChange={(e) => setForm({ ...form, growth_stage: e.target.value })}
            >
              {GROWTH_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Owner ID (optional)</label>
            <input
              type="number"
              value={form.owner_id}
              onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
              placeholder="none"
            />
          </div>
          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Tank" : "Create Tank"}
            </button>
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Tanks ({tanks.length})</h2>
        {tanks.length === 0 ? (
          <p className="muted">No tanks yet. Create one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Stage</th>
                <th>Volume (mL)</th>
                <th>Capacity</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tanks.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.growth_stage}</td>
                  <td>{t.volume_ml}</td>
                  <td>{t.capacity}</td>
                  <td>{t.date_added}</td>
                  <td>
                    <div className="actions">
                      <button className="small secondary" onClick={() => handleView(t.id)}>
                        View
                      </button>
                      <button className="small secondary" onClick={() => startEdit(t)}>
                        Edit
                      </button>
                      <button
                        className="small secondary"
                        onClick={() => setSelectedTankId(t.id)}
                        disabled={selectedTankId === t.id}
                      >
                        {selectedTankId === t.id ? "Selected" : "Select"}
                      </button>
                      <button className="small danger" onClick={() => handleDelete(t.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(viewLoading || viewTank) && (
        <div className="card">
          <h2>Tank Detail</h2>
          {viewLoading && <p className="muted">Loading...</p>}
          {viewTank && (
            <>
              <pre style={{ fontSize: 12, background: "#fafafa", padding: 8, overflowX: "auto" }}>
                {JSON.stringify(viewTank, null, 2)}
              </pre>
              <h3>Summary (/tanks/{viewTank.id}/summary)</h3>
              {summary ? (
                <pre style={{ fontSize: 12, background: "#fafafa", padding: 8, overflowX: "auto" }}>
                  {JSON.stringify(summary, null, 2)}
                </pre>
              ) : (
                <p className="muted">No summary available.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
