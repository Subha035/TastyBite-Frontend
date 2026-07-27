import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  ArrowLeft, 
  Moon, 
  Sun, 
  Tag, 
  Ticket, 
  ShoppingBag, 
  Percent,
  Sparkles
} from 'lucide-react';
import { getOffers, createOffer, updateOffer, deleteOffer, logActivity } from '../services/apiService';

const initialCoupons = [
  { id: '1', code: 'SAVE20', discount: '20%', minCart: '₹499', description: '20% off on orders above ₹499' },
  { id: '2', code: 'FREEGB', discount: 'Free Item', minCart: '₹699', description: 'Free Garlic Bread on orders above ₹699' }
];

const OffersManager = ({ onBack }) => {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', minCart: '', maxDiscount: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    async function loadOffers() {
      const data = await getOffers();
      if (data && data.length > 0) {
        const formatted = data.map(o => ({
          id: o.id,
          code: o.code,
          discount: o.discountPercent ? `${o.discountPercent}%` : 'Special Discount',
          minCart: o.minOrder ? `₹${o.minOrder}` : '₹0',
          maxDiscount: o.maxDiscount !== undefined && o.maxDiscount !== null ? `₹${o.maxDiscount}` : 'Unlimited',
          rawMaxDiscount: o.maxDiscount,
          description: o.desc || o.title || ''
        }));
        setCoupons(formatted);
      }
    }
    loadOffers();
  }, []);

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCoupon = async () => {
    if (!form.code.trim() || !form.discount.trim() || !form.minCart.trim()) {
      return;
    }

    const discountNum = parseFloat(form.discount.replace(/[^\d.]/g, '')) || 10;
    const minOrderNum = parseFloat(form.minCart.replace(/[^\d.]/g, '')) || 0;
    
    // Parse maxDiscount: if left empty or "0" or "unlimited", store as null (unlimited use)
    let maxCapNum = null;
    if (form.maxDiscount && form.maxDiscount.trim() !== '') {
      const parsedCap = parseFloat(form.maxDiscount.replace(/[^\d.]/g, ''));
      if (!isNaN(parsedCap) && parsedCap > 0) {
        maxCapNum = parsedCap;
      }
    }

    const offerPayload = {
      title: form.description.trim() || `${form.code} Coupon`,
      code: form.code.trim().toUpperCase(),
      discountPercent: discountNum,
      minOrder: minOrderNum,
      maxDiscount: maxCapNum,
      desc: form.description.trim(),
      active: true
    };

    if (editingId) {
      try {
        await updateOffer(editingId, offerPayload);
      } catch (err) {
        console.warn('API update offer error:', err);
      }
      setCoupons(prev => prev.map(coupon => coupon.id === editingId ? {
        id: editingId,
        code: form.code.trim().toUpperCase(),
        discount: form.discount.trim(),
        minCart: form.minCart.trim(),
        maxDiscount: maxCapNum ? `₹${maxCapNum}` : 'Unlimited',
        rawMaxDiscount: maxCapNum,
        description: form.description.trim()
      } : coupon));
      setEditingId(null);
    } else {
      let created = null;
      try {
        created = await createOffer(offerPayload);
      } catch (err) {
        console.warn('API create offer error:', err);
      }
      const newCoupon = {
        id: created?.id || String(Date.now()),
        code: form.code.trim().toUpperCase(),
        discount: form.discount.trim(),
        minCart: form.minCart.trim(),
        maxDiscount: maxCapNum ? `₹${maxCapNum}` : 'Unlimited',
        rawMaxDiscount: maxCapNum,
        description: form.description.trim()
      };
      setCoupons(prev => [...prev, newCoupon]);
    }

    const codeName = form.code.trim().toUpperCase();
    logActivity(`Offer coupon '${codeName}' ${editingId ? 'updated' : 'created'}`, 'coupon');
    setForm({ code: '', discount: '', minCart: '', maxDiscount: '', description: '' });
    window.dispatchEvent(new CustomEvent('offersUpdated'));
  };

  const handleEditCoupon = (coupon) => {
    setEditingId(coupon.id);
    setForm({ 
      code: coupon.code, 
      discount: coupon.discount, 
      minCart: coupon.minCart, 
      maxDiscount: coupon.rawMaxDiscount ? String(coupon.rawMaxDiscount) : '',
      description: coupon.description 
    });
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await deleteOffer(id);
      logActivity(`Offer coupon removed from database`, 'coupon');
    } catch (err) {
      console.warn('API delete offer error:', err);
    }
    setCoupons(prev => prev.filter(coupon => coupon.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm({ code: '', discount: '', minCart: '', description: '' });
    }
    window.dispatchEvent(new CustomEvent('offersUpdated'));
  };

  return (
    <div className={`offers-wrapper ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <style>{`
        /* Dynamic CSS Theme Variables */
        .offers-wrapper.light-theme {
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --bg-input: #f1f5f9;
          --border-color: #e2e8f0;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --placeholder-color: #94a3b8;
          --accent: #e11d48;
          --accent-hover: #be123c;
          --item-bg: #f8fafc;
          --badge-bg: #ffe4e6;
          --badge-text: #e11d48;
        }

        .offers-wrapper.dark-theme {
          --bg-main: #0b0f19;
          --bg-card: #151e32;
          --bg-input: #1e293b;
          --border-color: #334155;
          --text-primary: #f8fafc;
          --text-secondary: #cbd5e1;
          --placeholder-color: #64748b;
          --accent: #f43f5e;
          --accent-hover: #e11d48;
          --item-bg: #1e293b;
          --badge-bg: #88133750;
          --badge-text: #fda4af;
        }

        /* Container Layout */
        .offers-wrapper {
          min-height: 100vh;
          height: 100%;
          overflow-y: auto;
          background-color: var(--bg-main) !important;
          color: var(--text-primary) !important;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          transition: background-color 0.2s, color 0.2s;
        }

        .offers-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Header UI */
        .offers-header {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-color);
          padding: 20px 24px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary) !important;
        }

        .header-sub {
          margin: 0 0 4px 0;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--accent) !important;
          letter-spacing: 0.5px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-btn {
          background: var(--bg-input) !important;
          border: 1px solid var(--border-color);
          color: var(--text-primary) !important;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .icon-btn:hover {
          opacity: 0.85;
        }

        /* Grid */
        .offers-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .offers-grid {
            grid-template-columns: 1fr;
          }
        }

        .card {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 20px;
          color: var(--text-primary) !important;
        }

        .card-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary) !important;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Form Inputs Explicit Dark Colors */
        .form-group {
          margin-bottom: 14px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary) !important;
          margin-bottom: 6px;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-input) !important;
          color: var(--text-primary) !important;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: var(--placeholder-color) !important;
          opacity: 1;
        }

        .form-input.code-input {
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .form-input:focus, .form-textarea:focus {
          border-color: var(--accent);
        }

        .submit-btn {
          width: 100%;
          background: var(--accent) !important;
          color: #ffffff !important;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }

        /* Scroll Area */
        .coupons-list-card {
          display: flex;
          flex-direction: column;
          max-height: 650px;
        }

        .coupons-list-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 6px;
        }

        /* Coupon Card Details */
        .coupon-card {
          background: var(--item-bg) !important;
          border: 1px dashed var(--border-color);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-shrink: 0;
        }

        .coupon-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .coupon-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: var(--badge-bg) !important;
          color: var(--badge-text) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .coupon-code-badge {
          font-size: 15px;
          font-weight: 700;
          color: var(--accent) !important;
          letter-spacing: 0.5px;
          margin: 0 0 4px 0;
        }

        .coupon-meta {
          font-size: 12px;
          color: var(--text-secondary) !important;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .coupon-desc {
          font-size: 12px;
          color: var(--text-primary) !important;
          margin: 0;
        }

        .badge-count {
          background: var(--bg-input) !important;
          color: var(--text-secondary) !important;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 20px;
        }

        .action-btns {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      <div className="offers-container">
        {/* Header */}
        <div className="offers-header">
          <div>
            <p className="header-sub">Offers Manager</p>
            <h1 className="header-title">Manage Offers & Coupons</h1>
          </div>

          <div className="header-actions">
            <button className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            {onBack && (
              <button className="icon-btn" onClick={onBack}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="offers-grid">
          {/* Form Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Sparkles size={18} color="var(--accent)" />
                {editingId ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
            </div>

            <div className="form-group">
              <label className="form-label">Coupon Code</label>
              <input
                type="text"
                className="form-input code-input"
                value={form.code}
                onChange={(e) => handleFormChange('code', e.target.value)}
                placeholder="e.g. TASTY10"
              />
            </div>

            <div className="form-row form-group">
              <div>
                <label className="form-label">Discount Value</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.discount}
                  onChange={(e) => handleFormChange('discount', e.target.value)}
                  placeholder="e.g. 15%"
                />
              </div>

              <div>
                <label className="form-label">Minimum Cart</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.minCart}
                  onChange={(e) => handleFormChange('minCart', e.target.value)}
                  placeholder="e.g. ₹499"
                />
              </div>

              <div>
                <label className="form-label">Max Discount Cap</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.maxDiscount}
                  onChange={(e) => handleFormChange('maxDiscount', e.target.value)}
                  placeholder="e.g. ₹100 (Blank = Unlimited)"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Details</label>
              <textarea
                rows={3}
                className="form-textarea"
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Short coupon description for users..."
              />
            </div>

            <button className="submit-btn" onClick={handleSaveCoupon}>
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {editingId ? 'Update Coupon' : 'Add Coupon'}
            </button>
          </div>

          {/* Coupons List Card */}
          <div className="card coupons-list-card">
            <div className="card-header">
              <h2 className="card-title">
                <Tag size={18} color="var(--accent)" />
                Active Coupons
              </h2>
              <span className="badge-count">{coupons.length} active</span>
            </div>

            <div className="coupons-list-scroll">
              {coupons.map((coupon) => (
                <div className="coupon-card" key={coupon.id}>
                  <div className="coupon-info">
                    <div className="coupon-icon-box">
                      <Ticket size={20} />
                    </div>
                    <div>
                      <h4 className="coupon-code-badge">{coupon.code}</h4>
                      <div className="coupon-meta">
                        <span style={{ display: 'flex', items: 'center', gap: '3px', fontWeight: 600 }}>
                          <Percent size={12} /> {coupon.discount}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', items: 'center', gap: '3px' }}>
                          <ShoppingBag size={12} /> Min cart {coupon.minCart}
                        </span>
                        <span>•</span>
                        <span style={{ color: coupon.maxDiscount === 'Unlimited' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                          Max cap: {coupon.maxDiscount || 'Unlimited'}
                        </span>
                      </div>
                      <p className="coupon-desc">{coupon.description}</p>
                    </div>
                  </div>

                  <div className="action-btns">
                    <button className="icon-btn" onClick={() => handleEditCoupon(coupon)} title="Edit coupon">
                      <Edit2 size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDeleteCoupon(coupon.id)} title="Delete coupon" style={{ color: '#f43f5e' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersManager;