const express = require("express");
const router = express.Router();
const Order = require("../models/orders");
const Invoice = require("../models/invoice");
const emailjs = require("@emailjs/nodejs");
const axios = require("axios");
const WebSocket = require("ws");
const path = require("path");
const wsServer = require("../ws");

// Build and save an Invoice from one or more Order documents
async function createInvoiceFromOrders(storeId, orders, paymentMethod) {
  try {
    if (!orders || orders.length === 0) return;

    // Merge items from all orders into invoice line items
    const items = orders.flatMap((o) =>
      (o.items || []).map((it) => {
        const addonStr =
          it.addons && it.addons.length > 0
            ? ` + ${it.addons.map((a) => a.name).join(", ")}`
            : "";
        const spiceStr = it.spiceLevel ? ` (${it.spiceLevel})` : "";
        return {
          description: `${(it.name || "").split("_")[0]}${spiceStr}${addonStr}`,
          qty: it.quantity || 1,
          unitPrice: parseFloat(it.basePrice) || 0,
          amount: parseFloat(it.price) || 0,
        };
      })
    );

    const subtotal = orders.reduce((s, o) => s + (o.subTotal || 0), 0);
    const taxAmt   = orders.reduce((s, o) => s + (o.salesTax || 0), 0);
    const total    = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const tips     = orders.reduce((s, o) => s + (o.tips || 0), 0);

    const firstOrder = orders[0];
    const orderNums  = orders.map((o) => o.orderNumber).join(", ");

    // Build a unique invoice number
    const invoiceNo = orders.length === 1
      ? `ORD-${firstOrder.orderNumber}`
      : `TABLE-${firstOrder.tableNumber || "NA"}-${Date.now()}`;

    const notesParts = [
      `Order type: ${firstOrder.orderType}`,
      firstOrder.tableNumber && firstOrder.tableNumber !== "0"
        ? `Table: ${firstOrder.tableNumber}`
        : null,
      `Order #: ${orderNums}`,
      paymentMethod ? `Payment: ${paymentMethod}` : null,
      tips > 0 ? `Tips: $${tips.toFixed(2)}` : null,
    ].filter(Boolean);

    const invoice = new Invoice({
      storeId,
      invoiceNo,
      date: new Date(),
      customer: {
        name: firstOrder.customer?.name || "",
        email: firstOrder.customer?.email || "",
      },
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discountPct: 0,
      discountAmt: 0,
      taxAmt: Math.round(taxAmt * 100) / 100,
      total: Math.round((total + tips) * 100) / 100,
      notes: notesParts.join(" | "),
      status: "paid",
    });

    await invoice.save();
  } catch (err) {
    // Invoice creation failure must not break the order response
    console.error("Auto-invoice creation failed:", err.message);
  }
}

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
              2,
            )}</td>
            <td style="padding:8px;border:1px solid #ccc;text-align:right;">$${lineTotal.toFixed(
              2,
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
                2,
              )}</td>
            </tr>
          </tbody>
        </table>
      `;
}

router.post("/", async (req, res) => {
  try {
    const order = new Order({ ...req.body, storeId: req.storeId });
    const savedOrder = await order.save();

    const wss = wsServer.getWSS();

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "new_order",
            storeId: req.storeId,
            orderNumber: savedOrder.orderNumber,
            orderType: savedOrder.orderType,
            customer: savedOrder.customer,
            totalAmount: savedOrder.totalAmount,
            createdAt: savedOrder.createdAt,
            sentAt: new Date(),
          }),
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
    const filter = { storeId: req.storeId };
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
      storeId: req.storeId,
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
      { items: [], orderNumbers: [], subTotal: 0, salesTax: 0, totalAmount: 0 },
    );

    combined.subTotal = Math.round(combined.subTotal * 100) / 100;
    combined.salesTax = Math.round(combined.salesTax * 100) / 100;
    combined.totalAmount = Math.round(combined.totalAmount * 100) / 100;

    // Only include discount details for dinein orders
    const isDineinOrder = order.some((o) => o.orderType === "dinein");
    if (isDineinOrder) {
      // Fetch discount settings to include discount details
      const Settings = require("../models/settings");
      const settings = await Settings.findOne({ storeId: req.storeId }).sort({ createdAt: -1 });
      if (settings?.settings?.discount && settings.settings.discountDetails) {
        const discountDetails = settings.settings.discountDetails;
        const discountPercentage = parseFloat(discountDetails.percentage || 0);
        const discountAmount = (combined.subTotal * discountPercentage) / 100;

        combined.discountAmount = Math.round(discountAmount * 100) / 100;
        combined.discountPercentage = discountPercentage;
      } else {
        combined.discountAmount = 0;
        combined.discountPercentage = 0;
      }
    } else {
      // For non-dinein orders, don't include discount details
      combined.discountAmount = 0;
      combined.discountPercentage = 0;
    }

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/settle", async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const filter = {
      storeId: req.storeId,
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

    // Auto-create invoice from the settled orders
    const settledOrders = await Order.find({
      storeId: req.storeId,
      orderNumber: { $in: req.body.orderNumbers.split(",") },
      tableNumber: req.body.tableNumber,
    });
    await createInvoiceFromOrders(req.storeId, settledOrders, req.body.paymentMethod);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/accept", async (req, res) => {
  try {
    const filter = {
      storeId: req.storeId,
      orderNumber: req.body.orderNumber,
    };
    const order = await Order.findOne(filter);
    // const print = await printOrder(order);
    // if (!print)
    //   return res.status(500).json({ error: "Unable to connect to printer" });
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
      storeId: req.storeId,
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
    const totalCount = await Order.countDocuments({ storeId: req.storeId });
    const skip = (req.query.page - 1) * req.query.limit;
    const orders = await Order.find({ storeId: req.storeId })
      .skip(skip)
      .limit(req.query.limit)
      .sort({ createdAt: -1 });
    res.json({ results: orders, totalPages: totalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/orderId/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, storeId: req.storeId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
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
          const filter = { storeId: req.storeId, orderNumber: orderId };
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

          // Auto-create invoice for the paid online order
          await createInvoiceFromOrders(req.storeId, [order], "online");

          const wss = wsServer.getWSS();

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "new_order",
                  storeId: req.storeId,
                  orderNumber: orderId,
                  orderType: "pickup",
                  sentAt: new Date(),
                }),
              );
            }
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
            preparation_time: order.totalAmount > 80 ? "35" : "25",
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
      storeId: req.storeId,
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
    const result = await Order.findOneAndUpdate(
      { _id: req.params.id, storeId: req.storeId },
      { sentToKitchen: 1, updatedAt: new Date() },
      { new: true },
    );
    // const print = await printOrder(result);
    // if (!print)
    //   return res.status(500).json({ error: "Unable to connect to printer" });
    if (!result) {
      return res.status(500).json({ error: "Order not found" });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
