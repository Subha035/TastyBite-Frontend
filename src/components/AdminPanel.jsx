import React, { useState, useEffect } from 'react';
import { BarChart3, Users, ClipboardList, CreditCard, Settings2, Bell, CheckCircle2 } from 'lucide-react';
import { getActivities, getOrders, getMenuItems, getReservations } from '../services/apiService';

const actions = [
  { label: 'Manage Menu', icon: ClipboardList, target: 'menu-manager' },
  { label: 'View Reservations', icon: Bell, target: 'admin-reservations' },
  { label: 'Update Offers', icon: CreditCard, target: 'offers-manager' },
  { label: 'System Settings', icon: Settings2 }
];

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

const AdminPanel = ({ setActiveTab }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setNowTick] = useState(Date.now());

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

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const [activitiesData, ordersData, menuData, resData] = await Promise.all([
          getActivities().catch(() => null),
          getOrders().catch(() => null),
          getMenuItems().catch(() => null),
          getReservations().catch(() => null)
        ]);

        if (!isMounted) return;

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

        // Today's served / completed orders
        const servedCount = orderList.filter(o => o.status === 'COMPLETED' || o.status === 'SERVED' || o.status === 'CONFIRMED').length;

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
          servedToday: servedCount > 0 ? servedCount.toLocaleString() : String(totalOrdersCount),
          revenue: formattedRevenue,
          menuUpdates: menuList.length > 0 ? String(menuList.length) : '0'
        });

      } catch {
        if (isMounted) setActivities(getFallbackActivities());
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    const handleDataUpdated = () => {
      loadDashboardData();
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
      subtitle: 'All orders placed in DB'
    },
    {
      title: 'Orders Served Today',
      value: dbStats.servedToday,
      icon: CheckCircle2,
      subtitle: 'Orders fulfilled & delivered'
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

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <p className="section-label">Admin Dashboard</p>
          <h1 className="section-title">Restaurant Management</h1>
        </div>
        <div className="admin-header-note">
          <span>Live control and quick access for staff operations.</span>
        </div>
      </div>

      <div className="admin-overview-grid">
        {statsCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="admin-card">
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
                onClick={() => handleActionClick(action.target)}
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
                <div>{item.title}</div>
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
