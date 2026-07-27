import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getMenuItems, getOffers, createOrder, logActivity } from '../services/apiService';
import { ShoppingBag, ArrowLeft, CheckCircle2, Clock, MapPin, Sparkles, Utensils, Tag, Check, X, Bike, Search, Star } from 'lucide-react';

const PlaceOrder = ({ onBack, preSelectedDish }) => {
  // --- UI & Zomato Mode State ---
  const [orderMode, setOrderMode] = useState('dinein'); // 'dinein', 'delivery', 'takeaway'
  const [searchQuery, setSearchQuery] = useState('');

  // --- UI & Database Menu State ---
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState({});
  
  // Ref to prevent double-adding during React Strict Mode re-renders
  const addedDishRef = useRef(null);

  // Pre-select dish from Chat if passed
  useEffect(() => {
    if (preSelectedDish && menuItems.length > 0 && addedDishRef.current !== preSelectedDish) {
      const match = menuItems.find(item => 
        (item.name && preSelectedDish.title && item.name.toLowerCase() === preSelectedDish.title.toLowerCase()) ||
        item.id === preSelectedDish.id
      );
      if (match) {
        addedDishRef.current = preSelectedDish;
        setCart(prev => ({ ...prev, [match.id]: 1 }));
      }
    }
  }, [preSelectedDish, menuItems]);
  
  // Database Offers State & Coupon Application
  const [dbOffers, setDbOffers] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponMessage, setCouponMessage] = useState({ text: '', isError: false });
  const [showAllCoupons, setShowAllCoupons] = useState(false);

  // Checkout Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [table, setTable] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // --- Feedback & Validation States ---
  const [phoneError, setPhoneError] = useState({ text: '', type: '' });
  const [tableError, setTableError] = useState({ text: '', type: '' });
  const [statusMessage, setStatusMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  // --- Modal Confirmation State ---
  const [modal, setModal] = useState({
    isOpen: false,
    heading: '⏳ Order Pending',
    headingColor: 'var(--accent-gold, #f59e0b)',
    sequence: '-',
    orderId: '-',
    totalPaid: '₹0',
    qrUrl: ''
  });

  const phoneTimeoutRef = useRef(null);

  // Fetch database offers
  useEffect(() => {
    async function loadOffers() {
      try {
        const data = await getOffers();
        if (data && Array.isArray(data)) {
          setDbOffers(data);
        }
      } catch (err) {
        console.warn('Failed to load database offers:', err);
      }
    }
    loadOffers();
  }, []);

  // Fetch live menu items directly from backend database
  useEffect(() => {
    async function loadDatabaseMenu() {
      setLoadingMenu(true);
      try {
        const data = await getMenuItems();
        if (data && Array.isArray(data)) {
          const formatted = data.map((item, idx) => ({
            id: item.id || `item-${idx}`,
            name: item.title || 'Untitled Dish',
            description: item.desc || 'Freshly prepared item from database.',
            price: typeof item.price === 'number' ? item.price : (parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0),
            category: item.category ? item.category.toLowerCase() : 'pizza',
            isVeg: item.isVeg !== undefined ? Boolean(item.isVeg) : true,
            available: item.available !== undefined ? Boolean(item.available) : (item.isAvailable !== undefined ? Boolean(item.isAvailable) : true),
            image: item.image && item.image.trim() !== '' ? item.image : '/margherita_pizza.png'
          }));
          setMenuItems(formatted);
        } else {
          setMenuItems([]);
        }
      } catch (err) {
        console.warn('Failed to load menu for order page:', err);
        setMenuItems([]);
      } finally {
        setLoadingMenu(false);
      }
    }
    loadDatabaseMenu();
  }, []);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'pizza', label: 'Pizza' },
    { id: 'burger', label: 'Burger' },
    { id: 'sandwich', label: 'Sandwich' },
    { id: 'coffee', label: 'Coffee' },
    { id: 'chicken', label: 'Chicken' },
    { id: 'desserts', label: 'Desserts' },
    { id: 'drinks', label: 'Drinks' }
  ];

  // Dynamic Filtering by Category & Search Query
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, menuItems]);

  // Cart Subtotal, Discount & Taxes Calculation
  const totals = useMemo(() => {
    const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menuItems.find(entry => entry.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);

    let discount = 0;
    if (appliedOffer && subtotal > 0) {
      const minRequired = appliedOffer.minOrder || appliedOffer.minCart || 0;
      if (subtotal >= minRequired) {
        const pct = appliedOffer.discountPercent || appliedOffer.discount || 0;
        if (pct > 0) {
          // Calculate percentage discount
          discount = Math.round((subtotal * pct) / 100);
          // Apply maximum cap if specified
          const maxCap = appliedOffer.maxDiscount;
          if (maxCap && maxCap > 0 && discount > maxCap) {
            discount = maxCap;
          }
        }
      }
    }
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const taxes = Math.round(discountedSubtotal * 0.05);
    return { subtotal, discount, taxes, total: discountedSubtotal + taxes };
  }, [cart, menuItems, appliedOffer]);

  // Calculate Best Suitable Coupon based on highest discount savings for current subtotal
  const bestCoupon = useMemo(() => {
    if (!dbOffers || dbOffers.length === 0) return null;

    let best = null;
    let maxSavings = -1;

    dbOffers.forEach((offer) => {
      if (offer.active === false) return;
      const minRequired = offer.minOrder || offer.minCart || 0;
      const isApplicable = totals.subtotal >= minRequired;
      const pct = offer.discountPercent || offer.discount || 0;
      
      let savings = 0;
      if (isApplicable && totals.subtotal > 0 && pct > 0) {
        savings = Math.round((totals.subtotal * pct) / 100);
        if (offer.maxDiscount && offer.maxDiscount > 0 && savings > offer.maxDiscount) {
          savings = offer.maxDiscount;
        }
      } else if (pct > 0) {
        // Fallback rank by percentage if cart is 0
        savings = pct;
      }

      if (savings > maxSavings) {
        maxSavings = savings;
        best = offer;
      }
    });

    return best || dbOffers[0];
  }, [dbOffers, totals.subtotal]);

  // Determine coupons to display (Either Best single coupon or All coupons)
  const displayedOffers = useMemo(() => {
    if (showAllCoupons) return dbOffers;
    return bestCoupon ? [bestCoupon] : [];
  }, [dbOffers, bestCoupon, showAllCoupons]);

  // Apply Coupon Handler
  const handleApplyCoupon = (e) => {
    if (e) e.preventDefault();
    setCouponMessage({ text: '', isError: false });

    if (!couponCode.trim()) {
      setCouponMessage({ text: 'Please enter a coupon code.', isError: true });
      return;
    }

    if (totals.subtotal === 0) {
      setCouponMessage({ text: 'Add items to cart before applying coupon.', isError: true });
      return;
    }

    const codeUpper = couponCode.trim().toUpperCase();
    const matched = dbOffers.find(o => (o.code || '').toUpperCase() === codeUpper && (o.active !== false));

    if (!matched) {
      setCouponMessage({ text: `Invalid or expired coupon code '${codeUpper}'.`, isError: true });
      return;
    }

    const minCart = matched.minOrder || matched.minCart || 0;
    if (totals.subtotal < minCart) {
      setCouponMessage({ 
        text: `Coupon '${codeUpper}' requires a minimum cart total of ₹${minCart}. Add ₹${minCart - totals.subtotal} more to unlock!`, 
        isError: true 
      });
      return;
    }

    setAppliedOffer(matched);
    const pct = matched.discountPercent || matched.discount || 0;
    const maxCap = matched.maxDiscount ? ` (up to ₹${matched.maxDiscount})` : '';
    setCouponMessage({ 
      text: `Coupon '${codeUpper}' applied successfully! 🎉 ${pct}% OFF${maxCap}`, 
      isError: false 
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponCode('');
    setCouponMessage({ text: '', isError: false });
  };

  // Input Handlers & Validation
  const handleNameChange = (e) => {
    setName(e.target.value.replace(/[^A-Za-z ]+/g, ''));
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D+/g, '');
    setPhone(digitsOnly);
    validatePhone(digitsOnly, true);
  };

  const handleTableChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D+/g, '');
    setTable(digitsOnly);
    validateTable(digitsOnly, true);
  };

  const validatePhone = (value, showTransientSuccess = true) => {
    const cleaned = value.trim();
    const isValid = /^[6-9]\d{9}$/.test(cleaned);

    if (phoneTimeoutRef.current) clearTimeout(phoneTimeoutRef.current);

    if (isValid && showTransientSuccess) {
      setPhoneError({ text: '✓ Valid mobile number', type: 'success' });
      phoneTimeoutRef.current = setTimeout(() => {
        setPhoneError({ text: '', type: '' });
      }, 1200);
    } else if (isValid) {
      setPhoneError({ text: '', type: '' });
    } else if (value.trim()) {
      setPhoneError({ text: 'Enter a valid 10-digit mobile number starting with 6-9', type: 'invalid' });
    } else {
      setPhoneError({ text: 'Mobile number is required.', type: 'invalid' });
    }
    return isValid;
  };

  const validateTable = (value, showTransientSuccess = true) => {
    const cleaned = value.trim();
    const isValid = /^(?:[1-9]|1[0-5])$/.test(cleaned);

    if (isValid && showTransientSuccess) {
      setTableError({ text: '✓ Valid Table', type: 'success' });
      setTimeout(() => setTableError({ text: '', type: '' }), 1200);
    } else if (isValid) {
      setTableError({ text: '', type: '' });
    } else if (value.trim()) {
      setTableError({ text: 'Table number must be between 1 and 15.', type: 'invalid' });
    } else {
      setTableError({ text: 'Table number is required.', type: 'invalid' });
    }
    return isValid;
  };

  const updateQuantity = (id, delta) => {
    setCart(prevCart => {
      const newCart = { ...prevCart };
      const currentQty = newCart[id] || 0;
      const targetQty = currentQty + delta;

      if (targetQty <= 0) {
        delete newCart[id];
      } else {
        newCart[id] = targetQty;
      }
      return newCart;
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setStatusMessage({ title: 'Name Required', desc: 'Please fill in your full name.' });
      return;
    }

    const isTableValid = validateTable(table, false);
    if (!isTableValid) {
      setStatusMessage({ title: 'Invalid Table Number', desc: 'Table number must be between 1 and 15.' });
      return;
    }

    const isPhoneValid = validatePhone(phone, false);
    if (!isPhoneValid) {
      setStatusMessage({ title: 'Invalid Mobile Number', desc: 'Enter a valid 10-digit mobile number.' });
      return;
    }

    if (totals.subtotal === 0) return;

    setIsProcessing(true);
    setQrLoading(true);

    const sequence = Math.floor(Math.random() * 10) + 1;
    const orderId = Math.floor(Math.random() * 900) + 100;
    const finalTotalStr = `₹${totals.total}`;

    const orderItemsPayload = Object.entries(cart).map(([id, qty]) => {
      const item = menuItems.find(entry => entry.id === id);
      return {
        id,
        title: item?.name || 'Item',
        price: item?.price || 0,
        quantity: qty
      };
    });

    const itemsText = Object.entries(cart)
      .map(([id, qty]) => {
        const item = menuItems.find(entry => entry.id === id);
        return item ? `${item.name} x${qty} = ₹${item.price * qty}` : '';
      })
      .join('\n');

    const priceBreakup = `Subtotal: ₹${totals.subtotal}\nTaxes (5%): ₹${totals.taxes}\nTotal: ${finalTotalStr}`;
    const orderData = `Order Seq: ${sequence}\nOrder ID: TB-${orderId}\nTable: ${table}\nName: ${name}\nPhone: ${phone}\nPayment: ${paymentMethod.toUpperCase()}\n\nItems:\n${itemsText}\n\nPrice Breakup:\n${priceBreakup}`;
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(orderData)}`;

    // Save Order to Spring Boot Backend DB
    try {
      await createOrder({
        orderId: `TB-${orderId}`,
        items: orderItemsPayload,
        tableNumber: table,
        totalAmount: totals.total,
        status: 'PREPARING',
        customerName: name,
        customerPhone: phone,
        paymentStatus: paymentMethod === 'cash' ? 'PENDING' : 'PAID',
        qrCodeUrl: qrCodeUrl
      });
      logActivity(`New order TB-${orderId} placed for Table ${table} (₹${totals.total})`, 'order');
    } catch (err) {
      console.warn('Backend order submission note:', err);
    }

    setModal({
      isOpen: true,
      heading: '✓ Order Placed Successfully!',
      headingColor: '#10b981',
      sequence,
      orderId: `TB-${orderId}`,
      totalPaid: finalTotalStr,
      qrUrl: qrCodeUrl
    });

    setQrLoading(false);
    setIsProcessing(false);
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
    setCart({});
    setName('');
    setPhone('');
    setTable('');
    setPaymentMethod('cash');
    setPhoneError({ text: '', type: '' });
    setTableError({ text: '', type: '' });
    setStatusMessage(null);
  };

  useEffect(() => {
    return () => {
      if (phoneTimeoutRef.current) clearTimeout(phoneTimeoutRef.current);
    };
  }, []);

  return (
    <div className="order-page-root">
      <style>{`
        .order-page-root {
          --accent-gold: #f59e0b;
          --accent-gradient: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
          --font-stack: 'Inter', system-ui, -apple-system, sans-serif;
          
          font-family: var(--font-stack);
          color: var(--text-main);
          width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background-color: var(--bg-main);
          overflow-y: auto;
        }

        .order-page-root .menu-panel,
        .order-page-root .checkout-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
        }

        .order-page-root input,
        .order-page-root select {
          background: var(--card-bg) !important;
          color: var(--text-main) !important;
          border-color: var(--border-color) !important;
        }

        .order-page-root .panel-title,
        .order-page-root .item-details strong,
        .order-page-root .order-page-header h1 {
          color: var(--text-main) !important;
        }

        .order-page-root * { box-sizing: border-box; }

        .page-shell {
          width: 100%;
          max-width: 1200px;
          background: var(--bg-surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-subtle);
          border-radius: 24px;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
          padding: 28px;
          margin: 0 auto;
        }

        /* Zomato-Style Hero Banner & Tabs */
        .zomato-hero-banner {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.12) 100%);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 20px;
          padding: 18px 22px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .zomato-hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .zomato-brand-tag {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .zomato-logo {
          font-size: 1.7rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .zomato-badge {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ef4444;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .zomato-service-tabs {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .zomato-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-subtle);
          background: #0f172a;
          color: var(--text-muted);
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .zomato-tab:hover {
          border-color: #ef4444;
          color: #ffffff;
        }

        .zomato-tab.active {
          background: linear-gradient(135deg, #ef4444 0%, #ea580c 100%);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
        }

        .zomato-search-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .zomato-location-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          border: 1px solid var(--border-subtle);
          padding: 9px 14px;
          border-radius: 12px;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-main);
          min-width: 200px;
          flex: 1 1 220px;
        }
        .zomato-location-box .loc-icon { color: #ef4444; }

        .zomato-search-input {
          flex: 2 1 300px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0f172a;
          border: 1px solid var(--border-subtle);
          padding: 9px 14px;
          border-radius: 12px;
          color: var(--text-muted);
        }

        .zomato-search-input:focus-within {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        .zomato-search-input input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.88rem;
          outline: none;
        }

        .zomato-search-input .clear-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.1rem;
        }

        .order-page-header h1 {
          margin: 0 0 6px 0;
          font-size: clamp(1.6rem, 2.5vw, 2.2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .order-page-header p { margin: 0; color: var(--text-muted); font-size: 0.92rem; max-width: 60ch; }

        .back-nav-btn {
          padding: 9px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: var(--accent-gold);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .back-nav-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(245, 158, 11, 0.3); }

        .content-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr); gap: 24px; align-items: start; }

        .menu-panel, .checkout-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 20px;
          box-sizing: border-box;
          width: 100%;
        }
        .checkout-panel { position: sticky; top: 20px; align-self: start; }

        .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }

        .panel-title {
          margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-main);
          display: flex; align-items: center; gap: 10px;
        }
        .panel-title::before {
          content: ''; width: 4px; height: 18px; background: var(--accent-gradient); border-radius: 2px;
        }

        .category-filter-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          scrollbar-width: thin;
        }

        .cat-btn {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background: var(--bg-main);
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .cat-btn:hover { border-color: var(--accent-gold); color: var(--text-main); }
        .cat-btn.active { background: var(--accent-gradient); color: #ffffff; border-color: transparent; }

        .item-list { display: grid; gap: 14px; }
        .item-row {
          display: grid; grid-template-columns: 56px 1fr auto; gap: 16px; align-items: center;
          padding: 14px; border-radius: 14px; background: var(--bg-main);
          border: 1px solid var(--border-color); transition: all 0.2s ease;
          position: relative;
        }
        .item-row:hover { border-color: rgba(245, 158, 11, 0.4); }
        .item-row.out-of-stock-row { opacity: 0.55; border-color: rgba(239, 68, 68, 0.2); }

        .item-img-wrapper { position: relative; width: 56px; height: 56px; }
        .item-row-img {
          width: 56px; height: 56px; border-radius: 10px; object-fit: cover; background: var(--border-color); display: block;
        }
        .out-of-stock-badge {
          position: absolute; inset: 0; background: rgba(0, 0, 0, 0.7); color: #ef4444; font-size: 0.62rem; font-weight: 800; text-transform: uppercase; border-radius: 10px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.1; padding: 2px;
        }

        .disabled-tag { color: #ef4444; font-size: 0.8rem; font-weight: 700; }
        .stock-status-text { color: #ef4444; font-weight: 700; font-size: 0.8rem; }

        .item-details strong { font-size: 0.98rem; font-weight: 600; color: var(--text-main); display: block; margin-bottom: 2px; }
        .item-details p { color: var(--text-muted); font-size: 0.82rem; margin: 0; line-height: 1.3; }

        .item-actions { display: flex; align-items: center; gap: 12px; }
        .item-price { font-weight: 700; color: var(--accent-gold); font-size: 1rem; min-width: 60px; text-align: right; }

        .quantity-controls { display: flex; align-items: center; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 2px; }
        .quantity-controls.disabled-controls { opacity: 0.4; cursor: not-allowed; }
        .quantity-controls button {
          width: 28px; height: 28px; border-radius: 50%; border: none; background: transparent;
          color: var(--text-main); font-size: 1.05rem; font-weight: 600; cursor: pointer;
          display: grid; place-items: center; transition: all 0.2s;
        }
        .quantity-controls button:disabled { cursor: not-allowed; opacity: 0.4; }
        .quantity-controls button:hover:not([disabled]) { background: rgba(0, 0, 0, 0.05); color: var(--accent-gold); }
        .quantity-controls button.btn-add:hover:not([disabled]) { background: var(--accent-gradient); color: #fff; }
        .item-count { font-size: 0.85rem; font-weight: 600; min-width: 70px; text-align: center; color: var(--text-main); }

        /* Zomato Coupon Ticket Cards Styling */
        .zomato-coupon-container { margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
        .zomato-coupon-header { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 800; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; }
        .zomato-tag-icon { color: #ef4444; }

        .zomato-coupon-input-wrapper { display: flex; flex-direction: column; gap: 10px; }
        .zomato-input-row { display: flex; gap: 8px; background: var(--bg-main); border: 1.5px dashed rgba(239, 68, 68, 0.4); padding: 4px; border-radius: 12px; }
        .zomato-input-row input { flex: 1; background: transparent !important; border: none !important; padding: 10px 12px; color: var(--text-main) !important; font-size: 0.88rem; font-weight: 700; letter-spacing: 1px; outline: none; }
        .zomato-apply-btn { background: linear-gradient(135deg, #ef4444 0%, #ea580c 100%); color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 0.82rem; font-weight: 800; cursor: pointer; transition: all 0.2s ease; }
        .zomato-apply-btn:hover { opacity: 0.95; transform: scale(1.02); }

        .zomato-coupon-msg { font-size: 0.8rem; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
        .zomato-coupon-msg.success { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .zomato-coupon-msg.err { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        .zomato-applied-ticket { position: relative; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 14px; padding: 14px 16px; overflow: hidden; }
        .ticket-cutout-left { position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; background: var(--card-bg); border-radius: 50%; }
        .ticket-cutout-right { position: absolute; right: -10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; background: var(--card-bg); border-radius: 50%; }
        .ticket-inner { display: flex; justify-content: space-between; align-items: center; }
        .ticket-left { display: flex; flex-direction: column; gap: 2px; }
        .ticket-code { font-weight: 900; color: #10b981; font-size: 1rem; letter-spacing: 1px; }
        .ticket-save-text { font-size: 0.82rem; color: var(--text-main); font-weight: 600; }
        .zomato-remove-btn { background: transparent; border: none; color: #ef4444; font-size: 0.82rem; font-weight: 800; cursor: pointer; text-transform: uppercase; }
        .zomato-remove-btn:hover { text-decoration: underline; }

        .zomato-vouchers-list { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
        .vouchers-header-row { display: flex; justify-content: space-between; align-items: center; }
        .vouchers-title { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .toggle-all-coupons-btn { background: transparent; border: none; color: #ef4444; font-size: 0.78rem; font-weight: 700; cursor: pointer; text-decoration: underline; }
        .toggle-all-coupons-btn:hover { color: #f97316; }

        .zomato-voucher-card { position: relative; display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px; cursor: pointer; transition: all 0.2s ease; overflow: hidden; }
        .zomato-voucher-card.best-offer-card { border-color: rgba(245, 158, 11, 0.6); background: rgba(245, 158, 11, 0.06); }
        .zomato-voucher-card:hover { border-color: #ef4444; background: rgba(239, 68, 68, 0.08); transform: translateY(-1px); }
        .zomato-voucher-card.disabled { opacity: 0.5; pointer-events: none; }
        .voucher-dashed-line { position: absolute; right: 80px; top: 0; bottom: 0; border-right: 1.5px dashed var(--border-color); }
        .voucher-left { display: flex; flex-direction: column; gap: 2px; max-width: 70%; }
        .voucher-top-tags { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .voucher-code-badge { display: inline-block; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 800; font-size: 0.82rem; padding: 2px 8px; border-radius: 6px; width: fit-content; letter-spacing: 0.5px; }
        .voucher-pct-badge { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 800; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; }
        .best-tag-pill { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #ffffff; font-weight: 800; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; }
        .voucher-desc { margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-main); font-weight: 600; }
        .voucher-min { font-size: 0.73rem; color: var(--text-muted); }
        .voucher-max-cap { font-size: 0.72rem; color: #f59e0b; font-weight: 600; }
        .voucher-apply-link { background: transparent; border: none; color: #ef4444; font-weight: 900; font-size: 0.85rem; cursor: pointer; letter-spacing: 0.5px; }
        .voucher-apply-link:hover { text-decoration: underline; color: #f97316; }
        .voucher-apply-link:disabled { color: #64748b; cursor: not-allowed; text-decoration: none; }

        .summary-card { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; margin-bottom: 20px; display: grid; gap: 10px; }
        .summary-row { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.9rem; }
        .summary-row strong { color: var(--text-main); }
        .summary-row.discount-row { color: #10b981; }
        .discount-val { color: #10b981 !important; }
        .summary-row.grand-total { border-top: 1px solid var(--border-color); padding-top: 10px; font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
        .summary-row.grand-total strong { color: var(--accent-gold); font-size: 1.2rem; }

        .checkout-form { display: grid; gap: 16px; }
        .checkout-form label { display: grid; gap: 6px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .checkout-form input, .checkout-form select {
          width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid var(--border-color);
          background: var(--bg-main) !important; color: var(--text-main) !important; font-size: 0.92rem; outline: none; transition: all 0.2s ease;
        }
        .checkout-form input:focus, .checkout-form select:focus { border-color: var(--accent-gold); box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
        
        .checkout-form input.valid { border-color: #10b981; }
        .checkout-form input.invalid { border-color: #ef4444; }

        .pay-button {
          width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 0.98rem; font-weight: 700; color: #ffffff;
          background: var(--accent-gradient); cursor: pointer; box-shadow: 0 8px 20px rgba(234, 88, 12, 0.25); transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pay-button:hover:not([disabled]) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(234, 88, 12, 0.35); }
        .pay-button:disabled { background: var(--border-color); color: var(--text-muted); cursor: not-allowed; box-shadow: none; opacity: 0.6; }

        .validation-error { font-size: 0.8rem; color: #ef4444; margin-top: 2px; }
        .validation-error.success { color: #34d399; }

        .status-alert-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 12px; margin-top: 14px; }
        .status-alert-box strong { display: block; color: #ef4444; font-size: 0.88rem; margin-bottom: 2px; }
        .status-alert-box p { margin: 0; font-size: 0.82rem; color: var(--text-muted); }

        /* Modal Architecture */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(2, 6, 12, 0.82); backdrop-filter: blur(12px); display: grid; place-items: center; padding: 20px; z-index: 999; }
        .modal-card { width: min(100%, 440px); background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 28px; box-shadow: 0 50px 100px rgba(0, 0, 0, 0.8); position: relative; display: grid; gap: 20px; text-align: center; }
        
        .modal-close { position: absolute; right: 16px; top: 16px; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(255, 255, 255, 0.05); color: var(--text-muted); cursor: pointer; font-size: 1.1rem; display: grid; place-items: center; }
        .modal-close:hover { background: rgba(255, 255, 255, 0.1); color: #ffffff; }

        .qr-card { position: relative; padding: 16px; border-radius: 14px; background: #ffffff; display: inline-block; margin: 0 auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); }
        .qr-card img { display: block; width: 200px; height: 200px; margin: 0 auto; }

        .order-details { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px; text-align: left; display: grid; gap: 6px; font-size: 0.9rem; }
        .order-details div { display: flex; justify-content: space-between; }
        .order-details strong { color: var(--text-muted); font-weight: 500; }

        @media (max-width: 992px) {
          .content-grid { grid-template-columns: 1fr; gap: 20px; }
          .checkout-panel { position: static; }
          .page-shell { padding: 18px; }
        }

        @media (max-width: 600px) {
          .item-row {
            grid-template-columns: 48px 1fr;
            gap: 12px;
          }
          .item-actions {
            grid-column: 1 / -1;
            justify-content: space-between;
            border-top: 1px dashed rgba(255, 255, 255, 0.08);
            padding-top: 8px;
            margin-top: 4px;
          }
          .zomato-location-box, .zomato-search-input {
            width: 100%;
            flex: 1 1 100%;
          }
        }
      `}</style>

      <div className="page-shell">
        <header className="order-page-header">
          <div>
            <h1>Place Your Order</h1>
            <p>Select items from our database menu, specify your table number, and apply coupons instantly.</p>
          </div>
          {onBack && (
            <button className="back-nav-btn" onClick={onBack}>
              <ArrowLeft size={16} /> Back to Menu
            </button>
          )}
        </header>

        <div className="content-grid">
          {/* Menu Selection Panel */}
          <section className="menu-panel">
            <div className="panel-header">
              <h2 className="panel-title">Explore Menu</h2>
              
              <div className="category-filter-pills">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingMenu ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading available dishes...
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="item-list">
                {filteredItems.map(item => {
                  const count = cart[item.id] || 0;
                  const isAvailable = item.available;

                  return (
                    <div className={`item-row ${!isAvailable ? 'out-of-stock-row' : ''}`} key={item.id}>
                      <div className="item-img-wrapper">
                        <img src={item.image} alt={item.name} className="item-row-img" />
                        {!isAvailable && (
                          <span className="out-of-stock-badge">Out of Stock</span>
                        )}
                      </div>
                      <div className="item-details">
                        <strong>
                          {item.name}
                          {!isAvailable && <span className="disabled-tag"> (Unavailable)</span>}
                        </strong>
                        <p>{item.description}</p>
                      </div>
                      <div className="item-actions">
                        <div className="item-price">₹{item.price}</div>
                        <div className={`quantity-controls ${!isAvailable ? 'disabled-controls' : ''}`}>
                          <button 
                            type="button" 
                            onClick={() => isAvailable && updateQuantity(item.id, -1)}
                            disabled={!isAvailable || count === 0}
                          >
                            -
                          </button>
                          <button 
                            className="btn-add" 
                            type="button" 
                            onClick={() => isAvailable && updateQuantity(item.id, 1)}
                            disabled={!isAvailable}
                          >
                            +
                          </button>
                        </div>
                        <div className="item-count">
                          {!isAvailable ? (
                            <span className="stock-status-text">Out of Stock</span>
                          ) : (
                            count ? `Added: ${count}` : 'Add'
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No food items available in this category.
              </div>
            )}
          </section>

          {/* Checkout Panel */}
          <aside className="checkout-panel">
            <h2 className="panel-title" style={{ marginBottom: '20px' }}>Order Details</h2>
            
            {/* Zomato-Style Ticket Coupon Card Section */}
            <div className="zomato-coupon-container">
              <div className="zomato-coupon-header">
                <Tag size={15} className="zomato-tag-icon" />
                <span>Offers & Coupons</span>
              </div>

              {appliedOffer ? (
                <div className="zomato-applied-ticket">
                  <div className="ticket-cutout-left"></div>
                  <div className="ticket-cutout-right"></div>
                  <div className="ticket-inner">
                    <div className="ticket-left">
                      <span className="ticket-code">{appliedOffer.code}</span>
                      <span className="ticket-save-text">
                        Saving ₹{totals.discount} on this order!
                      </span>
                    </div>
                    <button type="button" className="zomato-remove-btn" onClick={handleRemoveCoupon}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="zomato-coupon-input-wrapper">
                  <div className="zomato-input-row">
                    <input 
                      type="text" 
                      placeholder="ENTER COUPON CODE" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <button type="button" className="zomato-apply-btn" onClick={handleApplyCoupon}>
                      APPLY
                    </button>
                  </div>

                  {couponMessage.text && (
                    <div className={`zomato-coupon-msg ${couponMessage.isError ? 'err' : 'success'}`}>
                      {couponMessage.text}
                    </div>
                  )}

                  {/* Zomato-style Voucher Ticket Cards List (Shows Best Coupon or All) */}
                  {dbOffers.length > 0 && (
                    <div className="zomato-vouchers-list">
                      <div className="vouchers-header-row">
                        <span className="vouchers-title">
                          {showAllCoupons ? 'All Available Coupons' : 'Best Offer For You'}
                        </span>
                        {dbOffers.length > 1 && (
                          <button 
                            type="button" 
                            className="toggle-all-coupons-btn"
                            onClick={() => setShowAllCoupons(!showAllCoupons)}
                          >
                            {showAllCoupons ? 'Show Less' : `View All Coupons (${dbOffers.length})`}
                          </button>
                        )}
                      </div>

                      {displayedOffers.map((offer) => {
                        const code = offer.code || 'SAVE';
                        const pct = offer.discountPercent || offer.discount || 0;
                        const minOrder = offer.minOrder || offer.minCart || 0;
                        const maxCap = offer.maxDiscount;
                        const isBest = bestCoupon && bestCoupon.id === offer.id;
                        
                        let desc = offer.desc;
                        if (!desc) {
                          desc = `${pct}% OFF ${maxCap ? `up to ₹${maxCap}` : ''}`;
                        }

                        const isApplicable = totals.subtotal >= minOrder;
                        const neededMore = minOrder - totals.subtotal;

                        return (
                          <div 
                            key={offer.id} 
                            className={`zomato-voucher-card ${!isApplicable && totals.subtotal > 0 ? 'disabled' : ''} ${isBest ? 'best-offer-card' : ''}`}
                            onClick={() => {
                              setCouponCode(code);
                              setCouponMessage({ text: '', isError: false });
                            }}
                          >
                            <div className="voucher-dashed-line"></div>
                            <div className="voucher-left">
                              <div className="voucher-top-tags">
                                <span className="voucher-code-badge">{code}</span>
                                {pct > 0 && <span className="voucher-pct-badge">{pct}% OFF</span>}
                                {isBest && <span className="best-tag-pill">BEST OFFER</span>}
                              </div>
                              <p className="voucher-desc">{desc}</p>
                              {minOrder > 0 && (
                                <span className="voucher-min">
                                  Min cart value: ₹{minOrder}
                                  {!isApplicable && totals.subtotal > 0 && (
                                    <strong style={{ color: '#f87171', marginLeft: '6px' }}>
                                      (Add ₹{neededMore} more)
                                    </strong>
                                  )}
                                </span>
                              )}
                              {maxCap > 0 && (
                                <span className="voucher-max-cap">Max discount: ₹{maxCap}</span>
                              )}
                            </div>
                            <button 
                              type="button" 
                              className="voucher-apply-link"
                              disabled={!isApplicable && totals.subtotal > 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCouponCode(code);
                                if (!isApplicable) {
                                  setCouponMessage({ 
                                    text: `Add ₹${neededMore} more items to apply '${code}'`, 
                                    isError: true 
                                  });
                                } else {
                                  setAppliedOffer(offer);
                                  setCouponMessage({ text: `Coupon '${code}' applied!`, isError: false });
                                }
                              }}
                            >
                              {isApplicable || totals.subtotal === 0 ? 'APPLY' : 'LOCKED'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="summary-card">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>₹{totals.subtotal}</strong>
              </div>
              {totals.discount > 0 && (
                <div className="summary-row discount-row">
                  <span>Offer Discount</span>
                  <strong className="discount-val">- ₹{totals.discount}</strong>
                </div>
              )}
              <div className="summary-row">
                <span>Taxes & Service (5%)</span>
                <strong>₹{totals.taxes}</strong>
              </div>
              <div className="summary-row grand-total">
                <span>Total Payable</span>
                <strong>₹{totals.total}</strong>
              </div>
            </div>

            <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
              <label>
                Table Number (1 - 15) *
                <input
                  type="text"
                  placeholder="e.g. 5"
                  value={table}
                  onChange={handleTableChange}
                  onBlur={() => validateTable(table, false)}
                  className={tableError.type === 'invalid' ? 'invalid' : tableError.type === 'success' ? 'valid' : ''}
                  required
                />
                {tableError.text && (
                  <div className={`validation-error ${tableError.type}`}>
                    {tableError.text}
                  </div>
                )}
              </label>

              <label>
                Full Name *
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={name} 
                  onChange={handleNameChange}
                  required 
                />
              </label>

              <label>
                Phone Number *
                <input 
                  type="tel" 
                  placeholder="10-digit mobile number" 
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => validatePhone(phone, false)}
                  className={phoneError.type === 'invalid' ? 'invalid' : phoneError.type === 'success' ? 'valid' : ''}
                  required 
                />
                {phoneError.text && (
                  <div className={`validation-error ${phoneError.type}`}>
                    {phoneError.text}
                  </div>
                )}
              </label>

              <label>
                Payment Method
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash / Pay at Counter</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="card">Credit / Debit Card</option>
                </select>
              </label>

              <button 
                type="submit" 
                className="pay-button" 
                disabled={totals.subtotal === 0 || isProcessing}
              >
                <ShoppingBag size={18} />
                {isProcessing ? 'Submitting Order...' : 'Confirm & Place Order'}
              </button>
            </form>

            {statusMessage && (
              <div className="status-alert-box">
                <strong>{statusMessage.title}</strong>
                <p>{statusMessage.desc}</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {modal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={closeModal}>×</button>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={40} color="#10b981" />
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: modal.headingColor }}>
                {modal.heading}
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Your order has been sent to the kitchen!
              </p>
            </div>

            {modal.qrUrl && (
              <div className="qr-card">
                <img src={modal.qrUrl} alt="Order QR Code" />
              </div>
            )}

            <div className="order-details">
              <div><strong>Order ID:</strong> <span>{modal.orderId}</span></div>
              <div><strong>Table No:</strong> <span>{table}</span></div>
              <div><strong>Payment Mode:</strong> <span>{paymentMethod === 'cash' ? 'Cash / Counter' : paymentMethod.toUpperCase()}</span></div>
              <div>
                <strong>{paymentMethod === 'cash' ? 'Amount to Pay at Counter:' : 'Total Paid:'}</strong> 
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{modal.totalPaid}</span>
              </div>
            </div>

            <button type="button" className="pay-button" onClick={closeModal}>
              Close & Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;