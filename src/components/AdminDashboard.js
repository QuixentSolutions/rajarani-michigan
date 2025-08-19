import React, { useState, useEffect, useCallback } from 'react';

const AdminDashboard = ({ onLogout }) => {
    // Get auth token from state instead of sessionStorage
    const [authToken] = useState('Basic ' + btoa('admin:password123'));
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('registrations');
    const [isLoading, setIsLoading] = useState(true);
    
    const [registrations, setRegistrations] = useState({ items: [], totalPages: 1, currentPage: 1 });
    const [orders, setOrders] = useState({ items: [], totalPages: 1, currentPage: 1 });
    const [menuData, setMenuData] = useState({ items: [], totalPages: 1, currentPage: 1 });
    
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    
    // Order filtering state
    const [orderFilters, setOrderFilters] = useState({
        status: '',
        orderMode: '',
        startDate: '',
        endDate: '',
        search: '',
        minAmount: '',
        maxAmount: ''
    });
    
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    
    const [apiStatus, setApiStatus] = useState({
        health: 'unknown',
        registrations: 'unknown', 
        orders: 'unknown',
        menu: 'unknown'
    });

    // Logout function with fallback
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            if (typeof onLogout === 'function') {
                onLogout();
            } else {
                // Fallback: redirect to login page
                window.location.href = '/admin';
            }
        }
    };

    // Test API endpoints
    const testAPIEndpoints = async () => {
        const endpoints = [
            { name: 'health', url: 'http://localhost:5000/health' },
            { name: 'registrations', url: 'http://localhost:5000/api/admin/registrations' },
            { name: 'orders', url: 'http://localhost:5000/api/admin/orders' },
            { name: 'menu', url: 'http://localhost:5000/api/admin/menu' }
        ];

        const status = {};
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint.url, {
                    headers: endpoint.name !== 'health' ? { 'Authorization': authToken } : {}
                });
                
                if (response.ok) {
                    status[endpoint.name] = '✅ Working';
                } else {
                    status[endpoint.name] = `❌ Error ${response.status}`;
                }
            } catch (error) {
                status[endpoint.name] = `❌ Failed: ${error.message}`;
            }
        }
        
        setApiStatus(status);
    };

    // Styles with explicit text colors
    const containerStyle = {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        color: '#212529'
    };

    const headerStyle = {
        textAlign: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        color: '#212529'
    };

    const logoutButtonStyle = {
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '10px 20px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        zIndex: 1000
    };

    const alertStyle = {
        padding: '12px 20px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontWeight: 'bold'
    };

    const errorStyle = {
        ...alertStyle,
        backgroundColor: '#fee',
        color: '#c33',
        border: '1px solid #fcc'
    };

    const successStyle = {
        ...alertStyle,
        backgroundColor: '#efe',
        color: '#363',
        border: '1px solid #cfc'
    };

    const loadingContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
    };

    const spinnerStyle = {
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #FFA500',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
    };

    const loadingTextStyle = {
        fontSize: '18px',
        color: '#212529',
        textAlign: 'center',
        fontWeight: 'bold'
    };

    const tabContainerStyle = {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    };

    const tabButtonStyle = {
        padding: '12px 20px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#f8f9fa',
        color: '#212529',
        transition: 'all 0.3s ease',
        fontWeight: 'bold',
        fontSize: '14px'
    };

    const activeTabStyle = {
        backgroundColor: '#FFA500',
        color: 'white',
        fontWeight: 'bold'
    };

    const sectionStyle = {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        color: '#212529'
    };

    const sectionHeaderStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '10px'
    };

    const buttonGroupStyle = {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
    };

    const tableContainerStyle = {
        overflowX: 'auto',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white'
    };

    const headerRowStyle = {
        backgroundColor: '#f8f9fa'
    };

    const thStyle = {
        padding: '12px',
        textAlign: 'left',
        fontWeight: 'bold',
        borderBottom: '2px solid #dee2e6',
        color: '#212529',
        backgroundColor: '#f8f9fa',
        fontSize: '14px'
    };

    const rowStyle = {
        '&:hover': {
            backgroundColor: '#f8f9fa'
        }
    };

    const tdStyle = {
        padding: '12px',
        borderBottom: '1px solid #dee2e6',
        verticalAlign: 'middle',
        color: '#212529',
        fontSize: '14px'
    };

    const emptyStateStyle = {
        ...tdStyle,
        textAlign: 'center',
        padding: '40px',
        color: '#6c757d',
        fontStyle: 'italic',
        fontSize: '16px',
        fontWeight: 'bold'
    };

    const baseButtonStyle = {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        transition: 'all 0.3s ease'
    };

    const viewButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: '#17a2b8',
        color: 'white'
    };

    const primaryButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: '#007bff',
        color: 'white',
        padding: '10px 20px',
        fontSize: '14px'
    };

    const secondaryButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: '#6c757d',
        color: 'white',
        padding: '10px 20px',
        fontSize: '14px'
    };

    const warningButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: '#ffc107',
        color: 'white',
        padding: '10px 20px',
        fontSize: '14px'
    };

    const disabledButtonStyle = {
        backgroundColor: '#6c757d',
        cursor: 'not-allowed',
        opacity: 0.6
    };

    const filterPanelStyle = {
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        display: showFilterPanel ? 'block' : 'none'
    };

    const filterRowStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '15px'
    };

    const filterInputStyle = {
        padding: '8px 12px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        fontSize: '14px',
        backgroundColor: 'white',
        color: '#212529'
    };

    const filterLabelStyle = {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
        color: '#212529',
        fontSize: '14px'
    };

    const paginationContainerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
    };

    const paginationInfoStyle = {
        fontSize: '14px',
        color: '#212529',
        fontWeight: 'bold'
    };

    const paginationButtonStyle = {
        padding: '8px 12px',
        margin: '0 2px',
        border: '1px solid #dee2e6',
        backgroundColor: 'white',
        color: '#212529',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontWeight: 'bold'
    };

    const activePaginationStyle = {
        backgroundColor: '#007bff',
        color: 'white',
        borderColor: '#007bff'
    };

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    };

    const modalContentStyle = {
        backgroundColor: 'white',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    };

    const modalHeaderStyle = {
        padding: '20px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    };

    const closeButtonStyle = {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#6c757d',
        padding: '0',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const modalBodyStyle = {
        padding: '20px',
        maxHeight: '60vh',
        overflowY: 'auto',
        color: '#212529'
    };

    const modalFooterStyle = {
        padding: '20px',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        backgroundColor: '#f8f9fa'
    };

    const formGroupStyle = {
        marginBottom: '15px'
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        fontSize: '14px',
        marginTop: '5px',
        color: '#212529',
        backgroundColor: '#f8f9fa'
    };

    const labelStyle = {
        fontWeight: 'bold',
        color: '#212529',
        fontSize: '14px',
        marginBottom: '5px',
        display: 'block'
    };

    const itemsListStyle = {
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        maxHeight: '200px',
        overflowY: 'auto'
    };

    const itemRowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #dee2e6',
        color: '#212529'
    };

    // Enhanced fetch function with retry logic and better error handling
    const fetchData = useCallback(async (url, token, retryCount = 0) => {
        try {
            console.log(`Fetching: ${url}`);
            const response = await fetch(url, { 
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json'
                } 
            });
            
            if (response.status === 429) {
                if (retryCount < 2) {
                    console.log(`Rate limited, retrying in ${(retryCount + 1) * 2} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
                    return fetchData(url, token, retryCount + 1);
                } else {
                    throw new Error('Server is busy. Please wait a moment and refresh the page.');
                }
            }
            
            if (response.status === 401) {
                // Unauthorized - redirect to login
                if (typeof onLogout === 'function') {
                    onLogout();
                } else {
                    window.location.href = '/admin';
                }
                return;
            }
            
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Server error (${response.status})`);
                } else {
                    throw new Error(`Server returned ${response.status}. Please check if the backend is running on http://localhost:5000`);
                }
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned HTML instead of JSON. Please check if your backend API is running correctly.');
            }
            
            return response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to server. Please check if your backend is running on http://localhost:5000');
            }
            throw error;
        }
    }, [onLogout]);

    const createFetchFunction = useCallback((setter, type) => async (page = 1) => {
        try {
            setError('');
            console.log(`Fetching ${type} from: http://localhost:5000/api/admin/${type}?page=${page}`);
            const data = await fetchData(`http://localhost:5000/api/admin/${type}?page=${page}`, authToken);
            console.log(`${type} data received:`, data);
            
            if (data && typeof data === 'object') {
                if (Array.isArray(data)) {
                    setter({ items: data, totalPages: 1, currentPage: 1 });
                } else if (data.items || data.data) {
                    setter({
                        items: data.items || data.data || [],
                        totalPages: data.totalPages || 1,
                        currentPage: data.currentPage || page
                    });
                } else {
                    console.warn(`Unexpected data format for ${type}:`, data);
                    setter({ items: [], totalPages: 1, currentPage: 1 });
                }
            } else {
                console.warn(`No data received for ${type}`);
                setter({ items: [], totalPages: 1, currentPage: 1 });
            }
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            setError(`Failed to load ${type}: ${err.message}`);
            setter({ items: [], totalPages: 1, currentPage: 1 });
        }
    }, [authToken, fetchData]);

    // Enhanced fetchOrders with filtering support
    const fetchOrders = useCallback(async (page = 1, filters = orderFilters) => {
        try {
            setError('');
            setIsApplyingFilters(true);
            
            // Build query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('page', page.toString());
            
            // Add filters to query params
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.orderMode) queryParams.append('orderMode', filters.orderMode);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
            if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
            
            const url = `http://localhost:5000/api/admin/orders?${queryParams.toString()}`;
            console.log(`Fetching filtered orders from: ${url}`);
            
            const data = await fetchData(url, authToken);
            console.log(`Filtered orders data received:`, data);
            
            if (data && typeof data === 'object') {
                if (Array.isArray(data)) {
                    setOrders({ items: data, totalPages: 1, currentPage: 1 });
                } else if (data.items || data.data) {
                    setOrders({
                        items: data.items || data.data || [],
                        totalPages: data.totalPages || 1,
                        currentPage: data.currentPage || page,
                        totalCount: data.totalCount || data.items?.length || 0,
                        filteredCount: data.filteredCount || data.items?.length || 0
                    });
                } else {
                    console.warn(`Unexpected data format for orders:`, data);
                    setOrders({ items: [], totalPages: 1, currentPage: 1 });
                }
            } else {
                console.warn(`No data received for orders`);
                setOrders({ items: [], totalPages: 1, currentPage: 1 });
            }
        } catch (err) {
            console.error(`Error fetching filtered orders:`, err);
            setError(`Failed to load orders: ${err.message}`);
            setOrders({ items: [], totalPages: 1, currentPage: 1 });
        } finally {
            setIsApplyingFilters(false);
        }
    }, [authToken, fetchData, orderFilters]);

    const fetchRegistrations = createFetchFunction(setRegistrations, 'registrations');
    const fetchMenuData = createFetchFunction(setMenuData, 'menu');

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        setOrderFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Apply filters
    const applyFilters = () => {
        fetchOrders(1, orderFilters);
    };

    // Clear all filters
    const clearFilters = () => {
        const emptyFilters = {
            status: '',
            orderMode: '',
            startDate: '',
            endDate: '',
            search: '',
            minAmount: '',
            maxAmount: ''
        };
        setOrderFilters(emptyFilters);
        fetchOrders(1, emptyFilters);
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return Object.values(orderFilters).some(value => value !== '');
    };

    // Sequential loading to avoid overwhelming the server
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError('');
            
            try {
                console.log('Loading registrations...');
                await fetchRegistrations();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                console.log('Loading orders...');
                await fetchOrders();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                console.log('Loading menu data...');
                await fetchMenuData();
                
                setSuccess('Dashboard loaded successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error('Error loading dashboard:', error);
                setError('Failed to load dashboard data. Please refresh and try again.');
            } finally {
                setIsLoading(false);
            }
        };
        
        loadData();
    }, []);

    // Loading spinner component
    const LoadingSpinner = () => (
        <div style={loadingContainerStyle}>
            <div style={spinnerStyle}></div>
            <p style={loadingTextStyle}>Loading dashboard data...</p>
        </div>
    );

    // View modal handler - ONLY VIEW FUNCTIONALITY
    const handleView = (item, type) => {
        setSelectedItem(item);
        setModalType(`view-${type}`);
        setShowModal(true);
    };

    // Improved pagination with better styling
    const renderPagination = (data, fetcher, section) => {
        if (data.totalPages <= 1) return null;

        let pages = [];
        const currentPage = data.currentPage;
        const totalPages = data.totalPages;

        if (currentPage > 1) {
            pages.push(
                <button 
                    key="prev"
                    onClick={() => section === 'orders' ? fetchOrders(currentPage - 1) : fetcher(currentPage - 1)}
                    style={paginationButtonStyle}
                >
                    ← Previous
                </button>
            );
        }

        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            pages.push(
                <button 
                    key={i}
                    onClick={() => section === 'orders' ? fetchOrders(i) : fetcher(i)} 
                    disabled={i === currentPage}
                    style={{
                        ...paginationButtonStyle,
                        ...(i === currentPage ? activePaginationStyle : {})
                    }}
                >
                    {i}
                </button>
            );
        }

        if (currentPage < totalPages) {
            pages.push(
                <button 
                    key="next"
                    onClick={() => section === 'orders' ? fetchOrders(currentPage + 1) : fetcher(currentPage + 1)}
                    style={paginationButtonStyle}
                >
                    Next →
                </button>
            );
        }

        return (
            <div style={paginationContainerStyle}>
                <span style={paginationInfoStyle}>
                    Page {currentPage} of {totalPages}
                    {section === 'orders' && data.filteredCount !== undefined && (
                        <span style={{marginLeft: '10px', color: '#6c757d'}}>
                            ({data.filteredCount} filtered results)
                        </span>
                    )}
                </span>
                <div>{pages}</div>
            </div>
        );
    };

    // Filter panel component
    const renderFilterPanel = () => (
        <div style={filterPanelStyle}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h4 style={{color: '#212529', margin: 0}}>🔍 Filter Orders</h4>
                <div style={buttonGroupStyle}>
                    <button
                        onClick={applyFilters}
                        style={{...primaryButtonStyle, ...(isApplyingFilters ? disabledButtonStyle : {})}}
                        disabled={isApplyingFilters}
                    >
                        {isApplyingFilters ? '⏳ Applying...' : '🔍 Apply Filters'}
                    </button>
                    <button
                        onClick={clearFilters}
                        style={secondaryButtonStyle}
                        disabled={isApplyingFilters}
                    >
                        🗑️ Clear All
                    </button>
                </div>
            </div>
            
            <div style={filterRowStyle}>
                <div>
                    <label style={filterLabelStyle}>Status</label>
                    <select
                        style={filterInputStyle}
                        value={orderFilters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                
                <div>
                    <label style={filterLabelStyle}>Order Mode</label>
                    <select
                        style={filterInputStyle}
                        value={orderFilters.orderMode}
                        onChange={(e) => handleFilterChange('orderMode', e.target.value)}
                    >
                        <option value="">All Modes</option>
                        <option value="dinein">Dine In</option>
                        <option value="pickup">Pickup</option>
                        <option value="delivery">Delivery</option>
                    </select>
                </div>
                
                <div>
                    <label style={filterLabelStyle}>Search (Email/Order ID)</label>
                    <input
                        type="text"
                        style={filterInputStyle}
                        placeholder="Enter email or order ID..."
                        value={orderFilters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
            </div>
            
            <div style={filterRowStyle}>
                <div>
                    <label style={filterLabelStyle}>Start Date</label>
                    <input
                        type="date"
                        style={filterInputStyle}
                        value={orderFilters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                </div>
                
                <div>
                    <label style={filterLabelStyle}>End Date</label>
                    <input
                        type="date"
                        style={filterInputStyle}
                        value={orderFilters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                </div>
                
                <div>
                    <label style={filterLabelStyle}>Min Amount ($)</label>
                    <input
                        type="number"
                        style={filterInputStyle}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={orderFilters.minAmount}
                        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    />
                </div>
                
                <div>
                    <label style={filterLabelStyle}>Max Amount ($)</label>
                    <input
                        type="number"
                        style={filterInputStyle}
                        placeholder="999.99"
                        step="0.01"
                        min="0"
                        value={orderFilters.maxAmount}
                        onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );

    // Modal rendering with VIEW ONLY functionality
    const renderModal = () => {
        if (!showModal || !selectedItem) return null;

        const type = modalType.split('-')[1];
        const modalTitle = `View ${type.charAt(0).toUpperCase() + type.slice(0, -1)}`;

        return (
            <div style={modalOverlayStyle}>
                <div style={modalContentStyle}>
                    <div style={modalHeaderStyle}>
                        <h3 style={{color: '#212529', margin: 0}}>{modalTitle}</h3>
                        <button 
                            onClick={() => setShowModal(false)}
                            style={closeButtonStyle}
                        >
                            ×
                        </button>
                    </div>
                    
                    <div style={modalBodyStyle}>
                        {type === 'registration' && (
                            <div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Name:</label>
                                    <input 
                                        style={inputStyle}
                                        value={selectedItem.name || ''}
                                        readOnly
                                    />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Email:</label>
                                    <input 
                                        style={inputStyle}
                                        value={selectedItem.email || ''}
                                        readOnly
                                    />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Mobile Number:</label>
                                    <input 
                                        style={inputStyle}
                                        value={selectedItem.mobileNumber || ''}
                                        readOnly
                                    />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Registration Date:</label>
                                    <input 
                                        style={inputStyle}
                                        value={new Date(selectedItem.registrationDate).toLocaleString()}
                                        readOnly
                                    />
                                </div>
                            </div>
                        )}

                        {type === 'order' && (
                            <div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Order ID:</label>
                                    <input style={inputStyle} value={selectedItem.orderId || ''} readOnly />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Email:</label>
                                    <input style={inputStyle} value={selectedItem.email || ''} readOnly />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Mobile Number:</label>
                                    <input style={inputStyle} value={selectedItem.mobileNumber || ''} readOnly />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Order Mode:</label>
                                    <input style={inputStyle} value={selectedItem.orderMode || ''} readOnly />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Total Amount:</label>
                                    <input style={inputStyle} value={`${selectedItem.totalAmount?.toFixed(2) || '0.00'}`} readOnly />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Status:</label>
                                    <input style={inputStyle} value={selectedItem.status || 'pending'} readOnly />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Order Date:</label>
                                    <input style={inputStyle} value={new Date(selectedItem.orderDate).toLocaleString()} readOnly />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Items:</label>
                                    <div style={itemsListStyle}>
                                        {selectedItem.items && selectedItem.items.length > 0 ? (
                                            selectedItem.items.map((item, index) => (
                                                <div key={index} style={itemRowStyle}>
                                                    <div>
                                                        <strong style={{color: '#212529'}}>{item.name}</strong><br/>
                                                        <span style={{color: '#6c757d'}}>Quantity: {item.quantity}</span>
                                                    </div>
                                                    <div style={{color: '#212529', fontWeight: 'bold'}}>
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{color: '#6c757d', textAlign: 'center', padding: '10px'}}>
                                                No items found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {type === 'menu' && (
                            <div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Section Title:</label>
                                    <input 
                                        style={inputStyle}
                                        value={selectedItem.title || selectedItem.name || ''}
                                        readOnly
                                    />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Color:</label>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <div style={{
                                            width: '30px',
                                            height: '30px',
                                            backgroundColor: selectedItem.color || '#FFA500',
                                            borderRadius: '50%',
                                            border: '2px solid #dee2e6'
                                        }}></div>
                                        <input 
                                            style={inputStyle}
                                            value={selectedItem.color || '#FFA500'}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Menu Items ({selectedItem.items?.length || 0}):</label>
                                    <div style={itemsListStyle}>
                                        {selectedItem.items && selectedItem.items.length > 0 ? (
                                            selectedItem.items.map((item, index) => (
                                                <div key={index} style={itemRowStyle}>
                                                    <div>
                                                        <strong style={{color: '#212529'}}>{item.name}</strong><br/>
                                                        <span style={{color: '#6c757d'}}>
                                                            New Price: ${item.newPrice}
                                                            {item.oldPrice && <span> (Old: ${item.oldPrice})</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{color: '#6c757d', textAlign: 'center', padding: '10px'}}>
                                                No items found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={modalFooterStyle}>
                        <button style={secondaryButtonStyle} onClick={() => setShowModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Tab navigation for separate sections
    const renderTabNavigation = () => (
        <div style={tabContainerStyle}>
            <button 
                style={{...tabButtonStyle, ...(activeTab === 'registrations' ? activeTabStyle : {})}}
                onClick={() => setActiveTab('registrations')}
            >
                👥 User Registrations ({registrations.items.length})
            </button>
            <button 
                style={{...tabButtonStyle, ...(activeTab === 'orders' ? activeTabStyle : {})}}
                onClick={() => setActiveTab('orders')}
            >
                🛒 Orders ({orders.items.length})
            </button>
            <button 
                style={{...tabButtonStyle, ...(activeTab === 'menu' ? activeTabStyle : {})}}
                onClick={() => setActiveTab('menu')}
            >
                🍽️ Menu ({menuData.items.length})
            </button>
        </div>
    );

    const renderRegistrationsTab = () => (
        <div style={sectionStyle}>
            <h2 style={{color: '#212529', marginBottom: '20px'}}>👥 User Registrations (View Only)</h2>
            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={headerRowStyle}>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Mobile Number</th>
                            <th style={thStyle}>Registration Date</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.items.length > 0 ? (
                            registrations.items.map(reg => (
                                <tr key={reg._id} style={rowStyle}>
                                    <td style={tdStyle}><strong>{reg.name || 'N/A'}</strong></td>
                                    <td style={tdStyle}>{reg.email || 'N/A'}</td>
                                    <td style={tdStyle}>{reg.mobileNumber || 'N/A'}</td>
                                    <td style={tdStyle}>
                                        {reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td style={tdStyle}>
                                        <button 
                                            style={viewButtonStyle}
                                            onClick={() => handleView(reg, 'registration')}
                                        >
                                            👁️ View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={emptyStateStyle}>
                                    <div>📝 No registrations found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination(registrations, fetchRegistrations, 'registrations')}
        </div>
    );

    const renderOrdersTab = () => (
        <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
                <h2 style={{color: '#212529', margin: 0}}>🛒 Order Management (View Only)</h2>
                <div style={buttonGroupStyle}>
                    <button 
                        style={{
                            ...warningButtonStyle,
                            ...(showFilterPanel ? activeTabStyle : {})
                        }}
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                    >
                        🔍 {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
                        {hasActiveFilters() && (
                            <span style={{
                                marginLeft: '5px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '10px'
                            }}>
                                ACTIVE
                            </span>
                        )}
                    </button>
                </div>
            </div>
            
            {renderFilterPanel()}
            
            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={headerRowStyle}>
                            <th style={thStyle}>Order ID</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Total Amount</th>
                            <th style={thStyle}>Mode</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Order Date</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.items.length > 0 ? (
                            orders.items.map(order => (
                                <tr key={order._id} style={rowStyle}>
                                    <td style={tdStyle}>
                                        <code style={{color: '#e83e8c', backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '3px'}}>
                                            {order.orderId || 'N/A'}
                                        </code>
                                    </td>
                                    <td style={tdStyle}><strong>{order.email || 'N/A'}</strong></td>
                                    <td style={tdStyle}>
                                        <strong style={{color: '#28a745'}}>${(order.totalAmount || 0).toFixed(2)}</strong>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={getStatusBadgeStyle(order.orderMode || 'dinein', 'mode')}>
                                            {(order.orderMode || 'dinein').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={getStatusBadgeStyle(order.status || 'pending', 'order')}>
                                            {(order.status || 'pending').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td style={tdStyle}>
                                        <button 
                                            style={viewButtonStyle}
                                            onClick={() => handleView(order, 'order')}
                                        >
                                            👁️ View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={emptyStateStyle}>
                                    <div>
                                        {isApplyingFilters ? (
                                            <>⏳ Applying filters...</>
                                        ) : (
                                            <>🛒 {hasActiveFilters() ? 'No orders match your filters' : 'No orders found'}</>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination(orders, fetchOrders, 'orders')}
        </div>
    );

    const renderMenuTab = () => (
        <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
                <h2 style={{color: '#212529', margin: 0}}>🍽️ Menu Management (View Only)</h2>
            </div>
            
            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={headerRowStyle}>
                            <th style={thStyle}>Section Title</th>
                            <th style={thStyle}>Color</th>
                            <th style={thStyle}>Number of Items</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menuData.items.length > 0 ? (
                            menuData.items.map((section, index) => (
                                <tr key={section._id || section.id || index} style={rowStyle}>
                                    <td style={{...tdStyle, fontWeight: 'bold'}}>
                                        {section.title || section.name || section.sectionTitle || `Section ${index + 1}`}
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: section.color || '#FFA500',
                                                borderRadius: '50%',
                                                border: '2px solid #dee2e6'
                                            }}></div>
                                            <span style={{color: '#212529', fontWeight: 'bold'}}>
                                                {section.color || '#FFA500'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <strong style={{color: '#007bff'}}>
                                            {section.itemCount || section.items?.length || 0}
                                        </strong> items
                                    </td>
                                    <td style={tdStyle}>
                                        <button 
                                            style={viewButtonStyle}
                                            onClick={() => handleView(section, 'menu')}
                                        >
                                            👁️ View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={emptyStateStyle}>
                                    <div>🍽️ No menu sections found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination(menuData, fetchMenuData, 'menu')}
        </div>
    );

    const getStatusBadgeStyle = (status, type) => {
        const baseStyle = {
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        };

        if (type === 'order') {
            switch (status?.toLowerCase()) {
                case 'pending': return {...baseStyle, backgroundColor: '#f39c12'};
                case 'completed': return {...baseStyle, backgroundColor: '#27ae60'};
                case 'cancelled': return {...baseStyle, backgroundColor: '#e74c3c'};
                default: return {...baseStyle, backgroundColor: '#f39c12'};
            }
        }
        if (type === 'mode') {
            switch (status?.toLowerCase()) {
                case 'dinein': return {...baseStyle, backgroundColor: '#3498db'};
                case 'pickup': return {...baseStyle, backgroundColor: '#9b59b6'};
                case 'delivery': return {...baseStyle, backgroundColor: '#e67e22'};
                default: return {...baseStyle, backgroundColor: '#3498db'};
            }
        }
        return baseStyle;
    };

    // Show loading spinner while data is being fetched
    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div style={containerStyle}>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    * {
                        box-sizing: border-box;
                    }
                    
                    table {
                        border-spacing: 0;
                    }
                    
                    button:hover {
                        opacity: 0.9;
                        transform: translateY(-1px);
                    }
                    
                    tr:hover {
                        background-color: #f8f9fa !important;
                    }
                `}
            </style>
            
            {/* Logout Button */}
            <button 
                style={logoutButtonStyle}
                onClick={handleLogout}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#c82333';
                    e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#dc3545';
                    e.target.style.transform = 'none';
                }}
            >
                🚪 Logout
            </button>
            
            <div style={headerStyle}>
                <h1 style={{color: '#FFA500', margin: '0 0 10px 0'}}>🏰 Raja Rani Admin Dashboard (View Only)</h1>
                <p style={{color: '#6c757d', margin: '0', fontSize: '16px'}}>View restaurant data - Read-only access</p>
                <div style={{marginTop: '10px', fontSize: '14px', color: '#212529', fontWeight: 'bold'}}>
                    Backend: http://localhost:5000 | 
                    Registrations: <span style={{color: '#007bff'}}>{registrations.items.length}</span> | 
                    Orders: <span style={{color: '#28a745'}}>{orders.items.length}</span> | 
                    Menu Sections: <span style={{color: '#ffc107'}}>{menuData.items.length}</span>
                </div>
                <div style={{marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
                    <button 
                        onClick={testAPIEndpoints}
                        style={{...primaryButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                    >
                        🔧 Test API Endpoints
                    </button>
                    <div style={{fontSize: '11px', color: '#6c757d'}}>
                        <strong>API Status:</strong> 
                        Health: <span style={{color: apiStatus.health.includes('✅') ? '#28a745' : '#dc3545'}}>{apiStatus.health}</span> | 
                        Registrations: <span style={{color: apiStatus.registrations.includes('✅') ? '#28a745' : '#dc3545'}}>{apiStatus.registrations}</span> | 
                        Orders: <span style={{color: apiStatus.orders.includes('✅') ? '#28a745' : '#dc3545'}}>{apiStatus.orders}</span> | 
                        Menu: <span style={{color: apiStatus.menu.includes('✅') ? '#28a745' : '#dc3545'}}>{apiStatus.menu}</span>
                    </div>
                    <div style={{
                        backgroundColor: '#e9ecef',
                        color: '#6c757d',
                        padding: '5px 10px',
                        borderRadius: '15px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                    }}>
                        📖 READ-ONLY MODE
                    </div>
                </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}
            
            {renderTabNavigation()}
            
            {activeTab === 'registrations' && renderRegistrationsTab()}
            {activeTab === 'orders' && renderOrdersTab()}
            {activeTab === 'menu' && renderMenuTab()}

            {renderModal()}
        </div>
    );
};

export default AdminDashboard;