import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  ArrowLeft, 
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
    <div className="offers-wrapper">
      <style>{`
        /* Dynamic CSS Theme Variables */
        .offers-wrapper {
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --bg-input: #f1f5f9;
          --border-color: #e2e8f0;
          --text-primary: #0f172a;
          --text-secondary: #5e6670;
          --placeholder-color: #94a3b8;
          --accent: #d85e13;
          --accent-hover: #bd4d0a;
          --item-bg: #f8fafc;
          --badge-bg: rgba(216, 94, 19, 0.12);
          --badge-text: #d85e13;
          --shadow-color: rgba(0, 0, 0, 0.05);
        }

        .offers-wrapper.dark-theme,
        [data-theme='dark'] .offers-wrapper {
          --bg-main: #121318;
          --bg-card: #1b1d24;
          --bg-input: #22252e;
          --border-color: #2c303b;
          --text-primary: #f5f6f7;
          --text-secondary: #abb1bb;
          --placeholder-color: #6b7280;
          --accent: #d85e13;
          --accent-hover: #bd4d0a;
          --item-bg: #17181f;
          --badge-bg: rgba(216, 94, 19, 0.25);
          --badge-text: #ff9d5c;
          --shadow-color: rgba(0, 0, 0, 0.35);
        }

        /* Container Layout */
        .offers-wrapper {
          min-height: 100vh;
          height: 100%;
          overflow-y: auto;
          background-color: var(--bg-main) !important;
          color: var(--text-primary) !important;
          padding: 24px 24px 64px 24px;
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
          box-shadow: 0 2px 8px var(--shadow-color);
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
          transition: background-color 0.2s, border-color 0.2s, transform 0.15s;
        }

        .icon-btn:hover {
          background: var(--border-color) !important;
          transform: translateY(-1px);
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

          .coupons-list-card {
            max-height: 580px;
          }
        }

        .card {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 20px;
          color: var(--text-primary) !important;
          box-shadow: 0 2px 8px var(--shadow-color);
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .form-row > div {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary) !important;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
          min-height: 16px;
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
          transition: border-color 0.2s, background-color 0.2s;
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
          transition: background-color 0.2s, transform 0.15s;
        }

        .submit-btn:hover {
          background: var(--accent-hover) !important;
          transform: translateY(-1px);
        }

        /* Scroll Area */
        .coupons-list-card {
          display: flex;
          flex-direction: column;
          max-height: 650px;
          min-height: 0;
          box-sizing: border-box;
        }

        .coupons-list-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 2px 6px 24px 2px;
          box-sizing: border-box;
        }

        .coupons-list-scroll::after {
          content: '';
          display: block;
          height: 16px;
          min-height: 16px;
          flex-shrink: 0;
        }

        .coupons-list-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .coupons-list-scroll::-webkit-scrollbar-track {
          background: var(--bg-input);
          border-radius: 4px;
        }
        .coupons-list-scroll::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 4px;
        }

        /* Coupon Card Details */
        .coupon-card {
          background: var(--item-bg) !important;
          border: 1px dashed var(--border-color);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-shrink: 0;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .coupon-card:hover {
          border-color: var(--accent);
        }

        .coupon-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
          min-width: 0;
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
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin: 6px 0;
        }

        .coupon-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .coupon-pill.discount-pill {
          color: var(--accent);
          background: var(--badge-bg);
          border-color: rgba(216, 94, 19, 0.25);
        }

        .coupon-pill.cap-pill {
          color: #10b981;
        }

        [data-theme='dark'] .coupon-pill.cap-pill,
        .dark-theme .coupon-pill.cap-pill {
          color: #34d399;
        }

        .coupon-desc {
          font-size: 12px;
          color: var(--text-secondary) !important;
          margin: 0;
          line-height: 1.4;
        }

        .badge-count {
          background: var(--bg-input) !important;
          color: var(--text-secondary) !important;
          border: 1px solid var(--border-color);
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 20px;
        }

        .action-btns {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 640px) {
          .offers-wrapper {
            padding: 14px 10px 60px 10px;
          }

          .offers-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .coupons-list-card {
            max-height: 520px;
          }

          .coupons-list-scroll {
            padding: 2px 4px 32px 2px;
          }

          .coupon-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .action-btns {
            width: 100%;
            justify-content: flex-end;
          }
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

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button className="submit-btn" onClick={handleSaveCoupon} style={{ flex: 1, marginTop: 0 }}>
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {editingId ? 'Update Coupon' : 'Add Coupon'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  className="icon-btn" 
                  onClick={() => {
                    setEditingId(null);
                    setForm({ code: '', discount: '', minCart: '', maxDiscount: '', description: '' });
                  }}
                  style={{ padding: '0 16px' }}
                >
                  Cancel
                </button>
              )}
            </div>
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="coupon-code-badge">{coupon.code}</h4>
                      <div className="coupon-meta">
                        <span className="coupon-pill discount-pill">
                          <Percent size={11} /> {coupon.discount.includes('%') ? coupon.discount : `${coupon.discount}%`}
                        </span>
                        <span className="coupon-pill cart-pill">
                          <ShoppingBag size={11} /> Min {coupon.minCart.startsWith('₹') ? coupon.minCart : `₹${coupon.minCart}`}
                        </span>
                        <span className="coupon-pill cap-pill">
                          Max {coupon.maxDiscount || 'Unlimited'}
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
              {coupons.length > 0 && (
                <div style={{ height: '20px', flexShrink: 0 }} aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersManager;