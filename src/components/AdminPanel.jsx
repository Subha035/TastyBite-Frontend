import React, { useState, useEffect } from 'react';
import { BarChart3, ClipboardList, CreditCard, Settings2, Bell, CheckCircle2, Utensils, Check, LogOut, ShieldCheck } from 'lucide-react';
import { getActivities, getOrders, getMenuItems, getReservations, updateOrderStatus, logActivity } from '../services/apiService';

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

const getFallbackActivities = () => {
  const nowMs = Date.now();
  return [
    { id: '1', title: 'Table reservation for 4 guests confirmed', timestamp: nowMs - 3 * 60 * 1000, time: '3 minutes ago' },
    { id: '2', title: 'Offer coupon SAVE20 updated', timestamp: nowMs - 18 * 60 * 1000, time: '18 minutes ago' },
    { id: '3', title: 'Item Chicken Cheese Burger marked Out of Stock', timestamp: nowMs - 35 * 60 * 1000, time: '35 minutes ago' },
    { id: '4', title: 'New menu item Veg Supreme Pizza updated', timestamp: nowMs - 60 * 60 * 1000, time: '1 hour ago' }
  ];
};

const AdminPanel = ({ setActiveTab, onLogout }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setNowTick] = useState(Date.now());

  // Orders State
  const [orders, setOrders] = useState([]);

  // Database Overview Cards State
  const [dbStats, setDbStats] = useState({
    totalOrders: '0',
    servedToday: '0',
    revenue: '₹0',
    menuUpdates: '0'
  });

  const handleActionClick = (target) => {
    if (target) {
      setActiveTab(target);
    }
  };

  useEffect(() => {
    // Ticks relative time counters every 10 seconds live
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [activitiesData, ordersData, menuData] = await Promise.all([
        getActivities().catch(() => null),
        getOrders().catch(() => null),
        getMenuItems().catch(() => null)
      ]);

      // Process Activities
      if (Array.isArray(activitiesData) && activitiesData.length > 0) {
        setActivities(activitiesData.slice(0, 4));
      } else {
        setActivities(getFallbackActivities());
      }

      // Calculate DB Stats
      const orderList = Array.isArray(ordersData) ? ordersData : [];
      const menuList = Array.isArray(menuData) ? menuData : [];
      const totalOrdersCount = orderList.length;

      // Sort latest orders first
      const sortedOrders = [...orderList].sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
      setOrders(sortedOrders);

      // Today's served / completed orders — handles local date, UTC and multiple completed statuses
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const localTodayStr = `${yyyy}-${mm}-${dd}`;
      const utcTodayStr = now.toISOString().slice(0, 10);

      const servedCount = orderList.filter(o => {
        const status = String(o.status || '').toUpperCase();
        const isCompleted = status === 'SERVED' || status === 'COMPLETED' || status === 'CONFIRMED' || status === 'DELIVERED';
        if (!isCompleted) return false;

        if (!o.createdAt) return true;
        const orderDate = String(o.createdAt).slice(0, 10);
        return orderDate === localTodayStr || orderDate === utcTodayStr;
      }).length;

      // Revenue calculation
      const totalRevenueNum = orderList.reduce((sum, o) => {
        const amt = typeof o.totalAmount === 'number' ? o.totalAmount : (parseFloat(String(o.totalAmount || 0).replace(/[^\d.]/g, '')) || 0);
        return sum + amt;
      }, 0);

      let formattedRevenue = `₹${totalRevenueNum}`;
      if (totalRevenueNum >= 1000) {
        formattedRevenue = `₹${(totalRevenueNum / 1000).toFixed(1)}K`;
      }

      setDbStats({
        totalOrders: totalOrdersCount > 0 ? totalOrdersCount.toLocaleString() : '0',
        servedToday: servedCount.toLocaleString(),
        revenue: formattedRevenue,
        menuUpdates: menuList.length > 0 ? String(menuList.length) : '0'
      });

    } catch {
      setActivities(getFallbackActivities());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    loadDashboardData();

    const handleDataUpdated = () => {
      if (isMounted) loadDashboardData();
    };

    window.addEventListener('activitiesUpdated', handleDataUpdated);
    window.addEventListener('offersUpdated', handleDataUpdated);
    window.addEventListener('storage', handleDataUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('activitiesUpdated', handleDataUpdated);
      window.removeEventListener('offersUpdated', handleDataUpdated);
      window.removeEventListener('storage', handleDataUpdated);
    };
  }, []);

  const statsCards = [
    {
      title: 'Total Orders',
      value: dbStats.totalOrders,
      icon: ClipboardList,
      subtitle: 'Click to open Live Orders page',
      onClick: () => handleActionClick('admin-orders')
    },
    {
      title: 'Orders Served Today',
      value: dbStats.servedToday,
      icon: CheckCircle2,
      subtitle: 'Click to open Live Orders page',
      onClick: () => handleActionClick('admin-orders')
    },
    {
      title: 'Revenue',
      value: dbStats.revenue,
      icon: CreditCard,
      subtitle: 'Total database earnings'
    },
    {
      title: 'Menu Items',
      value: dbStats.menuUpdates,
      icon: BarChart3,
      subtitle: 'Dishes available in DB'
    }
  ];

  const actions = [
    { label: 'Live Orders & Kitchen Status', icon: Utensils, target: 'admin-orders' },
    { label: 'Manage Menu', icon: ClipboardList, target: 'menu-manager' },
    { label: 'View Reservations', icon: Bell, target: 'admin-reservations' },
    { label: 'Update Offers', icon: CreditCard, target: 'offers-manager' }
  ];

  return (
    <div className="admin-panel">
      <style>{`
        .stat-card-clickable {
          cursor: pointer;
        }
        .stat-card-clickable:hover {
          border-color: #d85e13;
        }
      `}</style>

      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="section-label">Admin Dashboard</p>
          <h1 className="section-title">Restaurant Management</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(216, 94, 19, 0.1)', color: '#d85e13', fontSize: '0.82rem', fontWeight: '700' }}>
            <ShieldCheck size={16} /> Admin035
          </div>
          {onLogout && (
            <button 
              type="button" 
              onClick={onLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ef4444';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              title="Log out from Admin panel"
            >
              <LogOut size={15} /> Log Out
            </button>
          )}
        </div>
      </div>

      <div className="admin-overview-grid">
        {statsCards.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.title} 
              className={`admin-card ${item.onClick ? 'stat-card-clickable' : ''}`}
              onClick={item.onClick}
              title={item.onClick ? 'Click to filter orders' : ''}
            >
              <div className="admin-card-top">
                <div className="admin-card-icon">
                  <Icon size={18} />
                </div>
                <div className="admin-card-value">{item.value}</div>
              </div>
              <div className="admin-card-title">{item.title}</div>
              <div className="admin-card-subtitle">{item.subtitle}</div>
            </div>
          );
        })}
      </div>

      <div className="admin-actions-panel">
        <div className="admin-section-heading">Quick Actions</div>
        <div className="admin-actions-grid">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                className="admin-action-btn"
                onClick={() => {
                  if (action.onClick) action.onClick();
                  else if (action.target) handleActionClick(action.target);
                }}
              >
                <span className="admin-action-icon"><Icon size={16} /></span>
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="admin-activity-panel">
        <div className="admin-section-heading">Recent Activity (Last 4 Updates)</div>
        <div className="activity-list">
          {loading ? (
            <div className="activity-item">Loading activities from database...</div>
          ) : activities.length > 0 ? (
            activities.map((item, idx) => (
              <div key={item.id || idx} className="activity-item">
                <div className="activity-title">{item.title}</div>
                <div className="activity-time">{formatRelativeTime(item.timestamp, item.time)}</div>
              </div>
            ))
          ) : (
            <div className="activity-item">No recent activity logs recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
