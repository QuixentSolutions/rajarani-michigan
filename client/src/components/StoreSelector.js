import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setSelectedStore } from "../storeSlice";
import "./StoreSelector.css";

// onCancel: if provided, shows a close button (modal mode)
export default function StoreSelector({ onCancel }) {
  const dispatch = useDispatch();
  const [status, setStatus] = useState("detecting"); // detecting | list | error
  const [stores, setStores] = useState([]);
  const [message, setMessage] = useState("Detecting your location…");

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchAllStores("Location not supported by your browser. Please select a store:");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/stores/nearby?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          if (data.length === 1) {
            // Exactly one nearby store — auto-select silently
            dispatch(setSelectedStore(data[0]));
          } else if (data.length > 1) {
            setStores(data);
            setMessage("Stores near you (within 250 miles):");
            setStatus("list");
          } else {
            fetchAllStores("No stores found within 250 miles. Please select a store:");
          }
        } catch {
          fetchAllStores("Could not determine nearby stores. Please select a store:");
        }
      },
      () => {
        fetchAllStores("Location access denied. Please select a store:");
      }
    );
  }, [dispatch]);

  async function fetchAllStores(msg) {
    setMessage(msg);
    try {
      const res = await fetch("/stores");
      const data = await res.json();
      setStores(data);
      setStatus("list");
    } catch {
      setStatus("error");
    }
  }

  function handleSelect(store) {
    dispatch(setSelectedStore(store));
    if (onCancel) onCancel();
  }

  if (status === "detecting") {
    return (
      <div className="store-selector-page">
        <div className="store-selector-box">
          <div className="store-selector-logo">Raja Rani</div>
          <div className="store-selector-spinner" />
          <p className="store-selector-msg">{message}</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="store-selector-page">
        <div className="store-selector-box">
          <div className="store-selector-logo">Raja Rani</div>
          <p className="store-selector-msg">Unable to load stores. Please refresh and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="store-selector-page">
      <div className="store-selector-box">
        {onCancel && (
          <button className="store-selector-close" onClick={onCancel} aria-label="Close">✕</button>
        )}
        <div className="store-selector-logo">Raja Rani</div>
        <p className="store-selector-msg">{message}</p>
        <div className="store-selector-list">
          {stores.map((s) => (
            <div key={s.slug} className="store-card">
              <div className="store-card-info">
                <strong>{s.name}</strong>
                {s.address && <span>{s.address}</span>}
              </div>
              <button className="store-card-btn" onClick={() => handleSelect(s)}>
                Select
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
