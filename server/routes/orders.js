const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const emailjs = require("@emailjs/nodejs");

function buildEmailHTML(items) {
  const rows = items
    .map(({ name, quantity, price }) => {
      const unitPrice = parseFloat(price);
      const lineTotal = quantity * unitPrice;
      return `
          <tr>
            <td style="padding:8px;border:1px solid #ccc;">${name}</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:center;">${quantity}</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:right;">$${unitPrice.toFixed(
              2
            )}</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:right;">$${lineTotal.toFixed(
              2
            )}</td>
          </tr>`;
    })
    .join("");

  const grandTotal = items.reduce(
    (sum, { quantity, price }) => sum + quantity * parseFloat(price),
    0
  );

  return `
        <table style="border-collapse:collapse;width:100%;font-family:Arial, sans-serif;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Item</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Qty</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Unit Price</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f2f2f2;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr>
              <td colspan="3" style="padding:8px;border:1px solid #ccc;text-align:right;font-weight:bold;">Grand Total</td>
              <td style="padding:8px;border:1px solid #ccc;text-align:right;font-weight:bold;">$${grandTotal.toFixed(
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
    // console.log(emailHTML);

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
    console.log(err);
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

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedOrder)
      return res.status(404).json({ error: "Order not found" });
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
