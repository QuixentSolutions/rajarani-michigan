import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setSelectedStore } from "../storeSlice";
import "./StoreSelector.css";

export default function AdminStoreSelector({ onStoreSelected }) {
  const dispatch = useDispatch();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/stores")
      .then((res) => res.json())
      .then((data) => {
        setStores(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  function handleSelect(store) {
    dispatch(setSelectedStore(store));
    onStoreSelected(store);
  }

  return (
    <div className="store-selector-page" style={{ background: "#1a1a2e" }}>
      <div className="store-selector-box">
        <div className="store-selector-logo">Raja Rani Admin</div>
        <p className="store-selector-msg">Select the store you want to manage:</p>

        {loading && <div className="store-selector-spinner" />}

        {error && (
          <p className="store-selector-msg" style={{ color: "#ff6b6b" }}>
            Unable to load stores. Please refresh and try again.
          </p>
        )}

        {!loading && !error && (
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
        )}
      </div>
    </div>
  );
}
