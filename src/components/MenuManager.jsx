import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  ArrowLeft, 
  Leaf,
  Drumstick,
  Star,
  Package
} from 'lucide-react';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, logActivity } from '../services/apiService';

const categories = [
  'pizza',
  'burger',
  'sandwich',
  'coffee',
  'chicken',
  'desserts',
  'drinks'
];

const MenuManager = ({ onBack }) => {
  const [menuItems, setMenuItems] = useState([]);

  const [form, setForm] = useState({ 
    title: '', 
    category: 'pizza', 
    desc: '', 
    price: '', 
    rating: '', 
    isVeg: true, 
    isAvailable: true, 
    image: '' 
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    async function loadMenu() {
      const data = await getMenuItems();
      if (data && data.length > 0) {
        const formatted = data.map(item => ({
          id: item.id,
          title: item.title,
          category: item.category ? item.category.toLowerCase() : 'pizza',
          desc: item.desc || '',
          price: typeof item.price === 'number' ? `₹${item.price}` : (item.price || '₹0'),
          rating: item.rating ? String(item.rating) : '4.5',
          isVeg: item.isVeg !== undefined ? item.isVeg : true,
          isAvailable: item.available !== undefined ? item.available : true,
          image: item.image || ''
        }));
        setMenuItems(formatted);
      }
    }
    loadMenu();
  }, []);

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveItem = async () => {
    if (!form.title.trim() || !form.category || !form.price.toString().trim()) {
      return;
    }

    const priceNum = parseFloat(form.price.toString().replace(/[^\d.]/g, '')) || 0;
    const apiPayload = {
      title: form.title.trim(),
      category: form.category,
      desc: form.desc.trim(),
      price: priceNum,
      rating: parseFloat(form.rating) || 4.5,
      isVeg: form.isVeg,
      available: form.isAvailable,
      image: form.image.trim()
    };

    if (editingId) {
      try {
        await updateMenuItem(editingId, apiPayload);
        logActivity(`Menu item '${form.title.trim()}' updated`, 'menu');
      } catch (err) {
        console.warn('API update menu error:', err);
      }
      setMenuItems(prev => prev.map(item => item.id === editingId ? {
        ...item,
        title: form.title.trim(),
        category: form.category,
        desc: form.desc.trim(),
        price: `₹${priceNum}`,
        rating: form.rating || '4.5',
        isVeg: form.isVeg,
        isAvailable: form.isAvailable,
        image: form.image.trim()
      } : item));
      setEditingId(null);
    } else {
      let created = null;
      try {
        created = await createMenuItem(apiPayload);
        logActivity(`New menu item '${form.title.trim()}' added`, 'menu');
      } catch (err) {
        console.warn('API create menu error:', err);
      }
      const newItem = {
        id: created?.id || String(Date.now()),
        title: form.title.trim(),
        category: form.category,
        desc: form.desc.trim(),
        price: `₹${priceNum}`,
        rating: form.rating || '4.5',
        isVeg: form.isVeg,
        isAvailable: form.isAvailable,
        image: form.image.trim()
      };
      setMenuItems(prev => [...prev, newItem]);
    }

    setForm({ title: '', category: 'pizza', desc: '', price: '', rating: '', isVeg: true, isAvailable: true, image: '' });
  };

  const toggleAvailability = async (id, available) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, isAvailable: available } : item));
    if (editingId === id) {
      setForm(prev => ({ ...prev, isAvailable: available }));
    }
    try {
      const targetItem = menuItems.find(item => item.id === id);
      if (targetItem) {
        const priceNum = parseFloat(targetItem.price.toString().replace(/[^\d.]/g, '')) || 0;
        await updateMenuItem(id, {
          title: targetItem.title,
          category: targetItem.category,
          desc: targetItem.desc,
          price: priceNum,
          rating: parseFloat(targetItem.rating) || 4.5,
          isVeg: targetItem.isVeg,
          available: available,
          image: targetItem.image
        });
        logActivity(`Item '${targetItem.title}' marked ${available ? 'In Stock' : 'Out of Stock'}`, 'stock');
      }
    } catch (err) {
      console.warn('API update availability error:', err);
    }
  };

  const handleEditItem = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      desc: item.desc,
      price: item.price,
      rating: item.rating,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      image: item.image || ''
    });
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteMenuItem(id);
    } catch (err) {
      console.warn('API delete menu error:', err);
    }
    setMenuItems(prev => prev.filter(item => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm({ title: '', category: 'pizza', desc: '', price: '', rating: '', isVeg: true, isAvailable: true, image: '' });
    }
  };

  return (
    <div className="menu-wrapper">
      <style>{`
        .menu-wrapper {
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --bg-input: #f1f5f9;
          --border-color: #e2e8f0;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --placeholder-color: #94a3b8;
          --accent: #d85e13;
          --accent-hover: #bd4d0a;
          --item-bg: #f8fafc;
          --item-hover-bg: #f1f5f9;
          --shadow-color: rgba(0, 0, 0, 0.05);
        }

        .menu-wrapper.dark-theme,
        [data-theme='dark'] .menu-wrapper {
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
          --item-hover-bg: #22252e;
          --shadow-color: rgba(0, 0, 0, 0.35);
        }

        /* Layout Fixes for Scrolling */
        .menu-wrapper {
          min-height: 100vh;
          height: 100%;
          overflow-y: auto;
          background-color: var(--bg-main) !important;
          color: var(--text-primary) !important;
          padding: 24px 24px 64px 24px;
          box-sizing: border-box;
          transition: background-color 0.2s, color 0.2s;
        }

        .menu-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Header */
        .menu-header {
          background: var(--bg-card);
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
          color: var(--text-primary);
        }

        .header-sub {
          margin: 0 0 4px 0;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--accent);
          letter-spacing: 0.5px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-btn {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
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
          background: var(--border-color);
          transform: translateY(-1px);
        }

        /* Grid System */
        .menu-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .menu-grid {
            grid-template-columns: 1fr;
          }

          .items-list-card {
            max-height: 580px;
          }
        }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 20px;
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
          color: var(--text-primary);
        }

        /* Form Controls */
        .form-group {
          margin-bottom: 14px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }

        .form-input, .form-select, .form-textarea {
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

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: var(--accent);
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: var(--placeholder-color) !important;
          opacity: 1;
        }

        .form-select option {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        /* Custom Radio/Buttons */
        .toggle-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          background: var(--bg-input);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }

        .toggle-btn {
          border: 1px solid transparent;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .toggle-btn:hover:not(.active-veg):not(.active-nonveg):not(.active-stock):not(.active-out) {
          color: var(--text-primary);
        }

        .toggle-btn.active-veg { background: #10b981; color: #ffffff; border-color: #10b981; }
        .toggle-btn.active-nonveg { background: #f43f5e; color: #ffffff; border-color: #f43f5e; }
        .toggle-btn.active-stock { background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4); }
        .toggle-btn.active-out { background: rgba(244, 63, 94, 0.2); color: #fb7185; border-color: rgba(244, 63, 94, 0.4); }

        .submit-btn {
          width: 100%;
          background: var(--accent);
          color: #ffffff;
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
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        /* Fixed Scrolling Area for Item List */
        .items-list-card {
          display: flex;
          flex-direction: column;
          max-height: 750px;
          min-height: 0;
          box-sizing: border-box;
        }

        .items-list-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 2px 6px 24px 2px;
          box-sizing: border-box;
        }

        .items-list-scroll::after {
          content: '';
          display: block;
          height: 16px;
          min-height: 16px;
          flex-shrink: 0;
        }

        /* Styled Scrollbar */
        .items-list-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .items-list-scroll::-webkit-scrollbar-track {
          background: var(--bg-input);
          border-radius: 4px;
        }
        .items-list-scroll::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 4px;
        }

        .item-card {
          background: var(--item-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-shrink: 0;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .item-card:hover {
          background: var(--item-hover-bg);
        }

        .item-card.is-unavailable {
          opacity: 0.65;
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .item-img {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          object-fit: cover;
          background: var(--bg-input);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .item-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .badge-veg { 
          background: rgba(16, 185, 129, 0.15); 
          color: #10b981; 
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .badge-nonveg { 
          background: rgba(244, 63, 94, 0.15); 
          color: #f43f5e; 
          border: 1px solid rgba(244, 63, 94, 0.3);
        }
        .badge-stock-out {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .dark-theme .badge-veg,
        [data-theme='dark'] .badge-veg { 
          background: rgba(16, 185, 129, 0.25); 
          color: #34d399; 
        }
        .dark-theme .badge-nonveg,
        [data-theme='dark'] .badge-nonveg { 
          background: rgba(244, 63, 94, 0.25); 
          color: #fb7185; 
        }
        .dark-theme .badge-stock-out,
        [data-theme='dark'] .badge-stock-out { 
          background: rgba(239, 68, 68, 0.25); 
          color: #f87171; 
        }

        .item-meta {
          font-size: 12px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .item-price {
          color: var(--text-primary);
          font-weight: 700;
        }

        .item-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .badge-count {
          background: var(--bg-input);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 20px;
        }

        @media (max-width: 600px) {
          .menu-wrapper {
            padding: 14px 10px 60px 10px;
          }

          .menu-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .items-list-card {
            max-height: 520px;
          }

          .items-list-scroll {
            padding: 2px 4px 32px 2px;
          }

          .item-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .item-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>

      <div className="menu-container">
        {/* Header */}
        <div className="menu-header">
          <div>
            <p className="header-sub">Admin Dashboard</p>
            <h1 className="header-title">Menu Management</h1>
          </div>

          <div className="header-actions">

            {onBack && (
              <button className="icon-btn" onClick={onBack}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </div>
        </div>

        {/* Content Layout */}
        <div className="menu-grid">
          {/* Form Side */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{editingId ? 'Edit Item' : 'Create New Item'}</h2>
            </div>

            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                className="form-input"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="e.g. Italian Pizza"
              />
            </div>

            <div className="form-row form-group">
              <div>
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={form.category} 
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Price</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.price}
                  onChange={(e) => handleFormChange('price', e.target.value)}
                  placeholder="e.g. ₹299"
                />
              </div>
            </div>

            <div className="form-row form-group">
              <div>
                <label className="form-label">Rating</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.rating}
                  onChange={(e) => handleFormChange('rating', e.target.value)}
                  placeholder="e.g. 4.5"
                />
              </div>

              <div>
                <label className="form-label">Dietary Type</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${form.isVeg ? 'active-veg' : ''}`}
                    onClick={() => handleFormChange('isVeg', true)}
                  >
                    <Leaf size={12} /> Veg
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${!form.isVeg ? 'active-nonveg' : ''}`}
                    onClick={() => handleFormChange('isVeg', false)}
                  >
                    <Drumstick size={12} /> Non-Veg
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Stock Status</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${form.isAvailable ? 'active-stock' : ''}`}
                  onClick={() => handleFormChange('isAvailable', true)}
                >
                  In Stock
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${!form.isAvailable ? 'active-out' : ''}`}
                  onClick={() => handleFormChange('isAvailable', false)}
                >
                  Out of Stock
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="text"
                className="form-input"
                value={form.image}
                onChange={(e) => handleFormChange('image', e.target.value)}
                placeholder="e.g. https://..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                className="form-textarea"
                value={form.desc}
                onChange={(e) => handleFormChange('desc', e.target.value)}
                placeholder="Short description..."
              />
            </div>

            <button className="submit-btn" onClick={handleSaveItem}>
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
          </div>

          {/* List Side with Active Overflow Scroll */}
          <div className="card items-list-card">
            <div className="card-header">
              <h2 className="card-title">Menu Items</h2>
              <span className="badge-count">{menuItems.length} items</span>
            </div>

            <div className="items-list-scroll">
              {menuItems.map(item => (
                <div className={`item-card ${!item.isAvailable ? 'is-unavailable' : ''}`} key={item.id}>
                  <div className="item-info">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="item-img" />
                    ) : (
                      <div className="item-img"><Package size={20} /></div>
                    )}
                    <div>
                      <h4 className="item-title">
                        {item.title}
                        <span className={`badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                        {!item.isAvailable && (
                          <span className="badge badge-stock-out">Out of Stock</span>
                        )}
                      </h4>
                      <div className="item-meta">
                        <span style={{ textTransform: 'capitalize' }}>{item.category}</span>
                        <span>•</span>
                        <strong className="item-price">{item.price}</strong>
                        <span>•</span>
                        <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Star size={12} fill="#f59e0b" /> {item.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="item-actions">
                    <button className="icon-btn" onClick={() => handleEditItem(item)} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDeleteItem(item.id)} title="Delete" style={{ color: '#f43f5e' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {menuItems.length > 0 && (
                <div style={{ height: '20px', flexShrink: 0 }} aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManager;