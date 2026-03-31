const express = require("express");
const router = express.Router();
const emailjs = require("@emailjs/nodejs");
const Registration = require("../models/register");

function buildRegistrationHTML(body) {
  const veg = Number(body.vegCount) || 0;
  const nonVeg = Number(body.nonVegCount) || 0;
  const total = veg + nonVeg;

  const row = (label, value) =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;white-space:nowrap;">${label}</td>` +
    `<td style="padding:6px 12px;border-bottom:1px solid #eee;">${value}</td></tr>`;

  return (
    `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">` +
    `<thead><tr style="background:#343a40;color:#fff;">` +
    `<th style="padding:8px 12px;text-align:left;">Detail</th>` +
    `<th style="padding:8px 12px;text-align:left;">Info</th>` +
    `</tr></thead><tbody>` +
    row("Event Name", body.eventName?.trim() || "—") +
    row("Event Date", body.eventDate?.trim() || "—") +
    row("Guest Name", body.name?.trim() || "—") +
    row("Mobile", body.mobile?.trim() || "—") +
    row("Veg Guests", veg) +
    row("Non-Veg Guests", nonVeg) +
    row("Total Guests", `<strong>${total}</strong>`) +
    `</tbody></table>`
  );
}

router.post("/", async (req, res) => {
  try {
    const register = new Registration({ ...req.body, storeId: req.storeId });
    const savedRegistration = await register.save();

    const registrationHTML = buildRegistrationHTML(req.body);

    // Then send email from frontend using EmailJS
    const templateParams = {
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      eventDate: req.body.eventDate.trim(),
      eventName: req.body.eventName.trim(),
      mobile: req.body.mobile.trim(),
      order_details: registrationHTML,
    };

    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_REGISTRATION_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    emailjs
      .send(serviceId, templateId, templateParams, {
        publicKey: publicKey,
        privateKey: privateKey,
      })
      .then((response) => {
        console.log("Email sent successfully!", response.status, response.text);
      })
      .catch((err) => {
        console.error("Failed to send email:", err);
      });

    res.status(201).json(savedRegistration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payment processing endpoint for registrations
router.post("/payment", async (req, res) => {
  try {
    const { opaqueData, amount, registrationId } = req.body;

    const API_LOGIN_ID = process.env.AUTHORIZE_API_LOGIN_ID?.trim();
    const TRANSACTION_KEY = process.env.AUTHORIZE_TRANSACTION_KEY?.trim();

    if (!API_LOGIN_ID || !TRANSACTION_KEY) {
      return res
        .status(500)
        .json({ success: false, error: "Server missing API credentials" });
    }

    const paymentData = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: API_LOGIN_ID,
          transactionKey: TRANSACTION_KEY,
        },
        refId: registrationId,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amount,
          payment: {
            opaqueData: {
              dataDescriptor: "COMMON.ACCEPT.INAPP.PAYMENT",
              dataValue: opaqueData.dataValue,
            },
          },
          order: {
            invoiceNumber: registrationId,
            description: "New registration placed",
          },
        },
      },
    };

    // Send payment request to Authorize.net
    const response = await fetch(
      "https://api.authorize.net/xml/v1/request.api",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      },
    );

    const result = await response.json();

    if (
      result.transactionResponse &&
      result.transactionResponse.responseCode === "1"
    ) {
      // Payment successful - return transaction details
      // Registration will be saved by frontend after successful payment
      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        transactionId: result.transactionResponse.transId,
      });
    } else {
      // Payment failed
      res.status(400).json({
        success: false,
        message:
          result.transactionResponse?.errors?.[0]?.errorText ||
          "Payment failed",
      });
    }
  } catch (err) {
    console.error("Payment processing error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Registration.find({ storeId: req.storeId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
