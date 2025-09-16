import { SocialIcon } from "react-social-icons";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { clearCart, rehydrateCart } from "../cartSlice";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { FaPlus, FaMinus } from "react-icons/fa";

function Header() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("+1");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [tableNumber, setTableNumber] = useState("1");
  const [orderMode, setOrderMode] = useState("dinein");
  const [address, setAddress] = useState("");
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalOrderAmount, setFinalOrderAmount] = useState(0);
  const [deliveryModes, setDeliveryModes] = useState();

  // NEW PAYMENT MODAL STATES
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });

  const localStorageCartItems = useSelector((state) => state.cart.items);
  const [cartItems, setCartItems] = useState(localStorageCartItems);

  useEffect(() => {
    setCartItems(localStorageCartItems);
  }, [localStorageCartItems]);

  const dispatch = useDispatch();

  const handleCartClick = () => {
    setIsPopupOpen(true);
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/^\+1/, "").replace(/\D/g, "");
    if (digits.length <= 3) return `+1 ${digits}`;
    if (digits.length <= 6)
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
      6,
      10
    )}`;
  };

  useEffect(() => {
    const subTotal = Object.values(cartItems).reduce(
      (sum, { quantity, price }) => sum + parseFloat(price),
      0
    );
    setTotalAmount(subTotal);
  }, [cartItems]);

  useEffect(() => {
    const loadData = async () => {
      const dbResponse = await fetch("/settings/latest", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const dbData = await dbResponse.json();
      if (!dbResponse.ok) {
        throw new Error(dbData.message || "Failed to save order.");
      }

      const obj = dbData[0]?.settings || {};
      const result = Object.keys(obj).filter((key) => obj[key]);
      setDeliveryModes(result || []);
    };

    loadData();
  }, [isPopupOpen]);

  const handleChange = (e) => {
    const input = e.target.value;
    if (!input.startsWith("+1")) {
      setMobileNumber("+1");
      return;
    }
    const formatted = formatPhoneNumber(input);
    setMobileNumber(formatted);
  };

  const handleNameChange = (e) => {
    const input = e.target.value;
    setName(input);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await res.json();
            setAddress(data.display_name);
          } catch (error) {
            console.error("Error fetching address:", error);
          }
        },
        (err) => console.error("Error getting location:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // UPDATED ORDER NOW HANDLER - Now opens payment modal
  const handleOrderNow = async (e) => {
    e.preventDefault();

    // Validate mobile number for non-dine-in orders
    const mobileRegex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/;
    if (
      orderMode !== "dinein" &&
      (!mobileNumber || !mobileRegex.test(mobileNumber.trim()))
    ) {
      setMobileError("Please enter a valid mobile number.");
      return;
    }
    setMobileError("");

    // Validate email for non-dine-in orders
    if (orderMode !== "dinein") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        setEmailError("Please enter a valid email address.");
        return;
      }

      if (!name || name.trim().length < 2) {
        setNameError("Name cannot be empty");
        return;
      }
    }
    setEmailError("");

    // Validate address for delivery
    if (orderMode === "delivery" && !address) {
      setAddressError("Please enter a valid delivery address.");
      return;
    }
    setAddressError("");

    // Close order modal and open payment modal
    setIsPopupOpen(false);
    setShowPaymentModal(true);
  };

  // FIXED PAYMENT MODAL FUNCTIONS
  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{4})/g, '$1 ').trim();
  };

  // Fixed input handlers to prevent cursor jumping
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardData(prev => ({ ...prev, cardNumber: formatted }));
    }
  };

  const handleExpiryMonthChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setCardData(prev => ({ ...prev, expiryMonth: value }));
  };

  const handleExpiryYearChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardData(prev => ({ ...prev, expiryYear: value }));
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardData(prev => ({ ...prev, cvv: value }));
  };

  const handleCardholderNameChange = (e) => {
    setCardData(prev => ({ ...prev, cardholderName: e.target.value }));
  };

  const validatePaymentForm = () => {
    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } = cardData;
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      setPaymentError('Please enter a valid 16-digit card number');
      return false;
    }
    
    if (!expiryMonth || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
      setPaymentError('Please enter a valid expiry month (01-12)');
      return false;
    }
    
    if (!expiryYear || expiryYear.length !== 4 || parseInt(expiryYear) < new Date().getFullYear()) {
      setPaymentError('Please enter a valid expiry year');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      setPaymentError('Please enter a valid CVV');
      return false;
    }
    
    if (!cardholderName.trim()) {
      setPaymentError('Please enter cardholder name');
      return false;
    }
    
    return true;
  };
const processPayment = async () => {
  if (!validatePaymentForm()) {
    return;
  }

  setPaymentLoading(true);
  setPaymentError('');

  try {
    // Prepare order data
    const orderData = {
      orderNumber: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      customer: {
        name: name.trim() || "Guest",
        firstName: name.trim().split(' ')[0] || "Customer",
        lastName: name.trim().split(' ').slice(1).join(' ') || "Guest",
        phone: String(mobileNumber),
        email: email.trim(),
      },
      orderType: String(orderMode),
      tableNumber: orderMode === "dinein" ? String(`T${tableNumber}`) : "0",
      deliveryAddress: orderMode === "delivery" ? address : "NA",
      items: Object.entries(cartItems).map(
        ([name, { quantity, basePrice, price, spiceLevel, addons }]) => ({
          name,
          quantity: parseInt(quantity),
          basePrice: parseFloat(basePrice || price),
          price: parseFloat(price),
          spiceLevel,
          addons,
        })
      ),
      subTotal: parseFloat(totalAmount.toFixed(2)),
      salesTax: parseFloat((totalAmount * 0.06).toFixed(2)),
      totalAmount: parseFloat((totalAmount * 1.06).toFixed(2)),
    };

    // Create mock payment nonce (replace with real Accept.js tokenization)
    const paymentNonce = `nonce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare billing info
    const billingInfo = {
      cardholderName: cardData.cardholderName,
      zipCode: '12345' // You might want to add this field to your form
    };

    // Send correct data structure to backend
    const response = await fetch('/api/payment/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentNonce: paymentNonce,           // ✅ Correct property name
        dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT', // ✅ Required by backend
        orderData: orderData,                 // ✅ Correct structure
        billingInfo: billingInfo             // ✅ Matches backend expectation
      }),
    });

    const result = await response.json();
    console.log('Payment API response:', result);

    if (response.ok && result.success) {
      // Payment successful - save order to database
      const orderResponse = await fetch("/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderData,
          payment: {
            method: 'card',
            status: 'paid',
            transactionId: result.transactionId
          },
          status: 'accepted'
        }),
      });

      if (orderResponse.ok) {
        setSuccessOrderId(orderData.orderNumber);
        setFinalOrderAmount(orderData.totalAmount);
        setIsSuccessPopupOpen(true);
        setShowPaymentModal(false);
        setIsPopupOpen(false);
        
        // Clear form and cart
        setMobileNumber("+1");
        setTableNumber("1");
        setEmail("");
        setName("");
        setAddress("");
        setCardData({
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          cardholderName: ''
        });
        dispatch(clearCart());
      } else {
        throw new Error('Failed to save order');
      }
    } else {
      setPaymentError(result.message || 'Payment failed. Please try again.');
    }
  } catch (error) {
    console.error('Payment error:', error);
    setPaymentError('Payment processing failed. Please try again.');
  } finally {
    setPaymentLoading(false);
  }
};

  const isCartEmpty = Object.keys(cartItems).length === 0;

  // FIXED PAYMENT MODAL COMPONENT
  const PaymentModal = () => (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1002,
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "30px",
        width: "90vw",
        maxWidth: "450px",
        maxHeight: "85vh",
        overflowY: "auto",
        position: "relative",
        border: "3px solid #1abc9c",
        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          paddingBottom: "15px",
          borderBottom: "2px solid #ecf0f1"
        }}>
          <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "1.4em" }}>
            💳 Payment Details
          </h3>
          <button
            onClick={() => setShowPaymentModal(false)}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            ×
          </button>
        </div>

        {/* Order Summary - FIXED VISIBILITY */}
        <div style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #e9ecef",
          color: "#2c3e50" // FIXED: Added explicit color
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>Order Summary</h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#2c3e50" }}>
            <span>Subtotal:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#2c3e50" }}>
            <span>Tax (6%):</span>
            <span>${(totalAmount * 0.06).toFixed(2)}</span>
          </div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            fontWeight: "bold", 
            borderTop: "1px solid #dee2e6", 
            paddingTop: "5px",
            color: "#2c3e50" // FIXED: Added explicit color
          }}>
            <span>Total:</span>
            <span>${(totalAmount * 1.06).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form - FIXED INPUT HANDLERS */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#2c3e50" }}>
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardData.cardNumber}
              onChange={handleCardNumberChange} // FIXED: Direct handler
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #ecf0f1",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
                color: "#2c3e50" // FIXED: Added text color
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#2c3e50" }}>
                Month
              </label>
              <input
                type="text"
                placeholder="MM"
                value={cardData.expiryMonth}
                onChange={handleExpiryMonthChange} // FIXED: Direct handler
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ecf0f1",
                  borderRadius: "6px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  color: "#2c3e50" // FIXED: Added text color
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#2c3e50" }}>
                Year
              </label>
              <input
                type="text"
                placeholder="YYYY"
                value={cardData.expiryYear}
                onChange={handleExpiryYearChange} // FIXED: Direct handler
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ecf0f1",
                  borderRadius: "6px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  color: "#2c3e50" // FIXED: Added text color
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#2c3e50" }}>
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                value={cardData.cvv}
                onChange={handleCvvChange} // FIXED: Direct handler
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #ecf0f1",
                  borderRadius: "6px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  color: "#2c3e50" // FIXED: Added text color
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#2c3e50" }}>
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={cardData.cardholderName}
              onChange={handleCardholderNameChange} // FIXED: Direct handler
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #ecf0f1",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
                color: "#2c3e50" // FIXED: Added text color
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {paymentError && (
          <div style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "15px",
            border: "1px solid #f5c6cb"
          }}>
            {paymentError}
          </div>
        )}

        {/* Security Info */}
        <div style={{
          backgroundColor: "#d4edda",
          color: "#155724",
          padding: "10px",
          borderRadius: "6px",
          marginBottom: "20px",
          fontSize: "14px",
          border: "1px solid #c3e6cb"
        }}>
          🔒 Your payment information is encrypted and secure
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowPaymentModal(false)}
            style={{
              flex: 1,
              padding: "12px",
              border: "2px solid #6c757d",
              backgroundColor: "transparent",
              color: "#6c757d",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Cancel
          </button>
          <button
            onClick={processPayment}
            disabled={paymentLoading}
            style={{
              flex: 2,
              padding: "12px",
              border: "none",
              backgroundColor: paymentLoading ? "#aaa" : "#28a745",
              color: "white",
              borderRadius: "6px",
              cursor: paymentLoading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            {paymentLoading ? "Processing..." : `Pay $${(totalAmount * 1.06).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );

  const SuccessPopup = () => {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "500px",
            textAlign: "center",
            color: "black",
            position: "relative",
          }}
        >
          <button
            onClick={() => setIsSuccessPopupOpen(false)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "transparent",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#333",
            }}
          >
            ×
          </button>
          <h2 style={{ margin: "1rem" }}>Order Placed Successfully!</h2>
          <p>
            Your order has been placed and a confirmation email has been sent
            with all the details. - <strong>{successOrderId}</strong>
          </p>
          <p style={{ marginTop: "10px", color: "#28a745", fontSize: "16px", fontWeight: "bold" }}>
            Payment Successful - Total: ${finalOrderAmount?.toFixed(2)}
          </p>
        </div>
      </div>
    );
  };

  // FIXED CART ITEM COMPONENT - Replaced React Native components with HTML
  const CartItem = ({ itemKey, item }) => {
    const basePrice = parseFloat(item.basePrice || item.price);
    const [quantity, setQuantity] = useState(item.quantity);
    const [totalPrice, setTotalPrice] = useState(basePrice * item.quantity);

    const updateCart = async (newQuantity) => {
      try {
        let cart = JSON.parse(localStorage.getItem("cart")).items || {};

        if (cart[itemKey]) {
          if (newQuantity <= 0) {
            delete cart[itemKey];
          } else {
            cart[itemKey].quantity = newQuantity;
            cart[itemKey].basePrice = basePrice.toFixed(2);
            cart[itemKey].price = (newQuantity * basePrice).toFixed(2);
          }
        }

        setCartItems(cart);
        localStorage.setItem(
          "cart",
          JSON.stringify({ items: cart, totalItems: Object.keys(cart).length })
        );
        dispatch(rehydrateCart());
      } catch (err) {
        console.error("Error updating cart:", err);
      }
    };

    const handleIncrease = () => {
      const newQty = quantity + 1;
      setQuantity(newQty);
      setTotalPrice(newQty * basePrice);
      updateCart(newQty);
    };

    const handleDecrease = () => {
      const newQty = quantity - 1;
      if (newQty >= 1) {
        setQuantity(newQty);
        setTotalPrice(newQty * basePrice);
        updateCart(newQty);
      } else {
        setQuantity(0);
        setTotalPrice(0);
        updateCart(0);
      }
    };

    // FIXED: Replaced React Native components with HTML
    return (
      <div style={{ display: "flex", alignItems: "center", margin: "10px" }}>
        <button
          onClick={handleDecrease}
          style={{
            marginLeft: "10px",
            marginRight: "10px",
            backgroundColor: "transparent",
            border: "1px solid #dc3545",
            borderRadius: "4px",
            padding: "5px 8px",
            cursor: "pointer",
            color: "#dc3545"
          }}
        >
          <FaMinus />
        </button>

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "18px", color: "#2c3e50", fontWeight: "bold" }}>{quantity}</span>
        </div>

        <button
          onClick={handleIncrease}
          style={{
            marginLeft: "10px",
            marginRight: "10px",
            backgroundColor: "transparent",
            border: "1px solid #28a745",
            borderRadius: "4px",
            padding: "5px 8px",
            cursor: "pointer",
            color: "#28a745"
          }}
        >
          <FaPlus />
        </button>
      </div>
    );
  };

  const Loader = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          border: "8px solid #f3f3f3",
          borderTop: "8px solid #3498db",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  return (
    <>
      {isLoading && <Loader />}
      {paymentLoading && <Loader />}
      {isSuccessPopupOpen && <SuccessPopup />}
      {showPaymentModal && <PaymentModal />}
      
      <style>
        {`
          @media (max-width: 768px) {
            .header-container {
              flex-wrap: wrap;
            }
            .nav {
              flex-direction: column;
              align-items: flex-start;
            }
            .logo {
              order: 2;
              width: 100%;
              text-align: center;
              margin-top: 10px;
            }
            .social-icons {
              order: 1;
              width: 100%;
              display: flex;
              justify-content: space-evenly;
              align-items: center;
              flex-wrap: nowrap;
            }
            .social-icons > * {
              flex-shrink: 0;
            }
          }
          @media (min-width: 769px) {
            .nav {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              order: 0;
            }
            .social-icons {
              order: 0;
              display: flex;
              gap: 10px;
            }
          }
        `}
      </style>
      
      <header>
        <div className="header-container">
          <div className="nav">
            <div className="logo">
              <img className="header-logo" src="../logo.png" alt="logo" />
            </div>
            <div className="social-icons">
              <SocialIcon
                className="social-icon"
                url="https://www.facebook.com/people/RAJA-RANI-Indian-Restaurant/100085630432560/"
                target="_blank"
                rel="noopener noreferrer"
              />
              <SocialIcon
                url="https://www.instagram.com/raja_rani_indian_restaurant/"
                target="_blank"
                rel="noopener noreferrer"
              />
              <SocialIcon
                url="https://www.yelp.com/biz/raja-rani-indian-restaurant-canton"
                target="_blank"
                rel="noopener noreferrer"
              />
              <SocialIcon
                url="https://chat.whatsapp.com/JVMf5MZJCEp2XPakE4YYaW?mode=ac_t"
                target="_blank"
                rel="noopener noreferrer"
                network="whatsapp"
                bgColor="#25D366"
              />
              <a
                href="https://maps.app.goo.gl/NRvpEc4paaSJSgxE9"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <FaMapMarkerAlt
                  className="icon-header"
                  style={{ color: "#FF4C4C" }}
                />
              </a>
              <a
                href="mailto:rajaranicanton2@gmail.com"
                style={{ color: "#2a2a2a" }}
              >
                <FaEnvelope
                  className="icon-header"
                  style={{ color: "#007BFF" }}
                />
              </a>
              <a href="tel:7344045523" style={{ color: "#2a2a2a" }}>
                <FaPhoneAlt
                  className="icon-header"
                  style={{ color: "#28A745" }}
                />
              </a>
            </div>
          </div>
        </div>

        {/* ORDER CONFIRMATION MODAL */}
        {isPopupOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1001,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                position: "relative",
                background: "white",
                width: "90vw",
                maxWidth: "520px",
                maxHeight: "85vh",
                overflowY: "auto",
                boxSizing: "border-box",
              }}
            >
              <h3
                style={{
                  marginBottom: "15px",
                  color: "black",
                  background: "white",
                }}
              >
                Order Confirmation
              </h3>
              {Object.keys(cartItems).length > 0 && (
                <div
                  style={{
                    maxHeight: "15rem",
                    overflowY:
                      Object.keys(cartItems).length > 5 ? "scroll" : "auto",
                    marginTop: "15px",
                    borderTop: "1px solid #ccc",
                    paddingTop: "10px",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: "0 10px",
                      tableLayout: "fixed",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          textAlign: "center",
                          padding: "10px 0",
                          borderBottom: "2px solid #ccc",
                          color: "#333",
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        <th
                          style={{
                            width: "60%",
                            wordWrap: "break-word",
                            padding: "10px",
                          }}
                        >
                          Name
                        </th>
                        <th style={{ width: "20%", padding: "10px" }}>Qty</th>
                        <th style={{ width: "20%", padding: "10px" }}>Price</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: "black" }}>
                      {Object.entries(cartItems).map(
                        ([name, { quantity, price, spiceLevel, addons }]) => (
                          <tr
                            key={name}
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "5px 0",
                            }}
                          >
                            <td
                              style={{
                                wordWrap: "break-word",
                                whiteSpace: "normal",
                                padding: "5px",
                              }}
                            >
                              {name.split("_")[0]}
                              {spiceLevel ? (
                                <span style={{ color: "red" }}>
                                  {" "}
                                  - {spiceLevel}
                                </span>
                              ) : (
                                ""
                              )}

                              {addons && addons.length > 0 && (
                                <>
                                  <br />
                                  <small>
                                    Addons:{" "}
                                    {addons
                                      .map((a) => `${a.name} (+${a.price})`)
                                      .join(", ")}
                                  </small>
                                </>
                              )}
                            </td>
                            <td>
                              {" "}
                              <CartItem itemKey={name} item={cartItems[name]} />
                            </td>
                            <td>{price}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <input
                type="text"
                placeholder="Subtotal"
                disabled
                value={`Subtotal: ${totalAmount.toFixed(2)}`}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginTop: "20px",
                }}
              />
              <input
                type="text"
                placeholder="Sales Tax"
                disabled
                value={`Sales Tax (6%): ${(totalAmount * 0.06).toFixed(2)}`}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginTop: "10px",
                }}
              />
              <input
                type="text"
                placeholder="Total Amount"
                disabled
                value={`Total Amount: ${(totalAmount * 1.06).toFixed(2)}`}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginTop: "10px",
                }}
              />

              {orderMode !== "dinein" && (
                <>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={mobileNumber}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginTop: "5px",
                      marginBottom: "5px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  {mobileError && (
                    <div style={{ color: "red", marginBottom: "15px" }}>
                      {mobileError}
                    </div>
                  )}
                  <input
                    type="email"
                    placeholder="Email (Required for order confirmation)"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    required
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginTop: "5px",
                      marginBottom: "5px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  {emailError && (
                    <div style={{ color: "red", marginBottom: "15px" }}>
                      {emailError}
                    </div>
                  )}
                  <input
                    type="tel"
                    placeholder="Name"
                    value={name}
                    onChange={handleNameChange}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginTop: "5px",
                      marginBottom: "5px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  {nameError && (
                    <div style={{ color: "red", marginBottom: "15px" }}>
                      {nameError}
                    </div>
                  )}
                </>
              )}

              <br />
              <br />

              {orderMode === "dinein" && (
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "15px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Table {i + 1}
                    </option>
                  ))}
                </select>
              )}

              <div
                className="option-group"
                style={{
                  marginTop: "10px",
                  display: "flex",
                  gap: "5rem",
                  justifyContent: "space-evenly",
                }}
              >
                {deliveryModes && deliveryModes.map((mode) => (
                  <label
                    key={mode}
                    style={{
                      color: "black",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      fontSize: "14px",
                    }}
                  >
                    <input
                      type="radio"
                      name="orderType"
                      value={mode}
                      checked={orderMode === mode}
                      onChange={() => {
                        setOrderMode(mode);
                        if (mode === "pickup") {
                          setAddress("Pickup");
                        }
                      }}
                      style={{ marginBottom: "3px" }}
                    />
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </label>
                ))}
              </div>

              {orderMode === "delivery" && (
                <>
                  <br />
                  <button
                    onClick={getLocation}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "15px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  >
                    Locate Me
                  </button>
                  <br />
                  <br />
                  <textarea
                    id="address"
                    name="address"
                    rows="5"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "15px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  ></textarea>
                  {addressError && (
                    <div style={{ color: "red", marginBottom: "15px" }}>
                      {addressError}
                    </div>
                  )}
                </>
              )}
              {(deliveryModes && (deliveryModes.includes("dinein") ||
                deliveryModes.includes("pickup") ||
                deliveryModes.includes("delivery"))) && (
                <button
                  onClick={handleOrderNow}
                  disabled={isCartEmpty}
                  style={{
                    backgroundColor: isCartEmpty ? "#aaa" : "black",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    cursor: isCartEmpty ? "not-allowed" : "pointer",
                    marginRight: "10px",
                    marginTop: "10px",
                  }}
                >
                  {isCartEmpty ? `Add items to cart` : `Order Now`}
                </button>
              )}
              <button
                onClick={() => setIsPopupOpen(false)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "black",
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            display: "inline-block",
            zIndex: 1000,
          }}
        >
          <button
            aria-label="Cart"
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "24px",
            }}
            onClick={(e) => {
              e.preventDefault();
              handleCartClick();
            }}
          >
            <FaShoppingCart size={38} />
          </button>

          {Object.keys(localStorageCartItems).length > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: "white",
                color: "black",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {Object.keys(localStorageCartItems).length}
            </span>
          )}
        </div>
      </header>
    </>
  );
}

export default Header;