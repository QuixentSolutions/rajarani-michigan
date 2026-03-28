import React from "react";
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

// This new component will group all your homepage content
const HomePage = () => {
  return (
    <>
      <Header />
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
  if (!selectedStore) return <StoreSelector />;
  return children;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="whole-container">
          <Routes>
            {/* Route for your main homepage */}
            <Route path="/" element={<StoreGate><HomePage /></StoreGate>} />

            {/* Route for the admin with authentication */}
            <Route path="/admin" element={<AdminApp />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
