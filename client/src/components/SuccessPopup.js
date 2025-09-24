import React from "react";

const SuccessPopup = ({ isSuccessPopupOpen, setIsSuccessPopupOpen, billDetails, tableNo, tips, setTips, tipsPercentage, setTipsPercentage, handleSettle, tipsPercentageUpdate }) => {
  if (!isSuccessPopupOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "500px",
          textAlign: "center",
          color: "black",
          position: "relative",
          maxHeight: "50rem",
          overflow: "scroll",
        }}
      >
        <button
          onClick={() => setIsSuccessPopupOpen(false)}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "transparent",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#333",
          }}
        >
          ×
        </button>
        <h2 style={{ margin: "1rem" }}>Order Details for {tableNo}</h2>

        <img
          src="https://rajarani-michigan.s3.us-east-2.amazonaws.com/general/qr.png"
          alt="Payment QR Code"
          style={{ width: "250px", height: "250px", margin: "10px 0" }}
        />
        <div>
          <div
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#fafafa",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span>Sub Total</span>
              <span>{billDetails.subTotal.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span>Sales Tax</span>
              <span>{billDetails.salesTax.toFixed(2)}</span>
            </div>
            <hr style={{ margin: "8px 0" }} />

            <span>Tips %</span>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <select
                value={tipsPercentage}
                onChange={(e) => tipsPercentageUpdate(e)}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "15px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 100].map((percentage) => (
                  <option key={percentage} value={percentage}>
                    {percentage}%
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <input
                type="number"
                placeholder="Please Enter Tip..."
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                className="form-input"
              />
            </div>

            <br />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
              }}
            >
              <span>Total Amount</span>
              <span>{billDetails.totalAmount.toFixed(2)}</span>
            </div>

            <br />
            {tips > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                }}
              >
                <span>With Tips</span>
                <span>
                  {parseFloat(billDetails.totalAmount) + parseFloat(tips)}
                </span>
              </div>
            )}

            <button
              onClick={handleSettle}
              style={{
                backgroundColor: "black",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
                marginTop: "10px",
              }}
            >
              Settle
            </button>
          </div>
          <br />
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Name
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Quantity
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Price
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {billDetails.items.map((item) => (
                <tr key={item._id}>
                  <td style={{ border: "1px solid black", padding: "8px" }}>
                    {item.name.split("_")[0]}
                    {item.spiceLevel ? (
                      <span style={{ color: "red" }}>
                        {" "}
                        - {item.spiceLevel}
                      </span>
                    ) : (
                      ""
                    )}

                    {item.addons && item.addons.length > 0 && (
                      <>
                        <br />
                        <small>
                          Addons:{" "}
                          {item.addons
                            .map((a) => `${a.name.replace(/^Add\s/, '').trim()} (+${a.price})`)
                            .join(", ")}
                        </small>
                      </>
                    )}
                  </td>
                  <td style={{ border: "1px solid black", padding: "8px" }}>
                    {item.quantity}
                  </td>
                  <td style={{ border: "1px solid black", padding: "8px" }}>
                    ${item.basePrice}
                  </td>
                  <td style={{ border: "1px solid black", padding: "8px" }}>
                    ${item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;