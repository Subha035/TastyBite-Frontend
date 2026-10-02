import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { getMenuItems, getOffers } from '../services/apiService';

const RightPanel = ({ onNavigateToMenu }) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [categoryCards, setCategoryCards] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loadingPopularItems, setLoadingPopularItems] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRightPanelMenu() {
      setLoadingPopularItems(true);
      try {
        const data = await getMenuItems();
        if (!isMounted) return;

        if (Array.isArray(data) && data.length > 0) {
          const cards = data.slice(0, 4).map((item, index) => ({
            id: item.id || index + 1,
            label: item.category || 'Dish',
            title: item.title || 'Featured Dish',
            desc: item.desc || 'Freshly prepared item from database.',
            image: item.image || '/margherita_pizza.png',
            accent: ['#f59e0b', '#ef4444', '#10b981', '#6366f1'][index % 4]
          }));
          setCategoryCards(cards);
          setActiveCategoryIndex(0);

          const formatted = data.slice(0, 3).map((item, index) => ({
            id: item.id || index + 1,
            title: item.title || 'Menu Item',
            rating: item.rating ? String(item.rating) : '4.5',
            price: typeof item.price === 'number' ? `₹${item.price}` : (item.price || '₹0'),
            image: item.image || '/margherita_pizza.png'
          }));
          setPopularItems(formatted);
        } else {
          setCategoryCards([]);
          setPopularItems([]);
        }
      } catch (err) {
        console.warn('Failed to load menu data in RightPanel:', err);
        if (isMounted) {
          setCategoryCards([]);
          setPopularItems([]);
        }
      } finally {
        if (isMounted) setLoadingPopularItems(false);
      }
    }

    loadRightPanelMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadOffers() {
      setLoadingOffers(true);
      try {
        const data = await getOffers();
        if (!isMounted) return;

        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((offer, index) => {
            const title = offer.title || (offer.discount ? `${offer.discount} OFF` : 'Special Offer');
            const desc = offer.desc || offer.description || (offer.minCart ? `On orders above ${offer.minCart}` : (offer.minOrder ? `On orders above ₹${offer.minOrder}` : 'Special discount'));
            const code = offer.code || 'NOCODE';
            return {
              id: offer.id || index + 1,
              title: title,
              desc: desc,
              code: code
            };
          });
          setOffers(formatted);
        } else {
          setOffers([]);
        }
      } catch (err) {
        console.warn('Failed to load offers from database:', err);
        if (isMounted) setOffers([]);
      } finally {
        if (isMounted) setLoadingOffers(false);
      }
    }

    loadOffers();

    const handleOffersUpdated = () => {
      loadOffers();
    };

    window.addEventListener('offersUpdated', handleOffersUpdated);
    window.addEventListener('storage', handleOffersUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('offersUpdated', handleOffersUpdated);
      window.removeEventListener('storage', handleOffersUpdated);
    };
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Code "${code}" copied to clipboard!`);
  };

  const activeCard = categoryCards[activeCategoryIndex];

  return (
    <aside className="right-panel">
      {/* Category Slider */}
      {categoryCards.length > 0 && activeCard && (
        <div className="category-carousel">
          <div
            className="category-slider-card"
            style={{
              backgroundImage: `url(${activeCard.image})`,
              borderColor: activeCard.accent
            }}
          >
            <div className="category-slider-overlay"></div>
            <div className="category-slider-top">
              <span className="category-slider-label">
                {activeCard.label}
              </span>
              <span className="category-slider-pill">Featured</span>
            </div>
            <div className="category-slider-content">
              <h3>{activeCard.title}</h3>
              <p>{activeCard.desc}</p>
              <button className="category-slider-button">View Special</button>
            </div>
          </div>
          <div className="carousel-dots">
            {categoryCards.map((item, index) => (
              <button
                key={item.id}
                className={`carousel-dot ${index === activeCategoryIndex ? 'active' : ''}`}
                onClick={() => setActiveCategoryIndex(index)}
                aria-label={`Show ${item.label}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Popular Items Section */}
      <div className="panel-section">
        <div className="section-header">
          <h4 className="section-title">Popular Items</h4>
          <button 
            type="button" 
            className="view-all-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => onNavigateToMenu && onNavigateToMenu()}
          >
            View All
          </button>
        </div>
        <div className="items-list">
          {loadingPopularItems ? (
            <div className="popular-item-card">Loading items...</div>
          ) : popularItems.length > 0 ? (
            popularItems.map((item) => (
              <div key={item.id} className="popular-item-card">
                <img src={item.image} alt={item.title} className="item-img" loading="lazy" decoding="async" />
                <div className="item-info">
                  <span className="item-title">{item.title}</span>
                  <div className="item-rating-row">
                    <Star />
                    <span className="item-rating">{item.rating}</span>
                  </div>
                </div>
                <span className="item-price">{item.price}</span>
              </div>
            ))
          ) : (
            <div className="popular-item-card">No popular items available yet.</div>
          )}
        </div>
      </div>

      {/* Offers for You Section */}
      <div className="panel-section">
        <div className="section-header">
          <h4 className="section-title">Offers for You</h4>
          <a href="#view-all-offers" className="view-all-link">View All</a>
        </div>
        <div className="items-list">
          {loadingOffers ? (
            <div className="coupon-card">Loading offers...</div>
          ) : offers.length > 0 ? (
            offers.map((offer) => (
              <div key={offer.id} className="coupon-card">
                <div className="coupon-details">
                  <span className="coupon-title">{offer.title}</span>
                  <span className="coupon-desc">{offer.desc}</span>
                </div>
                <button 
                  className="coupon-code"
                  onClick={() => handleCopyCode(offer.code)}
                  title="Click to copy"
                >
                  {offer.code}
                </button>
              </div>
            ))
          ) : (
            <div className="coupon-card">No offers available yet.</div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;

