import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Discount from "./components/Discount";
import MenuCards from "./components/MenuCards";
import RegistrationCard from "./components/RegistrationCard";
import Footer from "./components/Footer";
import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import ReviewBanner from "./components/ReviewBanner";
import AdminApp from "./components/AdminApp";

import "./App.css";

// This new component will group all your homepage content
const HomePage = () => {
  return (
    <>
      <Header />
      <ReviewBanner />
      <Hero />
      <Discount />
      {/* <RegistrationCard /> */}
      <MenuCards />
      <Footer />
      <WhatsAppFloatingButton />
    </>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="whole-container">
          <Routes>
            {/* Route for your main homepage */}
            <Route path="/" element={<HomePage />} />

            {/* Route for the admin with authentication */}
            <Route path="/admin" element={<AdminApp />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;