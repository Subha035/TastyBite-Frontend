import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  ChevronRight,
  UtensilsCrossed,
  CalendarDays,
  BadgePercent,
  MessageSquareDiff
} from 'lucide-react';
import { getMenuItems } from '../services/apiService';
import './HomeSection.css';

const HomeSection = ({ setActiveTab, handleSendMessage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredItem, setFeaturedItem] = useState(null);

  useEffect(() => {
    async function loadFeaturedItem() {
      try {
        const data = await getMenuItems();
        const firstItem = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (firstItem) {
          setFeaturedItem({
            id: firstItem.id,
            title: firstItem.title || 'Featured Item',
            desc: firstItem.desc || '',
            price: typeof firstItem.price === 'number' ? `₹${firstItem.price}` : (firstItem.price || '₹0'),
            rating: firstItem.rating ? String(firstItem.rating) : '4.5',
            image: firstItem.image || '/margherita_pizza.png'
          });
        } else {
          setFeaturedItem(null);
        }
      } catch (err) {
        console.warn('Failed to load featured item:', err);
        setFeaturedItem(null);
      }
    }

    loadFeaturedItem();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveTab('new-chat');
    handleSendMessage(searchQuery);
  };

  const handleSuggestionClick = (text) => {
    setActiveTab('new-chat');
    handleSendMessage(text);
  };

  return (
    <div className="home-section-container">
      {/* Hero Banner */}
      <div className="home-hero-card">
        <div className="hero-gradient-overlay"></div>
        <div className="hero-content">
          <span className="hero-badge">
            <Sparkles size={14} className="sparkle-icon" /> AI-Powered Dining Assistant
          </span>
          <h1 className="hero-title">Welcome to TastyBite Restaurant</h1>
          <p className="hero-subtitle">
            Order your favorite meals, book table reservations and let our intelligent AI chatbot handle your customizations.
          </p>

          <form onSubmit={handleSearchSubmit} className="hero-search-bar">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="What are you craving today? Ask AI: 'Are there any discounts?'" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">
              Ask Assistant
            </button>
          </form>

          <div className="suggestion-row">
            <span className="suggestion-label">Popular queries:</span>
            <button 
              className="suggestion-link" 
              onClick={() => handleSuggestionClick("What is today's best deal?")}
            >
              "Active Deals"
            </button>
            <button 
              className="suggestion-link" 
              onClick={() => handleSuggestionClick("Show me the pizza options")}
            >
              "Pizzas Menu"
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card action-card" onClick={() => setActiveTab('menu')}>
          <div className="card-icon-wrapper menu-icon">
            <UtensilsCrossed size={24} />
          </div>
          <div className="card-info">
            <h3 className="card-title">Explore Menu</h3>
            <p className="card-desc">Browse our collection of hand-crafted pizzas, pastas, burgers and desserts.</p>
          </div>
          <ChevronRight size={18} className="arrow-icon" />
        </div>

        <div className="dashboard-card action-card" onClick={() => setActiveTab('reservations')}>
          <div className="card-icon-wrapper reserve-icon">
            <CalendarDays size={24} />
          </div>
          <div className="card-info">
            <h3 className="card-title">Book a Table</h3>
            <p className="card-desc">Book your table instantly and skip the waiting line for a premium dining experience.</p>
          </div>
          <ChevronRight size={18} className="arrow-icon" />
        </div>

        <div className="dashboard-card action-card" onClick={() => setActiveTab('offers')}>
          <div className="card-icon-wrapper offer-icon">
            <BadgePercent size={24} />
          </div>
          <div className="card-info">
            <h3 className="card-title">Offers & Deals</h3>
            <p className="card-desc">Claim discounts, flat rate promotions and exclusive coupon codes for today.</p>
          </div>
          <ChevronRight size={18} className="arrow-icon" />
        </div>
      </div>

      {/* Featured Teaser & AI Assistant Teaser Grid */}
      <div className="dashboard-row-layout">
        {/* Chef's choice teaser */}
        {featuredItem && (
          <div className="teaser-card featured-teaser">
            <div className="teaser-badge">Chef's Featured Choice</div>
            <div className="teaser-body">
              <img src={featuredItem.image} alt={featuredItem.title} className="teaser-img" />
              <div className="teaser-details">
                <h4 className="teaser-title">{featuredItem.title}</h4>
                <p className="teaser-desc">{featuredItem.desc}</p>
                <div className="teaser-footer">
                  <span className="teaser-price">{featuredItem.price}</span>
                  <button className="teaser-btn" onClick={() => setActiveTab('menu')}>
                    View Full Menu <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Bot promotion teaser */}
        <div className="teaser-card ai-teaser" onClick={() => setActiveTab('new-chat')}>
          <div className="ai-teaser-overlay"></div>
          <div className="ai-teaser-content">
            <div className="ai-icon-pulse">
              <MessageSquareDiff size={28} />
            </div>
            <h3 className="ai-teaser-title">Meet Your Personal AI Host</h3>
            <p className="ai-teaser-desc">
              Have questions about ingredients, allergy warnings or want to place custom orders? Type them in our AI Assistant chat panel.
            </p>
            <button className="ai-chat-start-btn">
              Start Chatting <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSection;
