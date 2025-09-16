import React, { useState, useEffect } from 'react';

const SecurePaymentForm = ({ orderData, onPaymentSuccess, onPaymentError }) => {
  const [loading, setLoading] = useState(false);
  const [clientKey, setClientKey] = useState('');
  const [apiLoginID, setApiLoginID] = useState('');
  const [environment, setEnvironment] = useState('sandbox');
  const [acceptJsLoaded, setAcceptJsLoaded] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    zipCode: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch client configuration on component mount
  useEffect(() => {
    fetchClientConfig();
  }, []);

  const fetchClientConfig = async () => {
    try {
      console.log('Fetching client configuration...');
      const response = await fetch('/api/payment/client-config');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Client config response:', data);
      
      if (data.success && data.clientKey && data.apiLoginID) {
        setClientKey(data.clientKey);
        setApiLoginID(data.apiLoginID);
        setEnvironment(data.environment);
        setConfigLoaded(true);
        loadAcceptJS(data.acceptJsUrl);
      } else {
        console.error('Invalid client configuration:', data);
        onPaymentError('Failed to initialize payment system: ' + (data.message || 'Invalid configuration'));
      }
    } catch (error) {
      console.error('Failed to fetch client configuration:', error);
      onPaymentError('Payment system initialization failed: ' + error.message);
    }
  };

  // Dynamically load Accept.js script
  const loadAcceptJS = (acceptJsUrl) => {
    if (document.getElementById('acceptjs-script')) {
      setAcceptJsLoaded(true);
      return;
    }

    console.log('Loading Accept.js from:', acceptJsUrl);
    const script = document.createElement('script');
    script.id = 'acceptjs-script';
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = acceptJsUrl;
    
    script.onload = () => {
      console.log('Accept.js loaded successfully');
      setAcceptJsLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Accept.js:', error);
      onPaymentError('Payment system failed to load');
    };
    
    document.head.appendChild(script);
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Validate card number using Luhn algorithm
  const validateCardNumber = (number) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleanNumber)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    // Cardholder name
    if (!paymentData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    } else if (paymentData.cardholderName.trim().length < 2) {
      newErrors.cardholderName = 'Please enter a valid name';
    }

    // Card number
    if (!paymentData.cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!validateCardNumber(paymentData.cardNumber)) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    // Expiry month
    if (!paymentData.expiryMonth) {
      newErrors.expiryMonth = 'Expiry month is required';
    }

    // Expiry year
    if (!paymentData.expiryYear) {
      newErrors.expiryYear = 'Expiry year is required';
    } else {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const expYear = parseInt('20' + paymentData.expiryYear);
      const expMonth = parseInt(paymentData.expiryMonth);
      
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        newErrors.expiryYear = 'Card has expired';
      }
    }

    // CVV
    if (!paymentData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(paymentData.cvv)) {
      newErrors.cvv = 'CVV must be 3-4 digits';
    }

    // ZIP Code
    if (!paymentData.zipCode) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(paymentData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      processedValue = formatCardNumber(value);
    }
    
    // Limit CVV to 4 digits
    if (name === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // Format ZIP code
    if (name === 'zipCode') {
      processedValue = value.replace(/[^0-9-]/g, '').slice(0, 10);
    }

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    setPaymentData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSecurePayment = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    if (!clientKey || !apiLoginID) {
      onPaymentError('Payment system not properly configured');
      return;
    }

    if (!window.Accept || !acceptJsLoaded) {
      onPaymentError('Payment system not ready. Please try again.');
      return;
    }

    if (!orderData) {
      onPaymentError('Order data is missing. Please refresh and try again.');
      return;
    }

    setLoading(true);

    // Prepare secure data for Accept.js tokenization
    const secureData = {
      cardData: {
        cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
        month: paymentData.expiryMonth,
        year: paymentData.expiryYear,
        cardCode: paymentData.cvv,
        zip: paymentData.zipCode,
        fullName: paymentData.cardholderName.trim()
      },
      authData: {
        clientKey: clientKey,
        apiLoginID: apiLoginID
      }
    };

    console.log('Tokenizing payment data with Accept.js...');

    // SECURE: Tokenize payment data with Accept.js
    window.Accept.dispatchData(secureData, (response) => {
      if (response.messages.resultCode === 'Error') {
        setLoading(false);
        const errorMessage = response.messages.message
          .map(msg => msg.text)
          .join(', ');
        console.error('Accept.js tokenization failed:', errorMessage);
        onPaymentError(`Payment validation failed: ${errorMessage}`);
        return;
      }

      console.log('Payment tokenization successful');
      
      // SUCCESS: We now have a secure payment nonce
      const paymentNonce = response.opaqueData.dataValue;
      const dataDescriptor = response.opaqueData.dataDescriptor;
      
      // Send tokenized payment to your secure backend
      processSecurePayment(paymentNonce, dataDescriptor);
    });
  };

  const processSecurePayment = async (paymentNonce, dataDescriptor) => {
    try {
      console.log('Sending tokenized payment to backend...');
      
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentNonce: paymentNonce,
          dataDescriptor: dataDescriptor,
          orderData: orderData,
          billingInfo: {
            cardholderName: paymentData.cardholderName.trim(),
            zipCode: paymentData.zipCode
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend payment response:', result);
      
      setLoading(false);

      if (result.success) {
        console.log('Payment successful!');
        onPaymentSuccess(result);
        // Clear form data for security
        setPaymentData({
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          cardholderName: '',
          zipCode: ''
        });
        setErrors({});
      } else {
        console.error('Payment failed:', result.message);
        onPaymentError(result.message || 'Payment processing failed');
      }
    } catch (error) {
      setLoading(false);
      console.error('Payment processing error:', error);
      onPaymentError('Network error during payment processing. Please try again.');
    }
  };

  // Show loading state while configuration is being fetched
  if (!configLoaded) {
    return (
      <div className="secure-payment-form">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Initializing secure payment system...</p>
        </div>
        <style jsx>{`
          .loading-state {
            text-align: center;
            padding: 40px;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="secure-payment-form">
      <div className="security-notice">
        <div className="security-badge">
          🔒 SECURE PAYMENT
        </div>
        <p>Your payment information is encrypted and tokenized for maximum security.</p>
        <div className="environment-badge">
          Environment: {environment.toUpperCase()}
        </div>
        {!acceptJsLoaded && (
          <div className="loading-notice">
            Loading payment processor...
          </div>
        )}
      </div>

      <form onSubmit={handleSecurePayment} className="payment-form">
        <div className="form-group">
          <label htmlFor="cardholderName">Cardholder Name *</label>
          <input
            type="text"
            id="cardholderName"
            name="cardholderName"
            value={paymentData.cardholderName}
            onChange={handleInputChange}
            required
            placeholder="John Smith"
            className={errors.cardholderName ? 'error' : ''}
          />
          {errors.cardholderName && <span className="error-text">{errors.cardholderName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="cardNumber">Card Number *</label>
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={paymentData.cardNumber}
            onChange={handleInputChange}
            required
            placeholder="1234 5678 9012 3456"
            maxLength="19"
            className={errors.cardNumber ? 'error' : ''}
          />
          {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expiryMonth">Month *</label>
            <select
              id="expiryMonth"
              name="expiryMonth"
              value={paymentData.expiryMonth}
              onChange={handleInputChange}
              required
              className={errors.expiryMonth ? 'error' : ''}
            >
              <option value="">MM</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            {errors.expiryMonth && <span className="error-text">{errors.expiryMonth}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="expiryYear">Year *</label>
            <select
              id="expiryYear"
              name="expiryYear"
              value={paymentData.expiryYear}
              onChange={handleInputChange}
              required
              className={errors.expiryYear ? 'error' : ''}
            >
              <option value="">YY</option>
              {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year.toString().slice(-2)}>
                  {year.toString().slice(-2)}
                </option>
              ))}
            </select>
            {errors.expiryYear && <span className="error-text">{errors.expiryYear}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="cvv">CVV *</label>
            <input
              type="text"
              id="cvv"
              name="cvv"
              value={paymentData.cvv}
              onChange={handleInputChange}
              required
              placeholder="123"
              maxLength="4"
              className={errors.cvv ? 'error' : ''}
            />
            {errors.cvv && <span className="error-text">{errors.cvv}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="zipCode">Billing ZIP Code *</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={paymentData.zipCode}
            onChange={handleInputChange}
            required
            placeholder="12345"
            maxLength="10"
            className={errors.zipCode ? 'error' : ''}
          />
          {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
        </div>

        <button 
          type="submit" 
          disabled={loading || !clientKey || !acceptJsLoaded || !orderData}
          className={`payment-button ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing Secure Payment...
            </>
          ) : (
            <>
              🔒 Pay Securely {orderData?.totalAmount ? `$${orderData.totalAmount}` : ''}
            </>
          )}
        </button>

        <div className="security-features">
          <div className="security-item">✓ 256-bit SSL Encryption</div>
          <div className="security-item">✓ PCI DSS Compliant</div>
          <div className="security-item">✓ Tokenized Processing</div>
        </div>
      </form>

      <style jsx>{`
        .secure-payment-form {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }

        .security-notice {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
          text-align: center;
        }

        .security-badge {
          background: rgba(255,255,255,0.2);
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .environment-badge {
          background: rgba(255,255,255,0.15);
          display: inline-block;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 10px;
          margin-top: 8px;
        }

        .loading-notice {
          background: rgba(255,255,255,0.1);
          padding: 8px 12px;
          border-radius: 15px;
          font-size: 12px;
          margin-top: 8px;
          animation: pulse 1.5s ease-in-out infinite alternate;
        }

        @keyframes pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }

        .payment-form {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #4a5568;
          font-weight: 600;
        }

        input, select {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        input.error, select.error {
          border-color: #e53e3e;
        }

        .error-text {
          color: #e53e3e;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .payment-button {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .payment-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .payment-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .security-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .security-item {
          text-align: center;
          font-size: 12px;
          color: #68d391;
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .security-features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SecurePaymentForm;