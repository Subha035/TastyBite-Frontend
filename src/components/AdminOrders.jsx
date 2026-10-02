import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Utensils, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Search, 
  Filter, 
  ChefHat, 
  AlertCircle,
  CreditCard,
  Phone,
  User,
  ShoppingBag,
  Banknote,
  LogOut
} from 'lucide-react';
import { getOrders, updateOrderStatus, updateOrderPaymentStatus, logActivity } from '../services/apiService';

const formatRelativeTime = (timestamp, fallbackTime) => {
  if (!timestamp) return fallbackTime || 'Just now';
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  
  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return '1 minute ago';
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour === 1) return '1 hour ago';
  if (diffHour < 24) return `${diffHour} hours ago`;
  
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '1 day ago';
  return `${diffDay} days ago`;
};

const AdminOrders = ({ onBack, initialFilter = 'ALL', onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [, setTick] = useState(Date.now());

  // Fetch orders from backend
  const fetchOrdersData = async () => {
    try {
      const data = await getOrders();
      if (Array.isArray(data)) {
        // Sort latest first
        const sorted = [...data].sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setOrders(sorted);
      } else {
        setOrders([]);
      }
      setLastRefreshed(Date.now());
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();

    // Auto-refresh orders every 10 seconds for live kitchen updates
    const autoRefreshTimer = setInterval(() => {
      fetchOrdersData();
    }, 10000);

    // Live tick for relative timestamps
    const tickTimer = setInterval(() => {
      setTick(Date.now());
    }, 5000);

    return () => {
      clearInterval(autoRefreshTimer);
      clearInterval(tickTimer);
    };
  }, []);

  // Update order status handler
  const handleStatusChange = async (orderId, newStatus) => {
    const target = orders.find(o => o.id === orderId);
    const isOnline = !!target?.razorpayPaymentId;
    const isPaid = target?.paymentStatus === 'PAID';

    // Business rule: for pay on counter, money must be accepted before marking as served
    if (newStatus === 'SERVED' && !isOnline && !isPaid) {
      alert(`⚠️ Cash Payment Required First!\n\nOrder for Table ${target?.tableNumber || '-'} has a pending counter payment of ₹${target?.totalAmount || 0}.\n\nPlease accept the money at the counter and click "Mark as Paid" before marking this order as Served.`);
      return;
    }

    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);

      const displayId = target?.orderId || orderId;
      const tableText = target?.tableNumber ? `Table ${target.tableNumber}` : '';

      if (newStatus === 'SERVED') {
        logActivity(`Order ${displayId} marked as SERVED for ${tableText}`, 'order');
      } else if (newStatus === 'CANCELLED') {
        logActivity(`Order ${displayId} CANCELLED`, 'order');
      }

      // Update state locally for instantaneous snappy UI feedback
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      // Re-fetch backend
      await fetchOrdersData();
      
      // Dispatch storage/activity event so dashboard counters update
      window.dispatchEvent(new Event('activitiesUpdated'));
    } catch (err) {
      console.warn('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Update counter payment status handler (PAID vs PENDING)
  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      setUpdatingPaymentId(orderId);
      await updateOrderPaymentStatus(orderId, newPaymentStatus);

      const target = orders.find(o => o.id === orderId);
      const displayId = target?.orderId || orderId;
      const tableText = target?.tableNumber ? `Table ${target.tableNumber}` : '';

      if (newPaymentStatus === 'PAID') {
        logActivity(`Payment for ${displayId} (${tableText}) marked as PAID at counter`, 'order');
      } else {
        logActivity(`Payment for ${displayId} (${tableText}) marked as UNPAID at counter`, 'order');
      }

      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
      window.dispatchEvent(new Event('activitiesUpdated'));
    } catch (err) {
      console.warn('Failed to update payment status:', err);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Metrics calculations
  const now = new Date();
  const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const utcTodayStr = now.toISOString().slice(0, 10);

  const preparingCount = orders.filter(o => String(o.status || 'PREPARING').toUpperCase() === 'PREPARING').length;
  
  const servedTodayCount = orders.filter(o => {
    const status = String(o.status || '').toUpperCase();
    const isServed = status === 'SERVED' || status === 'COMPLETED' || status === 'DELIVERED';
    if (!isServed) return false;
    if (!o.createdAt) return true;
    const dateStr = String(o.createdAt).slice(0, 10);
    return dateStr === localTodayStr || dateStr === utcTodayStr;
  }).length;

  // Unpaid Cash on Counter Orders
  const unpaidCounterCount = orders.filter(o => {
    const isOnline = !!o.razorpayPaymentId;
    return !isOnline && o.paymentStatus !== 'PAID';
  }).length;

  // Filtering
  const filteredOrders = orders.filter(order => {
    const status = String(order.status || 'PREPARING').toUpperCase();

    let matchesFilter = true;
    if (selectedFilter === 'PREPARING') matchesFilter = status === 'PREPARING';
    else if (selectedFilter === 'SERVED') matchesFilter = status === 'SERVED' || status === 'COMPLETED' || status === 'DELIVERED';
    else if (selectedFilter === 'UNPAID_COUNTER') {
      const isOnline = !!order.razorpayPaymentId;
      matchesFilter = !isOnline && order.paymentStatus !== 'PAID';
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (order.orderId && order.orderId.toLowerCase().includes(q)) ||
      (order.tableNumber && String(order.tableNumber).toLowerCase().includes(q)) ||
      (order.customerName && order.customerName.toLowerCase().includes(q)) ||
      (order.customerPhone && order.customerPhone.includes(q));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="admin-panel admin-orders-page">
      <style>{`
        .admin-orders-page {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          overflow-y: auto;
          width: 100%;
          box-sizing: border-box;
        }

        .kds-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .kds-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kds-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #d85e13;
          background: rgba(216, 94, 19, 0.12);
          padding: 3px 10px;
          border-radius: 20px;
          width: fit-content;
        }

        .kds-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: kdsPulse 1.8s infinite;
        }

        @keyframes kdsPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .kds-actions-bar {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .kds-refresh-btn, .kds-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 14px;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-main);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .kds-refresh-btn:hover, .kds-back-btn:hover {
          border-color: #d85e13;
          color: #d85e13;
          transform: translateY(-1px);
        }

        /* Metric Highlights Row */
        .kds-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .kds-metric-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .kds-metric-card:hover {
          border-color: #d85e13;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }

        .kds-metric-card.active {
          border-color: #d85e13;
          background: rgba(216, 94, 19, 0.06);
        }

        .kds-metric-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .kds-metric-val {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
        }

        .kds-metric-label {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .kds-metric-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
        }

        /* Filter & Search Bar */
        .kds-controls-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .kds-filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .kds-pill {
          padding: 7px 16px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background: var(--bg-main);
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .kds-pill:hover {
          border-color: #d85e13;
          color: var(--text-main);
        }

        .kds-pill.active {
          background: linear-gradient(135deg, #d85e13 0%, #ea580c 100%);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(216, 94, 19, 0.25);
        }

        .kds-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 8px 14px;
          min-width: 260px;
        }

        .kds-search-box input {
          border: none;
          background: transparent;
          color: var(--text-main);
          font-size: 0.85rem;
          outline: none;
          width: 100%;
        }

        /* Orders Grid */
        .kds-orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 18px;
        }

        .kds-order-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          transition: all 0.25s ease;
          box-shadow: var(--shadow-sm);
        }

        .kds-order-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }

        .kds-order-card.status-preparing {
          border-top: 4px solid #f59e0b;
        }

        .kds-order-card.status-served {
          border-top: 4px solid #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .kds-order-card.status-completed {
          border-top: 4px solid #3b82f6;
        }

        .kds-card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .kds-order-id-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .kds-id-text {
          font-size: 1.15rem;
          font-weight: 900;
          color: var(--text-main);
          letter-spacing: -0.3px;
        }

        .kds-table-badge {
          background: linear-gradient(135deg, rgba(216, 94, 19, 0.15) 0%, rgba(234, 88, 12, 0.2) 100%);
          color: #d85e13;
          font-size: 0.78rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
        }

        .kds-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .kds-status-pill.preparing {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .kds-status-pill.served {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .kds-status-pill.completed {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .kds-cust-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          color: var(--text-muted);
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 10px;
        }

        .kds-cust-left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: var(--text-main);
        }

        .kds-time-ago {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.76rem;
        }

        /* Items Container */
        .kds-items-container {
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 160px;
          overflow-y: auto;
        }

        .kds-item-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .kds-item-qty {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 2px 7px;
          font-weight: 800;
          color: #d85e13;
          margin-right: 6px;
        }

        .kds-payment-box {
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          transition: all 0.2s ease;
        }

        .kds-payment-box.is-unpaid {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.35);
        }

        .kds-payment-box.is-paid {
          background: rgba(16, 185, 129, 0.06);
          border-color: rgba(16, 185, 129, 0.25);
        }

        .kds-payment-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .badge-online {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.12);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .badge-paid {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .badge-unpaid {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.18);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .kds-counter-pay-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .kds-mark-paid-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .kds-mark-paid-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
        }

        .kds-mark-unpaid-btn {
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .kds-mark-unpaid-btn:hover:not(:disabled) {
          border-color: #ef4444;
          color: #ef4444;
        }

        .kds-counter-select {
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          border-radius: 8px;
          padding: 5px 8px;
          font-size: 0.72rem;
          font-weight: 700;
          outline: none;
          cursor: pointer;
        }

        .kds-counter-select.unpaid {
          border-color: rgba(245, 158, 11, 0.5);
          color: #f59e0b;
        }

        .kds-counter-select.paid {
          border-color: rgba(16, 185, 129, 0.5);
          color: #10b981;
        }

        .kds-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px dashed var(--border-color);
        }

        .kds-price-block {
          display: flex;
          flex-direction: column;
        }

        .kds-price-val {
          font-size: 1.15rem;
          font-weight: 900;
          color: #d85e13;
        }

        .kds-pay-status {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .kds-btn-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .kds-serve-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border: none;
          padding: 9px 16px;
          border-radius: 12px;
          font-size: 0.84rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .kds-serve-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.45);
        }

        .kds-serve-btn.disabled-unpaid {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px dashed rgba(245, 158, 11, 0.5);
          box-shadow: none;
          cursor: pointer;
        }

        .kds-serve-btn.disabled-unpaid:hover {
          background: rgba(245, 158, 11, 0.25);
          transform: translateY(-1px);
        }

        .kds-served-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .kds-select {
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          border-radius: 10px;
          padding: 7px 10px;
          font-size: 0.78rem;
          font-weight: 700;
          outline: none;
          cursor: pointer;
        }

        .kds-empty-box {
          background: var(--card-bg);
          border: 1px dashed var(--border-color);
          border-radius: 20px;
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 900px) {
          .kds-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .kds-metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="kds-header">
        <div className="kds-title-group">
          <div className="kds-badge">
            <span className="kds-pulse-dot"></span>
            Kitchen Display System (KDS) · Live
          </div>
          <h1 className="section-title" style={{ margin: '4px 0 0 0', fontSize: '1.8rem' }}>
            Live Orders & Kitchen Status
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Real-time table orders, kitchen prep statuses and order serving management.
          </p>
        </div>

        <div className="kds-actions-bar">
          <button 
            type="button" 
            className="kds-refresh-btn" 
            onClick={fetchOrdersData}
            title="Refresh orders from database"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button 
            type="button" 
            className="kds-back-btn" 
            onClick={onBack}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          {onLogout && (
            <button 
              type="button" 
              className="kds-back-btn" 
              onClick={onLogout}
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
              title="Log out from Admin session"
            >
              <LogOut size={16} /> Log Out
            </button>
          )}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="kds-metrics-grid">
        <div 
          className={`kds-metric-card ${selectedFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('ALL')}
        >
          <div className="kds-metric-info">
            <span className="kds-metric-val">{orders.length}</span>
            <span className="kds-metric-label">Total Placed Orders</span>
          </div>
          <div className="kds-metric-icon-box" style={{ background: 'rgba(216, 94, 19, 0.12)', color: '#d85e13' }}>
            <ShoppingBag size={20} />
          </div>
        </div>

        <div 
          className={`kds-metric-card ${selectedFilter === 'PREPARING' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('PREPARING')}
        >
          <div className="kds-metric-info">
            <span className="kds-metric-val" style={{ color: '#f59e0b' }}>{preparingCount}</span>
            <span className="kds-metric-label">In Kitchen (Preparing)</span>
          </div>
          <div className="kds-metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <ChefHat size={20} />
          </div>
        </div>

        <div 
          className={`kds-metric-card ${selectedFilter === 'SERVED' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('SERVED')}
        >
          <div className="kds-metric-info">
            <span className="kds-metric-val" style={{ color: '#10b981' }}>{servedTodayCount}</span>
            <span className="kds-metric-label">Orders Served Today</span>
          </div>
          <div className="kds-metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div 
          className={`kds-metric-card ${selectedFilter === 'UNPAID_COUNTER' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('UNPAID_COUNTER')}
        >
          <div className="kds-metric-info">
            <span className="kds-metric-val" style={{ color: '#ef4444' }}>{unpaidCounterCount}</span>
            <span className="kds-metric-label">Unpaid at Counter</span>
          </div>
          <div className="kds-metric-icon-box" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <Banknote size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="kds-controls-card">
        <div className="kds-filter-pills">
          {[
            { id: 'ALL', label: `All Orders (${orders.length})` },
            { id: 'PREPARING', label: `In Kitchen (${preparingCount})` },
            { id: 'SERVED', label: `Served Today (${servedTodayCount})` },
            { id: 'UNPAID_COUNTER', label: `⚠️ Unpaid at Counter (${unpaidCounterCount})` }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              className={`kds-pill ${selectedFilter === f.id ? 'active' : ''}`}
              onClick={() => setSelectedFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="kds-search-box">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by order ID, table or guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Orders Display */}
      {loading ? (
        <div className="kds-empty-box">
          <RefreshCw size={32} className="animate-spin" style={{ color: '#d85e13' }} />
          <p>Loading live kitchen orders from database...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="kds-empty-box">
          <Utensils size={40} style={{ opacity: 0.35 }} />
          <h3 style={{ margin: '4px 0', color: 'var(--text-main)' }}>No orders in this view</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {searchQuery ? `No orders matched search "${searchQuery}"` : 'All caught up! No active orders under this filter.'}
          </p>
        </div>
      ) : (
        <div className="kds-orders-grid">
          {filteredOrders.map(order => {
            const status = String(order.status || 'PREPARING').toUpperCase();
            const isProcessing = updatingId === order.id;
            const isPaying = updatingPaymentId === order.id;
            const isPaid = order.paymentStatus === 'PAID';
            const isOnline = !!order.razorpayPaymentId;

            return (
              <div 
                key={order.id} 
                className={`kds-order-card status-${status.toLowerCase()}`}
              >
                <div className="kds-card-top-row">
                  <div className="kds-order-id-group">
                    <span className="kds-id-text">{order.orderId || 'Order'}</span>
                    <span className="kds-table-badge">Table {order.tableNumber || '-'}</span>
                  </div>

                  <span className={`kds-status-pill ${status.toLowerCase()}`}>
                    {status === 'PREPARING' && <span className="kds-pulse-dot" style={{ width: 6, height: 6, background: '#f59e0b' }}></span>}
                    {status === 'SERVED' && '✓ '}
                    {status}
                  </span>
                </div>

                <div className="kds-cust-row">
                  <span className="kds-cust-left">
                    <User size={13} style={{ color: 'var(--text-muted)' }} />
                    {order.customerName || 'Guest'}
                    {order.customerPhone && <span style={{ color: 'var(--text-muted)' }}>({order.customerPhone})</span>}
                  </span>

                  <span className="kds-time-ago">
                    <Clock size={12} />
                    {order.createdAt ? formatRelativeTime(new Date(order.createdAt).getTime()) : 'Just now'}
                  </span>
                </div>

                {/* Items Container */}
                <div className="kds-items-container">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div key={idx} className="kds-item-entry">
                        <div>
                          <span className="kds-item-qty">{item.quantity || 1}x</span>
                          <span>{item.title || 'Item'}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>₹{((item.price || 0) * (item.quantity || 1))}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kitchen preparing items</div>
                  )}
                </div>

                {/* Cash on Counter Payment Status Bar & Controls */}
                <div className={`kds-payment-box ${isPaid ? 'is-paid' : 'is-unpaid'}`}>
                  <div className="kds-payment-left">
                    <span className="kds-price-val">₹{order.totalAmount || 0}</span>
                    <span className="kds-payment-tag">
                      {isOnline ? (
                        <span className="badge-online">💳 Paid Online</span>
                      ) : isPaid ? (
                        <span className="badge-paid">✓ Paid at Counter</span>
                      ) : (
                        <span className="badge-unpaid">⚠️ Pay at Counter (Unpaid)</span>
                      )}
                    </span>
                  </div>

                  {/* Cash on Counter: Direct Paid/Unpaid action button & dropdown */}
                  {!isOnline && (
                    <div className="kds-counter-pay-actions">
                      {!isPaid ? (
                        <button
                          type="button"
                          className="kds-mark-paid-btn"
                          disabled={isPaying}
                          onClick={() => handlePaymentStatusChange(order.id, 'PAID')}
                          title="Customer paid at counter - Mark as Paid"
                        >
                          <Banknote size={14} />
                          {isPaying ? 'Saving...' : 'Mark as Paid'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="kds-mark-unpaid-btn"
                          disabled={isPaying}
                          onClick={() => handlePaymentStatusChange(order.id, 'PENDING')}
                          title="Undo payment if marked accidentally"
                        >
                          {isPaying ? '...' : 'Undo (Unpaid)'}
                        </button>
                      )}

                      <select
                        className={`kds-counter-select ${isPaid ? 'paid' : 'unpaid'}`}
                        value={isPaid ? 'PAID' : 'PENDING'}
                        disabled={isPaying}
                        onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                        title="Change counter payment status"
                      >
                        <option value="PENDING">🔴 Unpaid</option>
                        <option value="PAID">🟢 Paid</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Card Bottom / Kitchen Fulfillment Actions */}
                <div className="kds-card-bottom">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <ChefHat size={14} />
                    <span>Kitchen Action:</span>
                  </div>

                  <div className="kds-btn-group">
                    {status === 'PREPARING' && (
                      isOnline || isPaid ? (
                        <button
                          type="button"
                          className="kds-serve-btn"
                          disabled={isProcessing}
                          onClick={() => handleStatusChange(order.id, 'SERVED')}
                          title="Mark this order as served to table"
                        >
                          <Utensils size={15} />
                          {isProcessing ? 'Serving...' : 'Mark as Served'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="kds-serve-btn disabled-unpaid"
                          onClick={() => {
                            alert(`⚠️ Payment required before serving!\n\nPlease accept cash payment of ₹${order.totalAmount || 0} at the counter (click "Mark as Paid") before marking this order as served.`);
                          }}
                          title="Must accept cash payment at counter before marking as served"
                        >
                          <AlertCircle size={15} />
                          Collect ₹{order.totalAmount} to Serve
                        </button>
                      )
                    )}

                    {status === 'SERVED' && (
                      <span className="kds-served-badge">
                        <CheckCircle2 size={15} />
                        Served to Table
                      </span>
                    )}

                    <select
                      className="kds-select"
                      value={status}
                      disabled={isProcessing}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="PREPARING">Preparing</option>
                      <option value="SERVED">Served</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
