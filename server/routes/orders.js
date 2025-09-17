const express = require("express");
const router = express.Router();
const Order = require("../models/orders");
const emailjs = require("@emailjs/nodejs");
<<<<<<< HEAD
=======
const axios = require("axios");

const { APIContracts, APIControllers } = require("authorizenet");

>>>>>>> f589759 (completed payment gateway and s3 transfer)
function buildEmailHTML(items) {
  const rows = items
    .map(({ name, quantity, basePrice, price, spiceLevel, addons }) => {
      const unitPrice = parseFloat(basePrice);
      const lineTotal = parseFloat(price);

      return `
          <tr>
            <td style="padding:8px;border:1px solid #ccc;">${
              name.split("_")[0]
            }</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:center;">${quantity}</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:center;">${
              spiceLevel ? spiceLevel : "NA"
            }</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:center;">${
              addons.length > 0
                ? addons.map((a) => `${a.name} ($${a.price})`).join(", ")
                : "NA"
            }</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:right;">$${unitPrice.toFixed(
              2
            )}</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:right;">$${lineTotal.toFixed(
              2
            )}</td>
          </tr>`;
    })
    .join("");

  const subTotal = items.reduce((sum, { price }) => sum + parseFloat(price), 0);

  return `
        <table style="border-collapse:collapse;width:100%;font-family:Arial, sans-serif;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Item</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Qty</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Spice Level</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Addons</th>   
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Unit Price</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr>
              <td colspan="5" style="padding:8px;border:1px solid #ccc;text-align:right;font-weight:bold;">Sub Total</td>
              <td style="padding:8px;border:1px solid #ccc;text-align:right;font-weight:bold;">$${subTotal.toFixed(
                2
              )}</td>
            </tr>
          </tbody>
        </table>
      `;
}

router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();

    const emailHTML = buildEmailHTML(req.body.items);

    if (!req.body.customer.email) {
      console.log("No customer email provided, skipping email send.");
      return res.status(201).json(savedOrder);
    }
    const templateParams = {
      email: req.body.customer.email.trim(), // Changed from 'to_email' to 'email' to match your template
      name: req.body.customer.name.trim(),
      mobile_number: String(req.body.customer.phone),
      order_mode: String(req.body.orderType),
      order_id: String(req.body.orderNumber),
      sub_total: req.body.subTotal.toFixed(2),
      sales_tax: req.body.salesTax.toFixed(2),
      total_amount: req.body.totalAmount.toFixed(2),
      address: req.body.deliveryAddress ? req.body.deliveryAddress : "N/A",
      order_details: emailHTML,
    };

    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_ORDER_TEMPLATE_ID;
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

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.tableNumber) filter.tableNumber = req.query.tableNumber;
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/table/:tableno", async (req, res) => {
  try {
    const order = await Order.find({
      tableNumber: req.params.tableno,
      status: "pending",
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const combined = order.reduce(
      (acc, order) => {
        acc.items.push(...order.items);
        acc.orderNumbers.push(order.orderNumber);
        acc.subTotal += order.subTotal;
        acc.salesTax += order.salesTax;
        acc.totalAmount += order.totalAmount;
        return acc;
      },
      { items: [], orderNumbers: [], subTotal: 0, salesTax: 0, totalAmount: 0 }
    );

    combined.subTotal = Math.round(combined.subTotal * 100) / 100;
    combined.salesTax = Math.round(combined.salesTax * 100) / 100;
    combined.totalAmount = Math.round(combined.totalAmount * 100) / 100;
    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/settle", async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const filter = {
      orderNumber: { $in: req.body.orderNumbers.split(",") },
      tableNumber: req.body.tableNumber,
    };
    const update = {
      $set: {
        status: "completed",
        tips: req.body.tips,
        payment: {
          method: req.body.paymentMethod,
          status: "paid",
          transactionId: "",
        },
      },
    };

    const result = await Order.updateMany(filter, update);
    if (!result) return res.status(404).json({ error: "Order not found" });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/accept", async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const filter = {
      orderNumber: req.body.orderNumber,
    };
    const update = {
      $set: {
        status: "accepted",
      },
    };

    const result = await Order.updateOne(filter, update);
    if (!result) return res.status(404).json({ error: "Order not found" });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.get("/all", async (req, res) => {
  try {
    const totalCount = await Order.countDocuments();
    const skip = (req.query.page - 1) * req.query.limit;
    const orders = await Order.find({})
      .skip(skip)
      .limit(req.query.limit)
      .sort({ createdAt: -1 });
    res.json({ results: orders, totalPages: totalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

<<<<<<< HEAD
router.get("/kitchen", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      orderType: "dinein",
      sentToKitchen: 0,
    };

    const totalCount = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ results: orders, totalPages: Math.ceil(totalCount / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/kitchen/:id/send", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { sentToKitchen: 1, updatedAt: new Date() },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
=======
router.post("/payment", async (req, res) => {
  try {
    // 1️⃣ Extract data from request
    const { opaqueData, amount, orderId } = req.body;

    if (!opaqueData || !opaqueData.dataValue || !opaqueData.dataDescriptor) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid opaqueData" });
    }

    // 2️⃣ Load and trim credentials
    const API_LOGIN_ID = process.env.AUTHORIZE_API_LOGIN_ID?.trim();
    const TRANSACTION_KEY = process.env.AUTHORIZE_TRANSACTION_KEY?.trim();

    if (!API_LOGIN_ID || !TRANSACTION_KEY) {
      return res
        .status(500)
        .json({ success: false, error: "Server missing API credentials" });
    }

    const payload = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: API_LOGIN_ID,
          transactionKey: TRANSACTION_KEY,
        },
        refId: orderId,
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
            invoiceNumber: orderId,
            description: "New online order placed",
          },
        },
      },
    };

    axios
      .post("https://api.authorize.net/xml/v1/request.api", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {
        if (
          response &&
          response.data.transactionResponse &&
          response.data.transactionResponse?.responseCode === "1" &&
          response.data.messages?.resultCode === "Ok"
        ) {
          const filter = { orderNumber: orderId };
          const update = {
            $set: {
              status: "completed",
              updatedAt: new Date(),
              payment: {
                method: "online",
                status: "paid",
                transactionId: response.transactionResponse.transId,
              },
            },
          };
          await Order.updateOne(filter, update);
          return res.json({
            code: 200,
            status: "success",
            transactionId: response.transactionResponse.transId,
            authCode: response.transactionResponse.authCode,
            message: response.transactionResponse.messages[0].description,
          });
        } else {
          // Payment failed or declined
          const errorMessage =
            (response.data.transactionResponse &&
              response.data.transactionResponse.errors?.[0]?.errorText) ||
            response.data.messages.message?.[0]?.text ||
            "Transaction failed";

          return res.json({
            code: 500,
            status: "failed",
            message: errorMessage,
          });
        }
      })
      .catch((error) => {
        console.error(
          "Transaction error:",
          error.response ? error.response.data : error.message
        );
      });
  } catch (err) {
    console.error("Payment error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
>>>>>>> f589759 (completed payment gateway and s3 transfer)
  }
});

module.exports = router;
