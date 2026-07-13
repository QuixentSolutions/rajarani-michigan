import { useState, useEffect } from "react";
import "./OrderOnlinePopup.css";
import banner from "./online-banner.jpg";

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
        <img
          src={banner}
          alt="Order Online"
          className="oo-banner-img"
          onClick={handleOrder}
        />
      </div>
    </div>
  );
}
