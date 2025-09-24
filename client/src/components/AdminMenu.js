import React, { useState, useCallback } from "react";
import "./AdminMenu.css"; // Import the new CSS file

const spiceLevels = ["Mild", "Medium", "Hot", "Very Mild", "Indian Hot"];
const predefinedAddons = [
  { name: "Veggies", price: 1 },
  { name: "Meat", price: 2 },
];

const AdminMenu = ({
  menuData,
  handleSaveMenu,
  setSelectedSection: setAdminDashboardSelectedSection, // Renamed to avoid conflict
  setModalType: setAdminDashboardModalType, // Renamed to avoid conflict
  setShowModal: setAdminDashboardShowModal, // Renamed to avoid conflict
  renderPagination,
  fetchMenuData,
  searchMenuQuery,
  authToken, // Pass authToken from AdminDashboard
  setError, // Pass setError from AdminDashboard
  setSuccess, // Pass setSuccess from AdminDashboard
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedSection, setSelectedSection] = useState(null); // Local state for selected section
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [editingItemData, setEditingItemData] = useState(null);

  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    price: "",
    spicelevel: [],
    addons: [],
  });

  const addMenuItem = async () => {
    if (!selectedSection || !newMenuItem.name || !newMenuItem.price) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const url = `/menu/category/${selectedSection._id}/item`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newMenuItem.name,
          price: parseFloat(newMenuItem.price),
          spicelevel: newMenuItem.spicelevel,
          addons: newMenuItem.addons.map((addon) => ({
            ...addon,
            name: addon.name.replace(/^Add\s/, "").trim(), // Remove "Add " prefix
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Success: Menu item added successfully!");
      setSuccess("Menu item added successfully!");
      setNewMenuItem({ name: "", price: "", spicelevel: [], addons: [] });

      const latestMenuData = await fetchMenuData();
      if (latestMenuData && latestMenuData.items) {
        const updatedSection = latestMenuData.items.find(
          (section) => section._id === selectedSection._id
        );
        if (updatedSection) {
          setSelectedSection(updatedSection);
        }
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to add menu item: ${err.message}. Make sure your server is running on port 5001.`
      );
    }
  };

  const updateMenuItem = async (itemToUpdate, updatedFields) => {
    try {
      if (!itemToUpdate || !itemToUpdate._id) {
        throw new Error("Invalid item - no ID found");
      }

      if (!selectedSection || !selectedSection._id) {
        throw new Error("No section selected");
      }

      const url = `menu/category/${selectedSection._id}/item/${itemToUpdate._id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedFields.name,
          price: parseFloat(updatedFields.price),
          spicelevel: updatedFields.spicelevel,
          addons: updatedFields.addons,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `Server responded with ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += `: ${errorData.message || "Update failed"}`;
        } catch {
          errorMessage += `: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      console.log("Success: Menu item updated successfully!");
      setSuccess("Menu item updated successfully!");
      setEditingMenuItem(null);
      setEditingItemData(null);

      const latestMenuData = await fetchMenuData();
      if (latestMenuData && latestMenuData.items) {
        const updatedSection = latestMenuData.items.find(
          (section) => section._id === selectedSection._id
        );
        if (updatedSection) {
          setSelectedSection(updatedSection);
        }
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to update menu item: ${err.message}`);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      if (!selectedSection || !selectedSection._id) {
        throw new Error("No section selected");
      }

      const url = `/menu/category/${selectedSection._id}/item/${itemId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `Server responded with ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += `: ${errorData.message || "Delete failed"}`;
        } catch {
          errorMessage += `: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      console.log("Success: Menu item deleted successfully!");
      setSuccess("Menu item deleted successfully!");

      const latestMenuData = await fetchMenuData();
      if (latestMenuData && latestMenuData.items) {
        const updatedSection = latestMenuData.items.find(
          (section) => section._id === selectedSection._id
        );
        if (updatedSection) {
          setSelectedSection(updatedSection);
        }
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to delete menu item: ${err.message}`);
    }
  };

  const renderMenuModal = () => {
    if (!showModal) return null;

    let modalTitle;

    if (modalType === "manage-items") {
      modalTitle = `Manage Items - ${
        selectedSection?.title || selectedSection?.name || "Unknown Section"
      }`;
    }

    return (
      <div
        className="modal-overlay"
        onClick={(e) =>
          e.target.className === "modal-overlay" && setShowModal(false)
        }
      >
        <div className="modal-content">
          <div className="modal-header">
            <h3>{modalTitle}</h3>
            <button onClick={() => setShowModal(false)} className="close-btn">
              ✕
            </button>
          </div>

          <div className="modal-body">
            {modalType === "manage-items" && selectedSection && (
              <div className="items-management">
                <div className="existing-items-section">
                  <h4>Existing Items ({selectedSection.items?.length || 0})</h4>
                  <div className="items-grid">
                    {selectedSection.items?.map((item, index) => {
                      const itemKey = item._id || `item-${item.name}-${index}`;
                      const hasValidId = item._id && item._id !== "NO_ID";

                      return (
                        <div key={itemKey} className="item-card">
                          {editingMenuItem === item._id ? (
                            <div className="edit-form">
                              <input
                                type="text"
                                value={editingItemData?.name || ""}
                                onChange={(e) => {
                                  setEditingItemData({
                                    ...editingItemData,
                                    name: e.target.value,
                                  });
                                }}
                                className="form-input"
                                placeholder="Item name"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={editingItemData?.price || ""}
                                onChange={(e) => {
                                  setEditingItemData({
                                    ...editingItemData,
                                    price: e.target.value,
                                  });
                                }}
                                className="form-input"
                                placeholder="Price"
                              />

                              {/* Spice Levels in edit mode */}
                              <div className="form-group">
                                <label>Spice Levels</label>
                                <div className="checkbox-group">
                                  {[
                                    ...new Set([
                                      ...spiceLevels,
                                      ...(editingItemData?.spicelevel || []),
                                    ]),
                                  ].map((level) => (
                                    <label
                                      key={level}
                                      className="checkbox-label"
                                    >
                                      <input
                                        type="checkbox"
                                        value={level}
                                        style={{ marginRight: "1rem" }}
                                        checked={
                                          editingItemData?.spicelevel?.includes(
                                            level
                                          ) || false
                                        }
                                        onChange={(e) => {
                                          const { checked, value } = e.target;
                                          setEditingItemData((prev) => ({
                                            ...prev,
                                            spicelevel: checked
                                              ? [
                                                  ...(prev.spicelevel || []),
                                                  value,
                                                ]
                                              : (prev.spicelevel || []).filter(
                                                  (l) => l !== value
                                                ),
                                          }));
                                        }}
                                      />
                                      {level}
                                    </label>
                                  ))}
                                </div>
                                {/* <div className="input-group" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                  <input
                                    type="text"
                                    placeholder="Add new spice level..."
                                    id="editSpiceLevelInput"
                                    className="form-input"
                                    style={{ flex: 2 }}
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById('editSpiceLevelInput');
                                      const value = input.value.trim();
                                      if (value !== '') {
                                        setEditingItemData((prev) => ({
                                          ...prev,
                                          spicelevel: [...(prev.spicelevel || []), value],
                                        }));
                                        input.value = '';
                                      }
                                    }}
                                    className="btn-secondary"
                                    style={{ flex: 0.5 }}
                                  >
                                    Add
                                  </button>
                                </div> */}
                              </div>
                              <h4>Addons</h4>
                              <div className="form-group">
                                <label>Select Addons</label>
                                <div className="checkbox-group">
                                  {(() => {
                                    const allAddonsMap = new Map();

                                    predefinedAddons.forEach((addon) =>
                                      allAddonsMap.set(addon.name, addon)
                                    );

                                    (editingItemData?.addons || []).forEach(
                                      (addon) => {
                                        const normalizedName = addon.name
                                          .replace(/^Add\s/, "")
                                          .trim();
                                        if (!allAddonsMap.has(normalizedName)) {
                                          allAddonsMap.set(normalizedName, {
                                            ...addon,
                                            name: normalizedName,
                                          });
                                        }
                                      }
                                    );

                                    return Array.from(
                                      allAddonsMap.values()
                                    ).map((addon) => (
                                      <label
                                        key={addon.name}
                                        className="checkbox-label"
                                      >
                                        <input
                                          type="checkbox"
                                          style={{ marginRight: "1rem" }}
                                          value={addon.name}
                                          checked={
                                            editingItemData?.addons?.some(
                                              (selectedAddon) =>
                                                selectedAddon.name
                                                  .replace(/^Add\s/, "")
                                                  .trim() === addon.name
                                            ) || false
                                          }
                                          onChange={(e) => {
                                            const { checked, value } = e.target;
                                            setEditingItemData((prev) => {
                                              const newAddons = checked
                                                ? [
                                                    ...(prev.addons || []),
                                                    {
                                                      name: value,
                                                      price: addon.price,
                                                    },
                                                  ]
                                                : (prev.addons || []).filter(
                                                    (selectedAddon) =>
                                                      selectedAddon.name
                                                        .replace(/^Add\s/, "")
                                                        .trim() !== value
                                                  );
                                              return {
                                                ...prev,
                                                addons: newAddons,
                                              };
                                            });
                                          }}
                                        />
                                        {addon.name} (${addon.price})
                                      </label>
                                    ));
                                  })()}
                                </div>
                                {/* <div
                                  className="input-group"
                                  style={{
                                    marginTop: "10px",
                                    display: "flex",
                                    gap: "10px",
                                  }}
                                >
                                  <input
                                    type="text"
                                    placeholder="Add new addon name..."
                                    id="editNewAddonNameInput"
                                    className="form-input"
                                    style={{ flex: 2 }}
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price"
                                    id="editNewAddonPriceInput"
                                    className="form-input"
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    onClick={() => {
                                      const nameInput = document.getElementById(
                                        "editNewAddonNameInput"
                                      );
                                      const priceInput =
                                        document.getElementById(
                                          "editNewAddonPriceInput"
                                        );
                                      const name = nameInput.value.trim();
                                      const price = parseFloat(
                                        priceInput.value
                                      );

                                      if (name !== "" && !isNaN(price)) {
                                        setEditingItemData((prev) => ({
                                          ...prev,
                                          addons: [
                                            ...(prev.addons || []),
                                            { name, price },
                                          ],
                                        }));
                                        nameInput.value = "";
                                        priceInput.value = "";
                                      }
                                    }}
                                    className="btn-secondary"
                                    style={{ flex: 0.5 }}
                                  >
                                    Add
                                  </button>
                                </div> */}
                              </div>

                              <div className="edit-actions">
                                <button
                                  onClick={() => {
                                    updateMenuItem(editingItemData, {
                                      name: editingItemData.name,
                                      price: editingItemData.price,
                                      spicelevel: editingItemData.spicelevel,
                                      addons: editingItemData.addons,
                                    });
                                  }}
                                  className="btn-success"
                                  disabled={!hasValidId}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMenuItem(null);
                                    setEditingItemData(null);
                                  }}
                                  className="btn-secondary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="item-display">
                              <h5>{item.name}</h5>
                              <div className="price-info">
                                <span className="new-price">${item.price}</span>
                              </div>

                              {(item.addons && item.addons.length > 0) ||
                              (item.spicelevel &&
                                item.spicelevel.length > 0) ? (
                                <div className="addons-display">
                                  {item.addons && item.addons.length > 0 && (
                                    <>
                                      <strong>Addons:</strong>
                                      <div className="addons-list-display">
                                        {item.addons.map((addon, index) => (
                                          <div
                                            key={index}
                                            className="addon-display"
                                          >
                                            {addon.name
                                              .replace(/^Add\s/, "")
                                              .trim()}{" "}
                                            - ${addon.price}
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}

                                  {item.spicelevel &&
                                    item.spicelevel.length > 0 && (
                                      <div className="spice-levels-display">
                                        <strong>Spice Levels:</strong>{" "}
                                        {item.spicelevel.join(", ")}
                                      </div>
                                    )}
                                </div>
                              ) : null}

                              <div className="item-actions">
                                <button
                                  onClick={() => {
                                    setEditingMenuItem(item._id);
                                    setEditingItemData({
                                      ...item,
                                      spicelevel: [...(item.spicelevel || [])],
                                      addons: (item.addons || []).map(
                                        (addon) => ({
                                          ...addon,
                                          name: addon.name
                                            .replace(/^Add\s/, "")
                                            .trim(),
                                        })
                                      ),
                                    });
                                  }}
                                  className="btn-edit"
                                  disabled={!hasValidId}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    deleteMenuItem(item._id);
                                  }}
                                  className="btn-delete"
                                  disabled={!hasValidId}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="add-item-section">
                  <h4>Add New Item</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Item Name *</label>
                      <input
                        type="text"
                        placeholder="Enter item name..."
                        value={newMenuItem.name}
                        onChange={(e) =>
                          setNewMenuItem({
                            ...newMenuItem,
                            name: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newMenuItem.price}
                        onChange={(e) =>
                          setNewMenuItem({
                            ...newMenuItem,
                            price: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Spice Levels</label>
                    <div className="checkbox-group">
                      {[
                        ...new Set([
                          ...spiceLevels,
                          ...(newMenuItem.spicelevel || []),
                        ]),
                      ].map((level) => (
                        <label key={level} className="checkbox-label">
                          <input
                            type="checkbox"
                            style={{ marginRight: "1rem" }}
                            value={level}
                            checked={newMenuItem.spicelevel.includes(level)}
                            onChange={(e) => {
                              const { checked, value } = e.target;
                              setNewMenuItem((prev) => ({
                                ...prev,
                                spicelevel: checked
                                  ? [...prev.spicelevel, value]
                                  : prev.spicelevel.filter((l) => l !== value),
                              }));
                            }}
                          />
                          {level}
                        </label>
                      ))}
                    </div>
                    {/* <div
                      className="input-group"
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Add new spice level..."
                        id="newSpiceLevelInput"
                        className="form-input"
                        style={{ flex: 2 }}
                      />
                      <button
                        onClick={() => {
                          const input =
                            document.getElementById("newSpiceLevelInput");
                          const value = input.value.trim();
                          if (value !== "") {
                            setNewMenuItem((prev) => ({
                              ...prev,
                              spicelevel: [...prev.spicelevel, value],
                            }));
                            input.value = "";
                          }
                        }}
                        className="btn-secondary"
                        style={{ flex: 0.5 }}
                      >
                        Add
                      </button>
                    </div> */}
                  </div>
                  <h4>Addons</h4>
                  <div className="form-group">
                    <label>Select Addons</label>
                    <div className="checkbox-group">
                      {(() => {
                        const predefinedAddons = [
                          { name: "Veggies", price: 1 },
                          { name: "Meat", price: 2 },
                        ];
                        const allAddonsMap = new Map();

                        predefinedAddons.forEach((addon) =>
                          allAddonsMap.set(addon.name, addon)
                        );

                        (newMenuItem.addons || []).forEach((addon) => {
                          const normalizedName = addon.name
                            .replace(/^Add\s/, "")
                            .trim();
                          if (!allAddonsMap.has(normalizedName)) {
                            allAddonsMap.set(normalizedName, {
                              ...addon,
                              name: normalizedName,
                            });
                          }
                        });

                        return Array.from(allAddonsMap.values()).map(
                          (addon) => {
                            const isChecked = newMenuItem.addons.some(
                              (selectedAddon) =>
                                selectedAddon.name
                                  .replace(/^Add\s/, "")
                                  .trim() === addon.name
                            );
                            return (
                              <label
                                key={addon.name}
                                className="checkbox-label"
                              >
                                <input
                                  type="checkbox"
                                  value={addon.name}
                                  style={{ marginRight: "1rem" }}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const { checked, value } = e.target;
                                    setNewMenuItem((prev) => {
                                      const newAddons = checked
                                        ? [
                                            ...prev.addons,
                                            { name: value, price: addon.price },
                                          ]
                                        : prev.addons.filter(
                                            (selectedAddon) =>
                                              selectedAddon.name
                                                .replace(/^Add\s/, "")
                                                .trim() !== value
                                          );
                                      return { ...prev, addons: newAddons };
                                    });
                                  }}
                                />
                                {addon.name} (${addon.price})
                              </label>
                            );
                          }
                        );
                      })()}
                    </div>
                    {/* <div
                      className="input-group"
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Add new addon name..."
                        id="newAddonNameInput"
                        className="form-input"
                        style={{ flex: 2 }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        id="newAddonPriceInput"
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => {
                          const nameInput =
                            document.getElementById("newAddonNameInput");
                          const priceInput =
                            document.getElementById("newAddonPriceInput");
                          const name = nameInput.value.trim();
                          const price = parseFloat(priceInput.value);

                          if (name !== "" && !isNaN(price)) {
                            setNewMenuItem((prev) => ({
                              ...prev,
                              addons: [...prev.addons, { name, price }],
                            }));
                            nameInput.value = "";
                            priceInput.value = "";
                          }
                        }}
                        className="btn-secondary"
                        style={{ flex: 0.5 }}
                      >
                        Add
                      </button>
                    </div> */}
                  </div>

                  <div className="form-group">
                    <button onClick={addMenuItem} className="btn-primary">
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="section-card">
        <div
          className="section-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className="section-title">Menu Management</h2>
          <button
            className="btn-primary"
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => fetchMenuData(1, searchMenuQuery)}
          >
            Refresh Menu
          </button>
        </div>

        <div className="menu-categories-grid">
          {menuData.items.length > 0 ? (
            menuData.items.map((category, index) => (
              <div key={category._id || index} className="menu-category-card">
                <h3 className="category-title">{category.title}</h3>
                <p className="category-item-count">
                  Items: {category.items?.length || 0}
                </p>
                <button
                  className="manage-items-btn"
                  onClick={() => {
                    setSelectedSection(category);
                    setModalType("manage-items");
                    setShowModal(true);
                  }}
                >
                  Manage Items
                </button>
              </div>
            ))
          ) : (
            <p className="empty-state">
              No menu categories found. Please add categories via the backend or
              a tool like MongoDB Compass.
            </p>
          )}
        </div>

        {renderPagination(menuData, (page) =>
          fetchMenuData(page, searchMenuQuery)
        )}
      </div>
      {renderMenuModal()}
    </>
  );
};

export default AdminMenu;