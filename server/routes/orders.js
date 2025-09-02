const express = require("express");
const router = express.Router();
const Order = require("../models/orders");
const emailjs = require("@emailjs/nodejs");
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
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

    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: "tcp://96.85.105.126:9100", // Replace with your printer's real IP + port
    });

    try {
      printer.alignCenter();
      printer.bold(true);
      printer.drawLine();
      printer.println(`Order Number :  ${req.body.orderNumber}`);
      printer.println(`Date         :  ${new Date().toLocaleString()}`);
      printer.println(`Order Type   :  ${req.body.orderType}`);
      if (req.body.orderType === "dinein") {
        printer.println(`Table No     :  ${req.body.tableNumber}`);
      } else {
        printer.println(`Name         :  ${req.body.customer.name}`);
        printer.println(`Phone        :  ${req.body.customer.Phone}`);
      }

      printer.drawLine();
      printer.bold(false);

      // Loop and print each item
      req.body.items.forEach((item) => {
        printer.alignLeft();
        printer.println(`Name: ${item.name}`);
        printer.println(`Qty: ${item.quantity}`);
      });

      // Cut paper
      printer.cut();
      const success = await printer.execute(); // Await execution
      console.log("Print done!", success);
    } catch (error) {
      console.error("Print failed:", error);
    }

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

module.exports = router;
