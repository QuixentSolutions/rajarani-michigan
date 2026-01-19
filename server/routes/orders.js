const express = require("express");
const router = express.Router();
const Order = require("../models/orders");
const Printer = require("../models/printer");
const emailjs = require("@emailjs/nodejs");
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
const axios = require("axios");
const PDFDocument = require("pdfkit");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const wsServer = require("../ws");

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

    const wss = wsServer.getWSS();

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "new_order",
            orderNumber: savedOrder.orderNumber,
            orderType: savedOrder.orderType,
            customer: savedOrder.customer,
            totalAmount: savedOrder.totalAmount,
            createdAt: savedOrder.createdAt,
            sentAt: new Date(),
          })
        );
      }
    });

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Order save error:", err);
    console.error("Order save request body:", req.body);
    res.status(500).json({ error: err.message });
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
    if (!order) return res.status(500).json({ error: "Order not found" });

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
    if (!result) return res.status(500).json({ error: "Order not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/accept", async (req, res) => {
  try {
    const filter = {
      orderNumber: req.body.orderNumber,
    };
    const order = await Order.findOne(filter);
    const print = await printOrder(order);
    if (!print)
      return res.status(500).json({ error: "Unable to connect to printer" });
    req.body.updatedAt = new Date();
    const update = {
      $set: {
        status: "accepted",
      },
    };
    const result = await Order.updateOne(filter, update);
    if (!result) return res.status(500).json({ error: "Order not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/reject", async (req, res) => {
  try {
    const filter = {
      orderNumber: req.body.orderNumber,
    };
    const order = await Order.findOne(filter);
    req.body.updatedAt = new Date();
    const update = {
      $set: {
        status: "rejected",
      },
    };
    const result = await Order.updateOne(filter, update);
    if (!result) return res.status(500).json({ error: "Order not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

router.post("/payment", async (req, res) => {
  try {
    const { opaqueData, amount, orderId } = req.body;

    if (!opaqueData || !opaqueData.dataValue || !opaqueData.dataDescriptor) {
      return res
        .status(500)
        .json({ success: false, error: "Invalid opaqueData" });
    }

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
              updatedAt: new Date(),
              payment: {
                method: "online",
                status: "paid",
                transactionId: response.data.transactionResponse.transId,
              },
            },
          };
          const order = await Order.findOneAndUpdate(filter, update, {
            returnDocument: "after",
          });

          const emailHTML = buildEmailHTML(order.items);

          if (!order.customer.email) {
            return res.json({
              code: 200,
              status: "success",
              transactionId: response.data.transactionResponse.transId,
              authCode: response.data.transactionResponse.authCode,
              message:
                response.data.transactionResponse.messages[0].description,
            });
          }
          const templateParams = {
            email: order.customer.email.trim(),
            name: order.customer.name.trim(),
            mobile_number: String(order.customer.phone),
            order_mode: String(order.orderType),
            order_id: String(order.orderNumber),
            sub_total: order.subTotal.toFixed(2),
            sales_tax: order.salesTax.toFixed(2),
            total_amount: order.totalAmount.toFixed(2),
            address: order.deliveryAddress ? order.deliveryAddress : "N/A",
            order_details: emailHTML,
          };
          const serviceId = process.env.EMAILJS_SERVICE_ID;
          const templateId = process.env.EMAILJS_ORDER_TEMPLATE_ID;
          const publicKey = process.env.EMAILJS_PUBLIC_KEY;
          const privateKey = process.env.EMAILJS_PRIVATE_KEY;
          try {
            await emailjs.send(serviceId, templateId, templateParams, {
              publicKey,
              privateKey,
            });
          } catch (err) {
            // Email send failed silently
          } finally {
            return res.json({
              code: 200,
              status: "success",
              transactionId: response.data.transactionResponse?.transId,
              authCode: response.data.transactionResponse?.authCode,
              message:
                response.data.transactionResponse?.messages?.[0]?.description,
            });
          }
        } else {
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
        console.error("Transaction error:", error);
        return res.status(500).json({
          success: false,
          error: "Payment processing failed",
        });
      });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

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

router.put("/kitchen/:id", async (req, res) => {
  try {
    const result = await Order.findByIdAndUpdate(
      req.params.id,
      { sentToKitchen: 1, updatedAt: new Date() },
      { new: true }
    );
    const print = await printOrder(result);
    if (!print)
      return res.status(500).json({ error: "Unable to connect to printer" });
    if (!result) {
      return res.status(500).json({ error: "Order not found" });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function printOrder(order) {
  const printerConfig = await Printer.findOne().sort({ createdAt: -1 });

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const formattedTime = orderDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  let receipt = "";

  // === Header ===
  receipt += "--------------------------------\n";
  receipt += `Order Number : ${order.orderNumber}\n`;
  receipt += `Order Date   : ${formattedDate}\n`;
  receipt += `Order Time   : ${formattedTime}\n`;
  receipt += `Order Type   : ${order.orderType}\n`;

  if (order.orderType === "dinein") {
    receipt += `Table No     : ${order.tableNumber}\n`;
  } else {
    receipt += `Name         : ${order.customer.name}\n`;
    receipt += `Phone        : ${order.customer.phone || "-"}\n`;
  }

  receipt += "--------------------------------\n\n";

  // === Items ===
  order.items.forEach((item) => {
    const itemName = item.name.split("_")[0];
    receipt += `${item.quantity} X ${itemName}\n`;

    if (item.spiceLevel) {
      receipt += `    ${item.spiceLevel}\n`;
    }

    if (item.addons && item.addons.length > 0) {
      item.addons.forEach((addon) => {
        const addonName = typeof addon === "object" ? addon.name : addon;
        receipt += `    ${addonName}\n`;
      });
    }
  });

  receipt += "\n--------------------------------\n";
  receipt += "Thank you!\n";

  let printer = new ThermalPrinter({
    type: PrinterTypes.STAR,
    interface: `tcp://${printerConfig?.printerIp}`,
  });

  let isConnected = false;
  try {
    isConnected = await printer.isPrinterConnected();
  } catch (err) {
    console.error(
      `[ERROR] Printer not connected at error block - ${printerConfig?.printerIp}`
    );
  }

  if (!isConnected) {
    // ❌ Printer not connected - return false
    console.error(
      `[ERROR] Printer not connected at after success verification - ${printerConfig?.printerIp}`
    );
    return false;
  }

  // Printer is connected - proceed with printing
  printer.bold(true);
  printer.println(receipt);
  printer.bold(false);
  printer.cut();

  try {
    await printer.execute();
    console.log(
      `[SUCCESS] Order ${order.orderNumber} printed to thermal printer`
    );
    // ✅ Generate PDF ONLY in development/test mode
    if (process.env.NODE_ENV !== "production") {
      const receiptsDir = path.join(__dirname, "..", "receipts");
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const pdfPath = path.join(receiptsDir, `${order.orderNumber}.pdf`);
      const doc = new PDFDocument({
        size: [226.77, 600],
        margin: 10,
      });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      doc.font("Courier").fontSize(10);

      doc.text("--------------------------------", { align: "left" });
      doc.text(`Order Number : ${order.orderNumber}`);
      doc.text(`Order Date   : ${formattedDate}`);
      doc.text(`Order Time   : ${formattedTime}`);
      doc.text(`Order Type   : ${order.orderType}`);

      if (order.orderType === "dinein") {
        doc.text(`Table No     : ${order.tableNumber}`);
      } else {
        doc.text(`Name         : ${order.customer.name}`);
        doc.text(`Phone        : ${order.customer.phone || "-"}`);
      }

      doc.text("--------------------------------");
      doc.moveDown(0.3);

      order.items.forEach((item) => {
        const itemName = item.name.split("_")[0];

        doc.font("Courier-Bold").fontSize(10);
        doc.text(`${item.quantity} X ${itemName}`);

        doc.font("Courier").fontSize(8);
        if (item.spiceLevel) {
          doc.text(`    ${item.spiceLevel}`);
        }
        if (item.addons && item.addons.length > 0) {
          item.addons.forEach((addon) => {
            const addonName = typeof addon === "object" ? addon.name : addon;
            doc.text(`    ${addonName}`);
          });
        }
      });

      doc.font("Courier").fontSize(10);
      doc.moveDown(0.3);
      doc.text("--------------------------------");
      doc.text("Thank you!", { align: "center" });
      doc.end();
      await new Promise((resolve) => stream.on("finish", resolve));
      console.log(`[TEST MODE] PDF backup created: ${pdfPath}`);
    }

    return true;
  } catch (err) {
    console.error(
      `[ERROR] Failed to print order ${order.orderNumber}:`,
      err.message
    );
    return false;
  }
}

module.exports = router;
