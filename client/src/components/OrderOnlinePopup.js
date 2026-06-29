import { useState, useEffect } from "react";
import "./OrderOnlinePopup.css";

export default function OrderOnlinePopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const close = () => setVisible(false);

  const handleOrder = () => {
    setVisible(false);
    setTimeout(() => {
      const menu = document.getElementById("menu");
      if (menu) menu.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  if (!visible) return null;

  return (
    <div className="oo-overlay" onClick={close}>
      <div className="oo-card" onClick={(e) => e.stopPropagation()}>
        <button className="oo-close" onClick={close}>✕</button>
        <div className="oo-icon">🍛</div>
        <h2 className="oo-title">Welcome to Raja Rani!</h2>
        <hr className="oo-divider" />
        <p className="oo-sub">Authentic South Indian flavors —<br />freshly crafted for you.</p>
        <button className="oo-btn" onClick={handleOrder}>
          🍽️ &nbsp;Order Online
        </button>
      </div>
    </div>
  );
}
