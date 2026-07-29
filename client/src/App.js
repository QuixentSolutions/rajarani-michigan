import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { Provider, useSelector } from "react-redux";
import { store } from "./store";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Discount from "./components/Discount";
import MenuCards from "./components/MenuCards";
// import RegistrationCard from "./components/RegistrationCard";
import Footer from "./components/Footer";
import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import ReviewBanner from "./components/ReviewBanner";
import OrderOnlinePopup from "./components/OrderOnlinePopup";
// import AnnualDayBanner from "./components/AnnualDayBanner";
import FAQ from "./components/FAQ";
import AdminApp from "./components/AdminApp";
import StoreSelector from "./components/StoreSelector";

import "./App.css";

const HomePage = ({ onChangeStore }) => {
  return (
    <>
      <Helmet>
        <title>Raja Rani Indian Restaurant | Canton, MI</title>
        <meta
          name="description"
          content="Authentic South Indian restaurant in Canton, MI. Dosas, biryanis, curries, Chettinad specialties - dine in or order online."
        />
        <link rel="canonical" href="https://rajaranieats.com/" />
      </Helmet>
      <OrderOnlinePopup />
      <Header onChangeStore={onChangeStore} />
      <ReviewBanner />
      {/* <AnnualDayBanner /> */}
      <Hero />
      <Discount />
      <MenuCards />
      <FAQ />
      <Footer />
      <WhatsAppFloatingButton />
    </>
  );
};

const MenuPage = ({ onChangeStore }) => {
  return (
    <>
      <Helmet>
        <title>Menu | Raja Rani Indian Restaurant, Canton MI</title>
        <meta
          name="description"
          content="Browse the full Raja Rani menu: dosas, idli, biryanis, Chettinad curries, tandoor, and tiffin specials. Order online or dine in at our Canton, MI restaurant."
        />
        <link rel="canonical" href="https://rajaranieats.com/menu" />
      </Helmet>
      <OrderOnlinePopup />
      <Header onChangeStore={onChangeStore} />
      <MenuCards />
      <Footer />
      <WhatsAppFloatingButton />
    </>
  );
};

function StoreGate({ children }) {
  const selectedStore = useSelector((state) => state.store.selectedStore);
  const [showChangeStore, setShowChangeStore] = useState(false);

  if (!selectedStore) return <StoreSelector />;

  return (
    <>
      {showChangeStore && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
          <StoreSelector onCancel={() => setShowChangeStore(false)} />
        </div>
      )}
      {React.cloneElement(children, {
        onChangeStore: () => setShowChangeStore(true),
      })}
    </>
  );
}

function App() {
  // ✅ PWA Home Screen redirect logic (Option 3)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");

    if (source === "admin") {
      // Clean URL + redirect to /admin
      window.history.replaceState({}, "", "/admin");
      window.location.reload();
    }
  }, []);

  return (
    <HelmetProvider>
      <Provider store={store}>
        <Router>
          <div className="whole-container">
            <Routes>
              <Route
                path="/"
                element={
                  <StoreGate>
                    <HomePage />
                  </StoreGate>
                }
              />
              <Route
                path="/menu"
                element={
                  <StoreGate>
                    <MenuPage />
                  </StoreGate>
                }
              />
              <Route
                path="/admin"
                element={
                  <>
                    <Helmet>
                      <meta name="robots" content="noindex, nofollow" />
                    </Helmet>
                    <AdminApp />
                  </>
                }
              />
            </Routes>
          </div>
        </Router>
      </Provider>
    </HelmetProvider>
  );
}

export default App;
