import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Star, 
  Sparkles, 
  Plus, 
  Leaf, 
  Drumstick, 
  X, 
  Check, 
  Loader2, 
  ShoppingBag,
  Info
} from 'lucide-react';
import { getMenuItems, createMenuItem, logActivity } from '../services/apiService';
import './MenuSection.css';

const MenuSection = ({ setActiveTab, handleSendMessage }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Dish Modal & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'pizza',
    desc: '',
    price: '',
    rating: '4.5',
    isVeg: true,
    available: true,
    image: ''
  });

  const categories = [
    { id: 'all', label: 'All Dishes', icon: '🍽️' },
    { id: 'pizza', label: 'Pizza', icon: '🍕' },
    { id: 'burger', label: 'Burger', icon: '🍔' },
    { id: 'sandwich', label: 'Sandwich', icon: '🥪' },
    { id: 'coffee', label: 'Coffee', icon: '☕' },
    { id: 'chicken', label: 'Chicken', icon: '🍗' },
    { id: 'desserts', label: 'Desserts', icon: '🍰' },
    { id: 'drinks', label: 'Drinks', icon: '🥤' }
  ];

  const fetchMenuFromDatabase = async () => {
    setLoading(true);
    try {
      const data = await getMenuItems();
      if (data && Array.isArray(data)) {
        const formatted = data.map((item, idx) => {
          const text = ((item.title || '') + ' ' + (item.category || '')).toLowerCase();
          const isNonVegKeyword = text.includes('chicken') || text.includes('mutton') || text.includes('meat') || text.includes('egg') || text.includes('fish') || text.includes('prawn') || text.includes('pepperoni') || text.includes('bacon');
          const itemIsVeg = item.isVeg !== undefined && item.isVeg !== null ? Boolean(item.isVeg) : !isNonVegKeyword;
          const itemAvailable = item.available !== undefined && item.available !== null 
            ? Boolean(item.available) 
            : (item.isAvailable !== undefined && item.isAvailable !== null ? Boolean(item.isAvailable) : true);

          return {
            id: item.id || `menu-${idx}`,
            title: item.title || 'Untitled Item',
            desc: item.desc || '',
            price: typeof item.price === 'number' ? `₹${item.price}` : (item.price || '₹0'),
            rawPrice: typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0,
            rating: item.rating ? String(item.rating) : '4.5',
            image: item.image && item.image.trim() !== '' ? item.image : '/margherita_pizza.png',
            isVeg: itemIsVeg,
            available: itemAvailable,
            category: item.category ? item.category.toLowerCase() : 'pizza'
          };
        });
        setMenuItems(formatted);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.warn('Failed to fetch menu items from database:', err);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuFromDatabase();
  }, []);

  const handleAskAI = (itemName) => {
    if (setActiveTab && handleSendMessage) {
      setActiveTab('new-chat');
      handleSendMessage(`Tell me details about the ${itemName}`);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.title.trim()) {
      setErrorMsg('Please enter a dish name.');
      return;
    }
    if (!form.price.toString().trim()) {
      setErrorMsg('Please enter a valid price.');
      return;
    }

    const priceNum = parseFloat(form.price.toString().replace(/[^\d.]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a positive numeric price.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: form.title.trim(),
      category: form.category.toLowerCase(),
      desc: form.desc.trim(),
      price: priceNum,
      rating: parseFloat(form.rating) || 4.5,
      isVeg: form.isVeg,
      available: form.available,
      image: form.image.trim() || '/margherita_pizza.png'
    };

    try {
      await createMenuItem(payload);
      logActivity(`User added new menu item '${form.title.trim()}'`, 'menu');
      setSubmitSuccess(true);
      setTimeout(async () => {
        setSubmitSuccess(false);
        setIsAddModalOpen(false);
        setForm({
          title: '',
          category: 'pizza',
          desc: '',
          price: '',
          rating: '4.5',
          isVeg: true,
          available: true,
          image: ''
        });
        await fetchMenuFromDatabase();
      }, 1000);
    } catch (err) {
      console.error('Failed to create menu item:', err);
      setErrorMsg(err.message || 'Failed to save item to database. Please check your backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter by category and search query
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="menu-page-container">
      {/* Page Header */}
      <div className="menu-page-header">
        <div className="header-info">
          <div className="header-title-badge">
            <h1 className="menu-page-title">Explore Our Menu</h1>
            <span className="db-live-badge">
              <span className="pulse-dot"></span> Live
            </span>
          </div>
          <p className="menu-page-subtitle">
            All dishes are fetched dynamically from the database. You can also directly add new food items below!
          </p>
        </div>

        <div className="header-actions-group">
          <div className="menu-search-bar">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search dishes, ingredients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* <button 
            className="add-food-btn"
            onClick={() => {
              setErrorMsg('');
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Food Item</span> */}
          {/* </button> */}
        </div>
      </div>

      {/* Category Pills Panel */}
      <div className="menu-category-panel">
        <div className="menu-category-header">
          <div>
            <h3>Categories</h3>
            <p>Filter dishes instantly by selecting a category below</p>
          </div>
        </div>

        <div className="menu-categories-wrapper">
          <div className="categories-list">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="menu-loading-spinner">
          <div className="spinner"></div>
          <span>Fetching menu items directly from database...</span>
        </div>
      ) : (
        <div className="menu-dishes-grid">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div key={item.id} className="menu-dish-card">
                <div className="dish-img-container">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="dish-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/margherita_pizza.png';
                    }}
                  />
                  <div className={`dish-badge ${item.isVeg ? 'veg' : 'non-veg'}`}>
                    <span className="badge-dot"></span>
                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                  </div>
                  <div className={`stock-badge ${item.available ? 'in-stock' : 'out-of-stock'}`}>
                    <span className="badge-dot"></span>
                    {item.available ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                <div className="dish-info-content">
                  <div className="dish-header-title">
                    <h4 className="dish-title">{item.title}</h4>
                    <span className="dish-price">{item.price}</span>
                  </div>
                  <p className="dish-description">{item.desc || 'No description provided.'}</p>
                  
                  <div className="dish-footer-row">
                    <div className="dish-rating">
                      <Star size={14} className="star-filled" />
                      <span>{item.rating}</span>
                    </div>
                    
                    <div className="dish-action-buttons">
                      <button 
                        className="dish-ask-ai-btn"
                        onClick={() => handleAskAI(item.title)}
                        title="Ask AI chatbot about ingredients or customization"
                      >
                        <Sparkles size={13} />
                        Ask AI
                      </button>
                      <button 
                        className="dish-order-now-btn"
                        onClick={() => setActiveTab && setActiveTab('place-order')}
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-items-found">
              <ShoppingBag size={48} className="empty-icon" />
              <h3>No menu items found</h3>
              <p>No dishes match your selection. Click "Add Food Item" above to add new items to the database!</p>
            </div>
          )}
        </div>
      )}

      {/* Add Food Item Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsAddModalOpen(false)}>
          <div className="add-food-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h2>Add New Food Item</h2>
                <p>Item will be stored in database and rendered automatically across the menu.</p>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="modal-error-alert">
                <Info size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {submitSuccess ? (
              <div className="modal-success-state">
                <div className="success-icon-circle">
                  <Check size={32} />
                </div>
                <h3>Food Item Added!</h3>
                <p>Updating database menu listings...</p>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="add-food-form">
                <div className="form-group">
                  <label>Food Item Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Deluxe Paneer Wrap" 
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      value={form.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                    >
                      {categories.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="e.g. 249" 
                      value={form.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Dietary Type</label>
                    <div className="diet-toggle-group">
                      <button
                        type="button"
                        className={`diet-btn ${form.isVeg ? 'active-veg' : ''}`}
                        onClick={() => handleFormChange('isVeg', true)}
                      >
                        <Leaf size={14} /> Veg
                      </button>
                      <button
                        type="button"
                        className={`diet-btn ${!form.isVeg ? 'active-nonveg' : ''}`}
                        onClick={() => handleFormChange('isVeg', false)}
                      >
                        <Drumstick size={14} /> Non-Veg
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Availability</label>
                    <div className="diet-toggle-group">
                      <button
                        type="button"
                        className={`diet-btn ${form.available ? 'active-avail' : ''}`}
                        onClick={() => handleFormChange('available', true)}
                      >
                        In Stock
                      </button>
                      <button
                        type="button"
                        className={`diet-btn ${!form.available ? 'active-out' : ''}`}
                        onClick={() => handleFormChange('available', false)}
                      >
                        Out of Stock
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. https://images.unsplash.com/... or /veg_supreme_pizza.png" 
                    value={form.image}
                    onChange={(e) => handleFormChange('image', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Briefly describe the key ingredients, taste, or serving size..."
                    value={form.desc}
                    onChange={(e) => handleFormChange('desc', e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="spin-icon" />
                        Saving to Database...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Save Dish to Database
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuSection;
