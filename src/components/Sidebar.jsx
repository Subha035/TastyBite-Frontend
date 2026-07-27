import React from 'react';
import { 
  MessageSquare, 
  Home, 
  Utensils, 
  ShoppingBag,
  Tag, 
  Calendar, 
  Phone, 
  Moon, 
  Sun,
  Settings2,
  ArrowUpRight,
  LogIn,
  LogOut
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, darkMode, setDarkMode, currentUser, onOpenAuthModal, onLogout }) => {
  const menuItems = [
    { id: 'new-chat', label: 'New Chat', icon: MessageSquare, isButton: true },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'menu', label: 'Menu', icon: Utensils },
    { id: 'place-order', label: 'Place Order', icon: ShoppingBag },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'contact-us', label: 'Contact Us', icon: Phone }
  ];

  return (
    <aside className="left-sidebar">
      <div>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="logo-icon">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M6 18V9a6 6 0 0 1 12 0v9" />
              <path d="M3 18h18a1 1 0 0 1 1 1v2H2v-2a1 1 0 0 1 1-1Z" />
              <path d="M12 2v3" />
            </svg>
          </div>
          <div className="brand-details">
            <span className="brand-name">TastyBite</span>
            <span className="brand-subtitle">AI Assistant</span>
          </div>
        </div>

        {/* User Auth Profile Badge */}
        <div className="sidebar-user-badge">
          {currentUser ? (
            <div className="user-profile-info">
              <img
                src={currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + currentUser.email}
                alt={currentUser.name}
                className="user-avatar-img"
              />
              <div className="user-text-meta">
                <span className="user-display-name">{currentUser.name}</span>
                <span className="user-display-email">{currentUser.email}</span>
              </div>
              <button className="user-logout-icon-btn" onClick={onLogout} title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="sidebar-login-trigger-btn" onClick={onOpenAuthModal}>
              <LogIn size={16} />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            if (item.isButton) {
              return (
                <li key={item.id}>
                  <button 
                    className={`menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                    style={{ width: '100%', border: 'none', background: isActive ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left' }}
                  >
                    <IconComponent />
                    {item.label}
                  </button>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <a 
                  href={`#${item.id}`} 
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                  }}
                >
                  <IconComponent />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        {/* Admin Panel Promo Card */}
        <div className="sidebar-promo-card">
          <div className="promo-text">
            Access restaurant analytics, management, and controls.
          </div>
          <button className="promo-btn" onClick={() => setActiveTab('admin-panel')}>
            Admin Panel
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Dark Mode Switch */}
        <div className="dark-mode-toggle">
          <div className="toggle-label">
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
            Dark Mode
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
