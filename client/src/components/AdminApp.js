import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { clearSelectedStore } from "../storeSlice";
import AdminLogin from "./AdminLogin";
import AdminStoreSelector from "./AdminStoreSelector";
import AdminDashboard from "./AdminDashboard";

// phase: 'loading' | 'login' | 'store-select' | 'dashboard'

const AdminApp = () => {
  const dispatch = useDispatch();
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    // Always ask for store selection on every mount (refresh resets in-memory state)
    setPhase(token ? "store-select" : "login");
  }, []);

  const handleLoginSuccess = () => {
    setPhase("store-select");
  };

  const handleStoreSelected = () => {
    setPhase("dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    dispatch(clearSelectedStore());
    setPhase("login");
  };

  if (phase === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f8f9fa" }}>
        <div style={{ width: 50, height: 50, border: "5px solid #f3f3f3", borderTop: "5px solid #FFA500", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (phase === "login") {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (phase === "store-select") {
    return <AdminStoreSelector onStoreSelected={handleStoreSelected} />;
  }

  return <AdminDashboard onLogout={handleLogout} onSwitchStore={() => setPhase("store-select")} />;
};

export default AdminApp;
