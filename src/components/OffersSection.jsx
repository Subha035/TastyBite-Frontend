import React, { useState, useEffect } from 'react';
import { Tag, Copy, Check, Info } from 'lucide-react';
import { getOffers } from '../services/apiService';
import './OffersSection.css';

const fallbackOffers = [
  {
    id: "save20",
    title: "FLAT 20% OFF",
    desc: "On orders above ₹499",
    code: "SAVE20"
  },
  {
    id: "freegb",
    title: "Free Garlic Bread",
    desc: "On orders above ₹699",
    code: "FREEGB"
  }
];

const OffersSection = () => {
  const [offers, setOffers] = useState(fallbackOffers);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function loadOffers() {
      setLoading(true);
      const data = await getOffers();
      if (data && data.length > 0) {
        const formatted = data.map(o => ({
          id: o.id,
          title: o.title || `FLAT ${o.discountPercent}% OFF`,
          desc: o.desc || `On orders above ₹${o.minOrder}`,
          code: o.code
        }));
        setOffers(formatted);
      }
      setLoading(false);
    }
    loadOffers();

    const handleOffersUpdated = () => {
      loadOffers();
    };
    window.addEventListener('offersUpdated', handleOffersUpdated);
    return () => window.removeEventListener('offersUpdated', handleOffersUpdated);
  }, []);

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="offers-page-container">
      {/* Header */}
      <div className="offers-page-header">
        <h1 className="offers-page-title">Special Offers & Deals</h1>
        <p className="offers-page-subtitle">Grab these exclusive coupons before they expire! Copy and apply them in the assistant chat.</p>
      </div>

      {/* Grid of Coupons */}
      {loading ? (
        <div className="offers-loading-spinner">
          <div className="spinner"></div>
          <span>Fetching active promotions...</span>
        </div>
      ) : (
        <div className="offers-grid">
          {offers.map(offer => (
            <div key={offer.id} className="offer-page-coupon-card">
              <div className="coupon-left-column">
                <div className="coupon-tag-circle">
                  <Tag size={20} />
                </div>
                <div className="coupon-dashed-line"></div>
              </div>
              
              <div className="coupon-main-content">
                <div className="coupon-header">
                  <h3 className="coupon-title">{offer.title}</h3>
                  <span className="coupon-desc">{offer.desc}</span>
                </div>
                
                <div className="coupon-footer">
                  <div className="coupon-terms">
                    <Info size={12} />
                    <span>Single-use code. Applicable online only.</span>
                  </div>
                  <button 
                    className={`coupon-copy-btn ${copiedId === offer.id ? 'copied' : ''}`}
                    onClick={() => handleCopyCode(offer.code, offer.id)}
                  >
                    {copiedId === offer.id ? (
                      <>
                        <Check size={14} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> {offer.code}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* T&C Highlight Section */}
      <div className="offers-tc-block">
        <h4 className="tc-title">Coupon Terms & Conditions</h4>
        <ul className="tc-list">
          <li>Coupons are only valid for online orders processed through the TastyBite AI Assistant.</li>
          <li>Offers cannot be combined with other ongoing restaurant packages or custom discounts.</li>
          <li>Flat discounts are applied to items in the cart before taxes and delivery fees.</li>
          <li>TastyBite reserves the right to modify or terminate deals at any time without notice.</li>
        </ul>
      </div>
    </div>
  );
};

export default OffersSection;
