"use client"

import { useState, useEffect, useCallback } from "react"
import "./AdminDashboard.css"

const AdminDashboard = ({ onLogout }) => {
  const [authToken] = useState("Basic " + btoa("admin:password123"))
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("registrations")
  const [isLoading, setIsLoading] = useState(true)

  const [registrations, setRegistrations] = useState({ items: [], totalPages: 1, currentPage: 1 })
  const [orders, setOrders] = useState({ items: [], totalPages: 1, currentPage: 1 })
  const [menuData, setMenuData] = useState({ items: [], totalPages: 1, currentPage: 1 })

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  const [apiStatus, setApiStatus] = useState({})

  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    newPrice: "",
    oldPrice: "",
  })

  const [editingMenuItem, setEditingMenuItem] = useState(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      if (typeof onLogout === "function") {
        onLogout()
      } else {
        window.location.href = "/admin"
      }
    }
  }

  const fetchData = useCallback(
    async (url, token, retryCount = 0) => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        })

        if (response.status === 429) {
          if (retryCount < 2) {
            await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 2000))
            return fetchData(url, token, retryCount + 1)
          } else {
            throw new Error("Server is busy. Please wait a moment and refresh the page.")
          }
        }

        if (response.status === 401) {
          if (typeof onLogout === "function") {
            onLogout()
          } else {
            window.location.href = "/admin"
          }
          return
        }

        if (!response.ok) {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            throw new Error(errorData.message || `Server error (${response.status})`)
          } else {
            throw new Error(
              `Server returned ${response.status}. Please check if the backend is running on http://localhost:5000`,
            )
          }
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Server returned HTML instead of JSON. Please check if your backend API is running correctly.",
          )
        }

        return response.json()
      } catch (error) {
        if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
          throw new Error(
            "Unable to connect to server. Please check if your backend is running on http://localhost:5000",
          )
        }
        throw error
      }
    },
    [onLogout],
  )

  const createFetchFunction = useCallback(
    (setter, type) =>
      async (page = 1) => {
        try {
          setError("")
          const data = await fetchData(`http://localhost:5000/api/admin/${type}?page=${page}`, authToken)

          if (data && typeof data === "object") {
            if (Array.isArray(data)) {
              setter({ items: data, totalPages: 1, currentPage: 1 })
            } else if (data.items || data.data) {
              setter({
                items: data.items || data.data || [],
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || page,
              })
            } else {
              setter({ items: [], totalPages: 1, currentPage: 1 })
            }
          } else {
            setter({ items: [], totalPages: 1, currentPage: 1 })
          }
        } catch (err) {
          setError(`Failed to load ${type}: ${err.message}`)
          setter({ items: [], totalPages: 1, currentPage: 1 })
        }
      },
    [authToken, fetchData],
  )

  const fetchRegistrations = createFetchFunction(setRegistrations, "registrations")
  const fetchOrders = createFetchFunction(setOrders, "orders")
  const fetchMenuData = createFetchFunction(setMenuData, "menu")

  const refreshSelectedSectionItems = async () => {
    if (!selectedSection) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/menu/${selectedSection._id}`, {
        headers: { Authorization: authToken },
      })

      if (response.ok) {
        const updatedSection = await response.json()
        setSelectedSection(updatedSection)
      }
    } catch (err) {
      console.log("[v0] Failed to refresh section items:", err)
    }
  }

  // CRUD Operations for Menu Items
  const addMenuItem = async () => {
    if (!selectedSection || !newMenuItem.name || !newMenuItem.newPrice) {
      setError("Please fill in all required fields")
      return
    }

    try {
      console.log("[v0] Adding menu item to section:", selectedSection._id)
      console.log("[v0] Auth token:", authToken)
      console.log("[v0] New menu item data:", newMenuItem)

      const url = `${API_BASE_URL}/api/admin/menu/${selectedSection._id}/items`
      console.log("[v0] API URL:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMenuItem),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Error response:", errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("[v0] Success response:", result)

      setSuccess("Menu item added successfully!")
      setNewMenuItem({ name: "", newPrice: "", oldPrice: "" })

      await Promise.all([fetchMenuData(), refreshSelectedSectionItems()])

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.log("[v0] Add menu item error:", err)
      setError(`❌ Failed to add menu item: ${err.message}. Make sure your server is running on port 5000.`)
    }
  }

  const updateMenuItem = async (itemIndex, updatedItem) => {
    try {
      console.log("[v0] Updating menu item at index:", itemIndex)
      console.log("[v0] Updated item data:", updatedItem)
      console.log("[v0] Selected section ID:", selectedSection._id)

      const url = `${API_BASE_URL}/api/admin/menu/${selectedSection._id}/items/${itemIndex}`
      console.log("[v0] Update URL:", url)

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedItem),
      })

      console.log("[v0] Update response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Update error response:", errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      setSuccess("Menu item updated successfully!")
      setEditingMenuItem(null)

      await Promise.all([fetchMenuData(), refreshSelectedSectionItems()])

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.log("[v0] Update menu item error:", err)
      setError(`❌ Failed to update menu item: ${err.message}. Make sure your server is running on port 5000.`)
    }
  }

  const deleteMenuItem = async (itemIndex) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return
    }

    try {
      console.log("[v0] Deleting menu item at index:", itemIndex)
      console.log("[v0] Selected section ID:", selectedSection._id)

      const url = `${API_BASE_URL}/api/admin/menu/${selectedSection._id}/items/${itemIndex}`
      console.log("[v0] Delete URL:", url)

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Delete response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Delete error response:", errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      setSuccess("Menu item deleted successfully!")

      await Promise.all([fetchMenuData(), refreshSelectedSectionItems()])

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.log("[v0] Delete menu item error:", err)
      setError(`❌ Failed to delete menu item: ${err.message}. Make sure your server is running on port 5000.`)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError("")

      try {
        await fetchRegistrations()
        await new Promise((resolve) => setTimeout(resolve, 500))

        await fetchOrders()
        await new Promise((resolve) => setTimeout(resolve, 500))

        await fetchMenuData()

        setSuccess("Dashboard loaded successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } catch (error) {
        setError("Failed to load dashboard data. Please refresh and try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const LoadingSpinner = () => (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">Loading dashboard data...</p>
    </div>
  )

  const handleView = (item, type) => {
    setSelectedItem(item)
    setModalType(`view-${type}`)
    setShowModal(true)
  }

  const handleManageItems = (section) => {
    console.log("[v0] Managing items for section:", section)
    console.log("[v0] Section ID:", section._id)

    setSelectedSection(section)
    setModalType("manage-items")
    setShowModal(true)
    setEditingMenuItem(null)
    setNewMenuItem({ name: "", newPrice: "", oldPrice: "" })
  }

  const renderPagination = (data, fetcher) => {
    if (data.totalPages <= 1) return null

    const pages = []
    const currentPage = data.currentPage
    const totalPages = data.totalPages

    if (currentPage > 1) {
      pages.push(
        <button key="prev" onClick={() => fetcher(currentPage - 1)} className="pagination-btn">
          ← Previous
        </button>,
      )
    }

    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetcher(i)}
          disabled={i === currentPage}
          className={`pagination-btn ${i === currentPage ? "active" : ""}`}
        >
          {i}
        </button>,
      )
    }

    if (currentPage < totalPages) {
      pages.push(
        <button key="next" onClick={() => fetcher(currentPage + 1)} className="pagination-btn">
          Next →
        </button>,
      )
    }

    return (
      <div className="pagination-container">
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <div className="pagination-buttons">{pages}</div>
      </div>
    )
  }

  const renderModal = () => {
    if (!showModal) return null

    const type = modalType?.replace("view-", "")
    let modalTitle

    if (modalType === "manage-items") {
      modalTitle = `Manage Items - ${selectedSection?.title || selectedSection?.name || "Unknown Section"}`
    } else {
      modalTitle = `View ${type?.charAt(0).toUpperCase() + type?.slice(0, -1)}`
    }

    return (
      <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && setShowModal(false)}>
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
                {/* Add New Item Form */}
                <div className="add-item-section">
                  <h4>📝 Add New Item</h4>
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
                      <label>New Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newMenuItem.newPrice}
                        onChange={(e) =>
                          setNewMenuItem({
                            ...newMenuItem,
                            newPrice: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Old Price</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newMenuItem.oldPrice}
                        onChange={(e) =>
                          setNewMenuItem({
                            ...newMenuItem,
                            oldPrice: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <button onClick={addMenuItem} className="btn-primary">
                        ➕ Add Item
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Items List */}
                <div className="existing-items-section">
                  <h4>📋 Existing Items ({selectedSection.items?.length || 0})</h4>
                  <div className="items-grid">
                    {selectedSection.items?.map((item, index) => (
                      <div key={index} className="item-card">
                        {editingMenuItem === index ? (
                          <div className="edit-form">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updatedItems = [...selectedSection.items]
                                updatedItems[index].name = e.target.value
                                setSelectedSection({
                                  ...selectedSection,
                                  items: updatedItems,
                                })
                              }}
                              className="form-input"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.newPrice}
                              onChange={(e) => {
                                const updatedItems = [...selectedSection.items]
                                updatedItems[index].newPrice = e.target.value
                                setSelectedSection({
                                  ...selectedSection,
                                  items: updatedItems,
                                })
                              }}
                              className="form-input"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.oldPrice || ""}
                              onChange={(e) => {
                                const updatedItems = [...selectedSection.items]
                                updatedItems[index].oldPrice = e.target.value
                                setSelectedSection({
                                  ...selectedSection,
                                  items: updatedItems,
                                })
                              }}
                              className="form-input"
                            />
                            <div className="edit-actions">
                              <button onClick={() => updateMenuItem(index, item)} className="btn-success">
                                ✅ Save
                              </button>
                              <button onClick={() => setEditingMenuItem(null)} className="btn-secondary">
                                ❌ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="item-display">
                            <h5>{item.name}</h5>
                            <div className="price-info">
                              <span className="new-price">₹{item.newPrice}</span>
                              {item.oldPrice && <span className="old-price">₹{item.oldPrice}</span>}
                            </div>
                            <div className="item-actions">
                              <button onClick={() => setEditingMenuItem(index)} className="btn-edit">
                                ✏️ Edit
                              </button>
                              <button onClick={() => deleteMenuItem(index)} className="btn-delete">
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {modalType === "view-registrations" && selectedItem && (
              <div className="view-details">
                <h4>Registration Details</h4>
                <p>
                  <strong>Name:</strong> {selectedItem.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedItem.email}
                </p>
                <p>
                  <strong>Registration Date:</strong> {new Date(selectedItem.registrationDate).toLocaleString()}
                </p>
              </div>
            )}

            {modalType === "view-orders" && selectedItem && (
              <div className="view-details">
                <h4>Order Details</h4>
                <p>
                  <strong>Order ID:</strong> {selectedItem.orderId}
                </p>
                <p>
                  <strong>Mobile:</strong> {selectedItem.mobileNumber}
                </p>
                <p>
                  <strong>Email:</strong> {selectedItem.email}
                </p>
                <p>
                  <strong>Mode:</strong> {selectedItem.orderMode}
                </p>
                <p>
                  <strong>Status:</strong> {selectedItem.status}
                </p>
                <p>
                  <strong>Total:</strong> ₹{selectedItem.totalAmount}
                </p>
                <p>
                  <strong>Order Date:</strong> {new Date(selectedItem.orderDate).toLocaleString()}
                </p>
                <div className="order-items">
                  <h5>Items:</h5>
                  {selectedItem.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      {item.name} - Qty: {item.quantity} - ₹{item.price}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalType === "view-menu" && selectedItem && (
              <div className="view-details">
                <h4>Menu Section Details</h4>
                <p>
                  <strong>Title:</strong> {selectedItem.title}
                </p>
                <p>
                  <strong>Color:</strong> {selectedItem.color}
                </p>
                <p>
                  <strong>Item Count:</strong> {selectedItem.itemCount}
                </p>
                <p>
                  <strong>Created:</strong> {new Date(selectedItem.createdDate).toLocaleString()}
                </p>
                <div className="menu-items">
                  <h5>Items:</h5>
                  {selectedItem.items?.map((item, index) => (
                    <div key={index} className="menu-item">
                      {item.name} - ₹{item.newPrice}
                      {item.oldPrice && ` (was ₹${item.oldPrice})`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadgeClass = (status, type) => {
    const baseClass = "status-badge"

    if (type === "order") {
      switch (status?.toLowerCase()) {
        case "pending":
          return `${baseClass} status-pending`
        case "completed":
          return `${baseClass} status-completed`
        case "cancelled":
          return `${baseClass} status-cancelled`
        default:
          return `${baseClass} status-pending`
      }
    }
    if (type === "mode") {
      switch (status?.toLowerCase()) {
        case "dinein":
          return `${baseClass} mode-dinein`
        case "pickup":
          return `${baseClass} mode-pickup`
        case "delivery":
          return `${baseClass} mode-delivery`
        default:
          return `${baseClass} mode-dinein`
      }
    }
    return baseClass
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Raja Rani Admin Dashboard</h1>
        <div className="header-actions">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

      <style jsx>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 100%);
                    min-height: 100vh;
                }

                .dashboard-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 100%);
                    padding: 20px;
                }

                .header {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
                    animation: shimmer 3s ease-in-out infinite;
                }

                @keyframes shimmer {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(180deg); }
                }

                .header h1 {
                    color: #8B4513;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                    position: relative;
                    z-index: 1;
                }

                .header p {
                    color: #8B4513;
                    font-size: 1.1rem;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                }

                .header-stats {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                    position: relative;
                    z-index: 1;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.9);
                    padding: 15px 25px;
                    border-radius: 15px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    min-width: 150px;
                    backdrop-filter: blur(10px);
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #FF8C00;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #8B4513;
                    margin-top: 5px;
                }

                .logout-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #FF6B6B, #FF4757);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 700;
                    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
                    transition: all 0.3s ease;
                    z-index: 1000;
                }

                .logout-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
                }

                .alert {
                    padding: 15px 20px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                }

                .alert-error {
                    background: linear-gradient(135deg, #FFE5E5, #FFCCCB);
                    color: #8B0000;
                    border-left: 5px solid #FF6B6B;
                }

                .alert-success {
                    background: linear-gradient(135deg, #E8F5E8, #D4F4DD);
                    color: #006400;
                    border-left: 5px solid #28a745;
                }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 100%);
                }

                .spinner {
                    width: 60px;
                    height: 60px;
                    border: 6px solid #FFE4B5;
                    border-top: 6px solid #FFA500;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .loading-text {
                    font-size: 1.2rem;
                    color: #8B4513;
                    font-weight: 600;
                }

                .tabs-container {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 30px;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 15px;
                    border-radius: 20px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                    flex-wrap: wrap;
                }

                .tab-btn {
                    padding: 15px 25px;
                    border: none;
                    border-radius: 15px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #F5F5DC;
                    color: #8B4513;
                    position: relative;
                    overflow: hidden;
                }

                .tab-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }

                .tab-btn:hover::before {
                    left: 100%;
                }

                .tab-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 165, 0, 0.3);
                }

                .tab-btn.active {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: white;
                    box-shadow: 0 8px 25px rgba(255, 165, 0, 0.4);
                }

                .section-card {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                    margin-bottom: 20px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .section-title {
                    color: #8B4513;
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin: 0;
                }

                .button-group {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .btn-primary, .btn-secondary, .btn-warning, .btn-success, .btn-danger {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #4A90E2, #357ABD);
                    color: white;
                    box-shadow: 0 5px 15px rgba(74, 144, 226, 0.3);
                }

                .btn-secondary {
                    background: linear-gradient(135deg, #95A5A6, #7F8C8D);
                    color: white;
                    box-shadow: 0 5px 15px rgba(149, 165, 166, 0.3);
                }

                .btn-warning {
                    background: linear-gradient(135deg, #F39C12, #E67E22);
                    color: white;
                    box-shadow: 0 5px 15px rgba(243, 156, 18, 0.3);
                }

                .btn-success {
                    background: linear-gradient(135deg, #27AE60, #219A52);
                    color: white;
                    box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
                }

                .btn-danger {
                    background: linear-gradient(135deg, #E74C3C, #C0392B);
                    color: white;
                    box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
                }

                .btn-primary:hover, .btn-secondary:hover, .btn-warning:hover, .btn-success:hover, .btn-danger:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }

                .table-container {
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                    margin-bottom: 20px;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table th {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: #8B4513;
                    padding: 18px 15px;
                    text-align: left;
                    font-weight: 700;
                    font-size: 0.95rem;
                    border-bottom: 2px solid #FF8C00;
                }

                .data-table td {
                    padding: 15px;
                    border-bottom: 1px solid #F0F0F0;
                    color: #444;
                    font-size: 0.9rem;
                    vertical-align: middle;
                }

                .data-table tr:hover {
                    background: linear-gradient(135deg, #FFFAF0, #FFF8DC);
                }

                .data-table tr:last-child td {
                    border-bottom: none;
                }

                .empty-state {
                    text-align: center;
                    padding: 50px;
                    color: #888;
                    font-style: italic;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .view-btn {
                    background: linear-gradient(135deg, #17A2B8, #138496);
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(23, 162, 184, 0.3);
                }

                .view-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(23, 162, 184, 0.4);
                }

                .manage-btn {
                    background: linear-gradient(135deg, #28A745, #218838);
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);
                }

                .manage-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
                }

                .status-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    display: inline-block;
                    min-width: 80px;
                    text-align: center;
                }

                .status-pending { background: linear-gradient(135deg, #F39C12, #E67E22); }
                .status-completed { background: linear-gradient(135deg, #27AE60, #219A52); }
                .status-cancelled { background: linear-gradient(135deg, #E74C3C, #C0392B); }
                .mode-dinein { background: linear-gradient(135deg, #3498DB, #2980B9); }
                .mode-pickup { background: linear-gradient(135deg, #9B59B6, #8E44AD); }
                .mode-delivery { background: linear-gradient(135deg, #E67E22, #D35400); }

                .pagination-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 25px;
                    padding: 20px;
                    background: linear-gradient(135deg, #FFF8DC, #FFFACD);
                    border-radius: 15px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .pagination-info {
                    font-size: 1rem;
                    color: #8B4513;
                    font-weight: 600;
                }

                .pagination-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .pagination-btn {
                    padding: 10px 15px;
                    border: 2px solid #FFD700;
                    background: white;
                    color: #8B4513;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    min-width: 45px;
                    text-align: center;
                }

                .pagination-btn:hover {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: white;
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
                }

                .pagination-btn.active {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: white;
                    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
                }

                .pagination-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    padding: 20px;
                    backdrop-filter: blur(5px);
                }

                .modal-content {
                    background: white;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.3s ease-out;
                }

                @keyframes modalSlideIn {
                    from {
                        transform: scale(0.9) translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }

                .modal-header {
                    padding: 25px 30px;
                    border-bottom: 2px solid #F0F0F0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: #8B4513;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #8B4513;
                    padding: 5px;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .close-btn:hover {
                    background: rgba(139, 69, 19, 0.1);
                    transform: scale(1.1);
                }

                .modal-body {
                    padding: 30px;
                    max-height: 60vh;
                    overflow-y: auto;
                    color: #444;
                }

                .modal-footer {
                    padding: 20px 30px;
                    border-top: 2px solid #F0F0F0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    background: #FAFAFA;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    font-weight: 700;
                    color: #8B4513;
                    margin-bottom: 8px;
                    font-size: 0.95rem;
                }

                .form-input {
                    width: 100%;
                    padding: 12px 15px;
                    border: 2px solid #E0E0E0;
                    border-radius: 10px;
                    font-size: 1rem;
                    color: #444;
                    background: white;
                    transition: all 0.3s ease;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #FFD700;
                    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
                }

                .form-input.readonly {
                    background: #F8F9FA;
                    color: #6C757D;
                    cursor: not-allowed;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    align-items: end;
                }

                .items-management {
                    max-height: 70vh;
                    overflow-y: auto;
                }

                .add-item-section {
                    background: linear-gradient(135deg, #F8F9FA, #E9ECEF);
                    padding: 25px;
                    border-radius: 15px;
                    margin-bottom: 30px;
                    border: 2px solid #FFD700;
                }

                .add-item-section h4 {
                    color: #8B4513;
                    margin-bottom: 20px;
                    font-size: 1.3rem;
                    font-weight: 700;
                }

                .existing-items-section h4 {
                    color: #8B4513;
                    margin-bottom: 20px;
                    font-size: 1.3rem;
                    font-weight: 700;
                    border-bottom: 2px solid #FFD700;
                    padding-bottom: 10px;
                }

                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }

                .item-card {
                    background: white;
                    border: 2px solid #E0E0E0;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }

                .item-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    border-color: #FFD700;
                }

                .item-display h5 {
                    color: #8B4513;
                    margin-bottom: 15px;
                    font-size: 1.2rem;
                    font-weight: 700;
                }

                .price-info {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .new-price {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: #28A745;
                }

                .old-price {
                    font-size: 1rem;
                    color: #6C757D;
                    text-decoration: line-through;
                }

                .item-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }

                .edit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .edit-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }

                .items-list {
                    background: #F8F9FA;
                    border: 2px solid #E0E0E0;
                    border-radius: 10px;
                    padding: 15px;
                    max-height: 250px;
                    overflow-y: auto;
                }

                .order-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid #E0E0E0;
                }

                .order-item:last-child {
                    border-bottom: none;
                }

                .item-info {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .item-info strong {
                    color: #8B4513;
                    font-size: 1rem;
                    font-weight: 700;
                }

                .item-info span {
                    color: #6C757D;
                    font-size: 0.9rem;
                }

                .item-price {
                    font-weight: 700;
                    color: #28A745;
                    font-size: 1.1rem;
                }

                .view-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .color-display {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .color-circle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 3px solid #E0E0E0;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .api-status-container {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    margin-top: 15px;
                    flex-wrap: wrap;
                }

                .api-test-btn {
                    background: linear-gradient(135deg, #17A2B8, #138496);
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    transition: all 0.3s ease;
                }

                .api-test-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(23, 162, 184, 0.3);
                }

                .api-status {
                    font-size: 0.85rem;
                    color: #6C757D;
                    font-weight: 600;
                }

                .read-only-badge {
                    background: linear-gradient(135deg, #E9ECEF, #DEE2E6);
                    color: #6C757D;
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                /* Responsive Design */
                @media (max-width: 1200px) {
                    .header-stats {
                        justify-content: center;
                    }
                    
                    .items-grid {
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    }
                }

                @media (max-width: 768px) {
                    .dashboard-container {
                        padding: 15px;
                    }

                    .header {
                        padding: 20px;
                        margin-bottom: 20px;
                    }

                    .header h1 {
                        font-size: 2rem;
                    }

                    .header-stats {
                        flex-direction: column;
                        gap: 15px;
                    }

                    .logout-btn {
                        position: static;
                        margin-top: 20px;
                        width: 100%;
                    }

                    .tabs-container {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .tab-btn {
                        width: 100%;
                        text-align: center;
                    }

                    .section-header {
                        flex-direction: column;
                        align-items: stretch;
                        text-align: center;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .items-grid {
                        grid-template-columns: 1fr;
                    }

                    .pagination-container {
                        flex-direction: column;
                        text-align: center;
                    }

                    .data-table {
                        font-size: 0.8rem;
                    }

                    .data-table th,
                    .data-table td {
                        padding: 10px 8px;
                    }

                    .modal-content {
                        margin: 10px;
                        max-height: 95vh;
                    }

                    .modal-header,
                    .modal-body,
                    .modal-footer {
                        padding: 20px;
                    }
                }

                @media (max-width: 480px) {
                    .header h1 {
                        font-size: 1.8rem;
                    }

                    .section-title {
                        font-size: 1.5rem;
                    }

                    .data-table th,
                    .data-table td {
                        padding: 8px 5px;
                        font-size: 0.75rem;
                    }

                    .btn-primary, .btn-secondary, .btn-warning, .btn-success, .btn-danger,
                    .view-btn, .manage-btn {
                        padding: 8px 12px;
                        font-size: 0.8rem;
                    }

                    .pagination-btn {
                        padding: 8px 12px;
                        font-size: 0.85rem;
                    }
                }

                /* Scrollbar Styling */
                ::-webkit-scrollbar {
                    width: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: #F8F9FA;
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, #FFA500, #FF8C00);
                }

                /* Animation for cards */
                .item-card, .stat-card, .section-card {
                    animation: fadeInUp 0.5s ease-out;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dashboard-header {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .dashboard-header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
                    animation: shimmer 3s ease-in-out infinite;
                }

                .dashboard-header h1 {
                    color: #8B4513;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                    position: relative;
                    z-index: 1;
                }

                .header-actions {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }

                .logout-btn {
                    background: linear-gradient(135deg, #FF6B6B, #FF4757);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 700;
                    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
                    transition: all 0.3s ease;
                }

                .logout-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
                }

                .view-details {
                    padding: 20px;
                    border: 1px solid #ddd;
                    margin-bottom: 10px;
                }

                .view-details h4 {
                    font-size: 1.2em;
                    margin-bottom: 10px;
                }

                .view-details p {
                    margin-bottom: 5px;
                }

                .order-items {
                    margin-top: 10px;
                    padding: 10px;
                    border: 1px solid #eee;
                }

                .order-item {
                    padding: 5px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .menu-items {
                    margin-top: 10px;
                    padding: 10px;
                    border: 1px solid #eee;
                }

                .menu-item {
                    padding: 5px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .btn-edit {
                    background-color: #ffc107;
                    color: #212529;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .btn-delete {
                    background-color: #dc3545;
                    color: #fff;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `}</style>

      {error && <div className="alert alert-error">❌ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "registrations" ? "active" : ""}`}
          onClick={() => setActiveTab("registrations")}
        >
          👥 User Registrations ({registrations.items.length})
        </button>
        <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
          🛒 Orders ({orders.items.length})
        </button>
        <button className={`tab-btn ${activeTab === "menu" ? "active" : ""}`} onClick={() => setActiveTab("menu")}>
          🍽️ Menu Management ({menuData.items.length})
        </button>
      </div>

      {/* Registrations Tab */}
      {activeTab === "registrations" && (
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">👥 User Registrations</h2>
            <div className="read-only-badge">📖 View Only</div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile Number</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.items.length > 0 ? (
                  registrations.items.map((reg) => (
                    <tr key={reg._id}>
                      <td>
                        <strong>{reg.name || "N/A"}</strong>
                      </td>
                      <td>{reg.email || "N/A"}</td>
                      <td>{reg.mobileNumber || "N/A"}</td>
                      <td>{reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : "N/A"}</td>
                      <td>
                        <button className="view-btn" onClick={() => handleView(reg, "registrations")}>
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      📝 No registrations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(registrations, fetchRegistrations)}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">🛒 Order Management</h2>
            <div className="read-only-badge">📖 View Only</div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Email</th>
                  <th>Total Amount</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.items.length > 0 ? (
                  orders.items.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <code
                          style={{
                            background: "#F8F9FA",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            color: "#E83E8C",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          {order.orderId || "N/A"}
                        </code>
                      </td>
                      <td>
                        <strong>{order.email || "N/A"}</strong>
                      </td>
                      <td>
                        <strong style={{ color: "#28a745", fontSize: "1.1rem" }}>
                          ${(order.totalAmount || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(order.orderMode || "dinein", "mode")}>
                          {(order.orderMode || "dinein").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(order.status || "pending", "order")}>
                          {(order.status || "pending").toUpperCase()}
                        </span>
                      </td>
                      <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "N/A"}</td>
                      <td>
                        <button className="view-btn" onClick={() => handleView(order, "orders")}>
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      🛒 No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(orders, fetchOrders)}
        </div>
      )}

      {/* Menu Management Tab */}
      {activeTab === "menu" && (
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">🍽️ Menu Management</h2>
            <div className="button-group">
              <div
                style={{
                  background: "linear-gradient(135deg, #28A745, #218838)",
                  color: "white",
                  padding: "8px 15px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                ✏️ Full CRUD Access
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Section Title</th>
                  <th>Color</th>
                  <th>Number of Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuData.items.length > 0 ? (
                  menuData.items.map((section, index) => (
                    <tr key={section._id || section.id || index}>
                      <td>
                        <strong style={{ fontSize: "1.1rem", color: "#8B4513" }}>
                          {section.title || section.name || section.sectionTitle || `Section ${index + 1}`}
                        </strong>
                      </td>
                      <td>
                        <div className="color-display">
                          <div
                            className="color-circle"
                            style={{
                              backgroundColor: section.color || "#FFA500",
                              width: "30px",
                              height: "30px",
                            }}
                          ></div>
                          <span
                            style={{
                              fontWeight: "600",
                              color: "#444",
                              fontSize: "0.9rem",
                            }}
                          >
                            {section.color || "#FFA500"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: "#007bff",
                            fontSize: "1.2rem",
                            background: "linear-gradient(135deg, #E3F2FD, #BBDEFB)",
                            padding: "5px 12px",
                            borderRadius: "15px",
                            display: "inline-block",
                            minWidth: "50px",
                            textAlign: "center",
                          }}
                        >
                          {section.itemCount || section.items?.length || 0}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <button className="view-btn" onClick={() => handleView(section, "menu")}>
                            👁️ View
                          </button>
                          <button className="manage-btn" onClick={() => handleManageItems(section)}>
                            ⚙️ Manage Items
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      🍽️ No menu sections found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(menuData, fetchMenuData)}
        </div>
      )}

      {renderModal()}
    </div>
  )
}

export default AdminDashboard
