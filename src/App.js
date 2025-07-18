import Header from "./components/Header";
import Hero from "./components/Hero";
import Discount from "./components/Discount";
import MenuCards from "./components/MenuCards";
import Testimonials from "./components/Testimonials";
import BestDelivered from "./components/BestDelivered";
import Footer from "./components/Footer";
import "./App.css";
import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import PhotoStream from "./components/PhotoStream";
import { Provider } from "react-redux";
import { store } from "./store";

function App() {
  return (
    <Provider store={store}>
      <div className="whole-container">
        <Header />
        <Hero />
        <Discount />
        <BestDelivered />
        <MenuCards />
        <PhotoStream />
        <Testimonials />
        {/* <MeetChefs /> */}
        <Footer />
        <WhatsAppFloatingButton />
      </div>
    </Provider>
  );
}

export default App;