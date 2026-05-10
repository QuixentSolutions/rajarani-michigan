const buildReceiptHtml = (order, orderTypeLabel, formattedDate, formattedTime, customerInfo, itemsHtml) => `
  <html>
    <head>
      <title>Order #${order.orderNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { height: auto; }
        body {
          width: 80mm;
          height: auto;
          font-family: 'Arial Black', Arial, sans-serif;
          font-size: 18px;
          padding: 4mm 4mm 0 4mm;
          color: #000;
        }
        .divider {
          border: none;
          border-top: 3px solid #000;
          margin: 8px 0;
        }
        .order-number {
          font-size: 36px;
          font-weight: 900;
          text-align: center;
          letter-spacing: 2px;
        }
        .order-type {
          font-size: 28px;
          font-weight: 900;
          text-align: center;
          background: #000;
          color: #fff;
          padding: 4px 0;
          margin: 6px 0;
          letter-spacing: 3px;
        }
        .info-block {
          margin: 6px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: bold;
          margin: 3px 0;
        }
        .info-label { color: #555; }
        .info-value { text-align: right; }
        .items-section { margin: 8px 0; }
        .item { margin: 10px 0; }
        .item-main {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .item-qty {
          font-size: 28px;
          font-weight: 900;
          min-width: 24px;
        }
        .item-x {
          font-size: 22px;
          font-weight: 700;
        }
        .item-name {
          font-size: 22px;
          font-weight: 900;
          flex: 1;
        }
        .detail {
          font-size: 16px;
          font-weight: 600;
          padding-left: 36px;
          margin-top: 2px;
          color: #333;
        }
        .footer {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin-top: 10px;
          padding-bottom: 6mm;
        }
        .cut-line {
          text-align: center;
          font-size: 14px;
          letter-spacing: 2px;
          color: #555;
          margin: 12px 0;
        }
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          html, body { margin: 0; padding: 0; height: auto; }
          body { padding: 4mm 4mm 0 4mm; }
        }
      </style>
    </head>
    <body>
      <div class="order-number">#${order.orderNumber}</div>
      <div class="order-type">${orderTypeLabel}</div>
      <hr class="divider" />
      <div class="info-block">
        <div class="info-row"><span class="info-label">Date</span><span class="info-value">${formattedDate}</span></div>
        <div class="info-row"><span class="info-label">Time</span><span class="info-value">${formattedTime}</span></div>
        ${customerInfo}
      </div>
      <hr class="divider" />
      <div class="items-section">
        ${itemsHtml}
      </div>
      <hr class="divider" />
      <div class="footer">Thank you!</div>

      <div class="cut-line">- - - - - - - - ✂ - - - - - - - -</div>

      <div class="order-number">#${order.orderNumber}</div>
      <div class="order-type">${orderTypeLabel}</div>
      <hr class="divider" />
      <div class="info-block">
        <div class="info-row"><span class="info-label">Date</span><span class="info-value">${formattedDate}</span></div>
        <div class="info-row"><span class="info-label">Time</span><span class="info-value">${formattedTime}</span></div>
        ${customerInfo}
      </div>
      <hr class="divider" />
      <div class="items-section">
        ${itemsHtml}
      </div>
      <hr class="divider" />
      <div class="footer">Thank you!</div>
    </body>
  </html>
`;

const sendToPrinter = (html) => {
  const win = window.open("", "", "width=400,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  win.close();
};

export const printOrder = (order) => {
  if (!order) return;

  const orderDate = new Date(order.createdAt);

  const formattedDate = orderDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const formattedTime = orderDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const orderTypeLabel =
    order.orderType === "dinein"
      ? "DINE IN"
      : order.orderType === "pickup"
      ? "PICKUP"
      : "DELIVERY";

  let customerInfo = "";
  if (order.orderType === "dinein") {
    customerInfo = `<div class="info-row"><span class="info-label">Table</span><span class="info-value">${order.tableNumber}</span></div>`;
  } else {
    customerInfo = `
      <div class="info-row"><span class="info-label">Name</span><span class="info-value">${order.customer?.name || "-"}</span></div>
      <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${order.customer?.phone || "-"}</span></div>
    `;
  }

  let itemsHtml = "";
  order.items.forEach((item) => {
    const itemName = item.name.split("_")[0];
    let detailsHtml = "";

    if (item.spiceLevel) {
      detailsHtml += `<div class="detail">&#8594; ${item.spiceLevel}</div>`;
    }

    if (item.addons && item.addons.length > 0) {
      item.addons.forEach((addon) => {
        const addonName = typeof addon === "object" ? addon.name : addon;
        detailsHtml += `<div class="detail">&#8594; ${addonName}</div>`;
      });
    }

    itemsHtml += `
      <div class="item">
        <div class="item-main">
          <span class="item-qty">${item.quantity}</span>
          <span class="item-x">×</span>
          <span class="item-name">${itemName}</span>
        </div>
        ${detailsHtml}
      </div>
    `;
  });

  const html = buildReceiptHtml(order, orderTypeLabel, formattedDate, formattedTime, customerInfo, itemsHtml);

  sendToPrinter(html);

  return true;
};
