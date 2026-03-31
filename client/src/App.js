import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import AnnualDayBanner from "./components/AnnualDayBanner";
import AdminApp from "./components/AdminApp";
import StoreSelector from "./components/StoreSelector";

import "./App.css";

const HomePage = ({ onChangeStore }) => {
  return (
    <>
      <Header onChangeStore={onChangeStore} />
      <ReviewBanner />
      <AnnualDayBanner />
      <Hero />
      <Discount />
      {/* <RegistrationCard /> */}
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
      {React.cloneElement(children, { onChangeStore: () => setShowChangeStore(true) })}
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="whole-container">
          <Routes>
            <Route path="/" element={<StoreGate><HomePage /></StoreGate>} />
            <Route path="/admin" element={<AdminApp />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
