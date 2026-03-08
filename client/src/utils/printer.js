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

  let receipt = "";

  // Header
  receipt += "--------------------------------\n";
  receipt += `Order Number : ${order.orderNumber}\n`;
  receipt += `Order Date   : ${formattedDate}\n`;
  receipt += `Order Time   : ${formattedTime}\n`;
  receipt += `Order Type   : ${order.orderType}\n`;

  if (order.orderType === "dinein") {
    receipt += `Table No     : ${order.tableNumber}\n`;
  } else {
    receipt += `Name         : ${order.customer?.name || "-"}\n`;
    receipt += `Phone        : ${order.customer?.phone || "-"}\n`;
  }

  receipt += "--------------------------------\n\n";

  // Items
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

  // Create print window
  const printWindow = window.open("", "", "width=300,height=600");

  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body{
            width:80mm;
            font-family: monospace;
            font-size:12px;
            padding:10px;
          }
          pre{
            white-space:pre-wrap;
            word-wrap:break-word;
          }
          @media print {
            body{
              margin:0;
            }
          }
        </style>
      </head>
      <body>
        <pre>${receipt}</pre>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
  return true;
};
