const express = require('express');
const router = express.Router();
const ApiContracts = require('authorizenet').APIContracts;
const ApiControllers = require('authorizenet').APIControllers;
const SDKConstants = require('authorizenet').Constants;


// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const apiLoginKey = process.env.AUTHORIZE_NET_API_LOGIN_ID;
const transactionKey = process.env.AUTHORIZE_NET_TRANSACTION_KEY;
const clientKey = process.env.AUTHORIZE_NET_CLIENT_KEY;

// Validate environment variables
if (!apiLoginKey || !transactionKey || !clientKey) {
  console.error('Missing Authorize.Net credentials in environment variables');
  console.error('Please set AUTHORIZE_NET_API_LOGIN_ID, AUTHORIZE_NET_TRANSACTION_KEY, and AUTHORIZE_NET_CLIENT_KEY');
}

// Set environment (sandbox or production)
if (isProduction) {
  process.env.AUTHORIZE_NET_ENVIRONMENT = SDKConstants.endpoint.production;
} else {
  process.env.AUTHORIZE_NET_ENVIRONMENT = SDKConstants.endpoint.sandbox;
}

// NEW: Client configuration endpoint (matches frontend expectation)
router.get('/client-config', (req, res) => {
  if (!clientKey || !apiLoginKey) {
    return res.status(500).json({
      success: false,
      message: 'Client configuration not available'
    });
  }

  const acceptJsUrl = isProduction 
    ? 'https://js.authorize.net/v1/Accept.js'
    : 'https://jstest.authorize.net/v1/Accept.js';

  res.json({
    success: true,
    clientKey: clientKey,
    apiLoginID: apiLoginKey,
    environment: isProduction ? 'production' : 'sandbox',
    acceptJsUrl: acceptJsUrl
  });
});

// SECURE: Process payment using Accept.js token (NO raw card data)
router.post('/process', async (req, res) => {
  try {
    // UPDATED: Match frontend data structure
    const { paymentNonce, dataDescriptor, orderData, billingInfo } = req.body;

    console.log('Payment request received:', {
      hasPaymentNonce: !!paymentNonce,
      hasOrderData: !!orderData,
      hasBillingInfo: !!billingInfo,
      dataDescriptor
    });

    // Validate required fields - NOTE: No raw card data expected
    if (!orderData || !paymentNonce) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment token or order data'
      });
    }

    // Validate credentials
    if (!apiLoginKey || !transactionKey) {
      return res.status(500).json({
        success: false,
        message: 'Payment system configuration error - missing credentials'
      });
    }

    // Validate order data
    if (!orderData.items || !Array.isArray(orderData.items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order items data'
      });
    }

    // Validate customer data
    if (!orderData.customer || !orderData.customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing customer information'
      });
    }

    console.log('Processing SECURE payment for order:', orderData.orderNumber);

    // Create merchant authentication
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(apiLoginKey);
    merchantAuthenticationType.setTransactionKey(transactionKey);

    // SECURE: Use payment nonce instead of raw card data
    const opaqueData = new ApiContracts.OpaqueDataType();
    opaqueData.setDataDescriptor(dataDescriptor || 'COMMON.ACCEPT.INAPP.PAYMENT');
    opaqueData.setDataValue(paymentNonce);

    // Create payment object with opaque data (tokenized)
    const paymentType = new ApiContracts.PaymentType();
    paymentType.setOpaqueData(opaqueData);

    // Create order information
    const orderDetails = new ApiContracts.OrderType();
    orderDetails.setInvoiceNumber(orderData.orderNumber);
    orderDetails.setDescription(`Rajarani Restaurant Order - ${orderData.orderNumber}`);

    // Create customer information
    const customerData = new ApiContracts.CustomerDataType();
    customerData.setType(ApiContracts.CustomerTypeEnum.INDIVIDUAL);
    customerData.setEmail(orderData.customer.email);

    // Create billing address (use billingInfo if provided)
    const customerAddress = new ApiContracts.CustomerAddressType();
    customerAddress.setFirstName(orderData.customer.firstName || (billingInfo?.cardholderName?.split(' ')[0]) || 'Customer');
    customerAddress.setLastName(orderData.customer.lastName || (billingInfo?.cardholderName?.split(' ').slice(1).join(' ')) || 'Guest');
    customerAddress.setEmail(orderData.customer.email);
    
    if (orderData.customer.phone) {
      customerAddress.setPhoneNumber(orderData.customer.phone);
    }

    // Add ZIP code if provided in billingInfo
    if (billingInfo?.zipCode) {
      customerAddress.setZip(billingInfo.zipCode);
    }

    // Create transaction request
    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(orderData.totalAmount);
    transactionRequestType.setOrder(orderDetails);
    transactionRequestType.setCustomer(customerData);
    transactionRequestType.setBillTo(customerAddress);

    // Add line items
    if (orderData.items && orderData.items.length > 0) {
      const lineItems = [];
      
      orderData.items.forEach((item, index) => {
        if (item && item.name && item.quantity && item.basePrice) {
          const lineItem = new ApiContracts.LineItemType();
          lineItem.setItemId(`item_${index + 1}`);
          lineItem.setName(String(item.name).substring(0, 31));
          lineItem.setDescription(item.spiceLevel ? `Spice: ${item.spiceLevel}` : 'Restaurant Item');
          lineItem.setQuantity(parseInt(item.quantity) || 1);
          lineItem.setUnitPrice(parseFloat(item.basePrice) || 0);
          
          lineItems.push(lineItem);
        }
      });

      if (lineItems.length > 0) {
        const lineItemArray = new ApiContracts.ArrayOfLineItem();
        lineItemArray.setLineItem(lineItems);
        transactionRequestType.setLineItems(lineItemArray);
      }
    }

    // Create the API request
    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    // Execute the transaction
    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());

    const response = await new Promise((resolve, reject) => {
      ctrl.execute(() => {
        try {
          const apiResponse = ctrl.getResponse();
          const response = new ApiContracts.CreateTransactionResponse(apiResponse);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    // Handle the response
    if (response && response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
      const transactionResponse = response.getTransactionResponse();

      if (transactionResponse && transactionResponse.getMessages() && 
          transactionResponse.getResponseCode() === '1') {
        
        const transactionId = transactionResponse.getTransId();
        const authCode = transactionResponse.getAuthCode();

        console.log('SECURE payment approved:', {
          transactionId,
          authCode,
          amount: orderData.totalAmount,
          orderNumber: orderData.orderNumber
        });

        res.json({
          success: true,
          transactionId: transactionId,
          authorizationCode: authCode,
          message: 'Payment processed successfully',
          paymentStatus: 'approved',
          amount: orderData.totalAmount,
          responseCode: transactionResponse.getResponseCode()
        });

      } else {
        let errorText = 'Transaction failed';
        if (transactionResponse && transactionResponse.getErrors()) {
          const errors = transactionResponse.getErrors().getError();
          if (errors && errors.length > 0) {
            errorText = errors[0].getErrorText();
          }
        }

        console.log('Transaction declined:', errorText);

        res.status(400).json({
          success: false,
          message: errorText,
          errorCode: transactionResponse ? transactionResponse.getResponseCode() : 'UNKNOWN',
          paymentStatus: 'declined'
        });
      }
    } else {
      let errorText = 'API Error occurred';
      if (response && response.getMessages() && response.getMessages().getMessage()) {
        const messages = response.getMessages().getMessage();
        if (messages && messages.length > 0) {
          errorText = messages[0].getText();
        }
      }

      console.log('API Error:', errorText);

      res.status(500).json({
        success: false,
        message: 'Payment processing failed: ' + errorText,
        paymentStatus: 'error'
      });
    }

  } catch (error) {
    console.error('Secure payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// LEGACY: Keep existing client-key endpoint for backward compatibility
router.get('/client-key', (req, res) => {
  if (!clientKey) {
    return res.status(500).json({
      success: false,
      message: 'Client key not configured'
    });
  }

  res.json({
    clientKey: clientKey,
    environment: isProduction ? 'production' : 'sandbox'
  });
});

module.exports = router;