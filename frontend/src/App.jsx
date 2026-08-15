<<<<<<< HEAD
import { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import TanksTab from "./tabs/TanksTab";
import WaterLogsTab from "./tabs/WaterLogsTab";
import FeedingTab from "./tabs/FeedingTab";
import PredictionsTab from "./tabs/PredictionsTab";
import HistoryTab from "./tabs/HistoryTab";

const TABS = ["Tanks", "Water Logs", "Feeding", "Predictions", "History"];

export default function App() {
  const [activeTab, setActiveTab] = useState("Tanks");
  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking"); // checking | ok | down

  const refreshTanks = useCallback(async () => {
    try {
      const data = await api.listTanks({ limit: 100 });
      setTanks(data);
    } catch {
      // Errors are surfaced within individual tabs; keep tanks list stable here.
    }
  }, []);

  useEffect(() => {
    async function checkHealth() {
      try {
        await api.health();
        setBackendStatus("ok");
      } catch {
        setBackendStatus("down");
      }
    }
    checkHealth();
    refreshTanks();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [refreshTanks]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>BANGUS BUHAI — Backend Test UI</h1>
        <span className={`backend-status ${backendStatus}`}>
          {backendStatus === "checking" && "Checking backend..."}
          {backendStatus === "ok" && "Backend: OK"}
          {backendStatus === "down" && "Backend: unreachable"}
        </span>
      </header>

      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Tanks" && (
        <TanksTab
          tanks={tanks}
          refreshTanks={refreshTanks}
          selectedTankId={selectedTankId}
          setSelectedTankId={setSelectedTankId}
        />
      )}
      {activeTab === "Water Logs" && (
        <WaterLogsTab
          tanks={tanks}
          selectedTankId={selectedTankId}
          setSelectedTankId={setSelectedTankId}
        />
      )}
      {activeTab === "Feeding" && (
        <FeedingTab
          tanks={tanks}
          selectedTankId={selectedTankId}
          setSelectedTankId={setSelectedTankId}
        />
      )}
      {activeTab === "Predictions" && (
        <PredictionsTab
          tanks={tanks}
          selectedTankId={selectedTankId}
          setSelectedTankId={setSelectedTankId}
        />
      )}
      {activeTab === "History" && <HistoryTab tanks={tanks} refreshTanks={refreshTanks} />}
=======
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import TankDetail from "./pages/TankDetail";
import Users from "./pages/Users";

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tanks/:id" element={<TankDetail />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </main>
>>>>>>> 406f2d9af2b4181581dcc953a7b6e5d9f7153fd8
    </div>
  );
}
