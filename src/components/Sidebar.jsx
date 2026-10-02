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
  X
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, darkMode, setDarkMode, isMobileOpen, onClose }) => {
  const menuItems = [
    { id: 'new-chat', label: 'New Chat', icon: MessageSquare, isButton: true },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'menu', label: 'Menu', icon: Utensils },
    { id: 'place-order', label: 'Place Order', icon: ShoppingBag },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'contact-us', label: 'Contact Us', icon: Phone }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <aside className={`left-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
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
          {onClose && (
            <button className="sidebar-mobile-close-btn" onClick={onClose} aria-label="Close menu">
              <X size={20} />
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
                    onClick={() => handleNavClick(item.id)}
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
                    handleNavClick(item.id);
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
            Access restaurant analytics, management and controls.
          </div>
          <button className="promo-btn" onClick={() => handleNavClick('admin-panel')}>
            Admin Panel
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Universal Theme Toggle */}
        <div className="dark-mode-toggle">
          <div className="toggle-label">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
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
