import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import RightPanel from './components/RightPanel';
import HomeSection from './components/HomeSection';
import MenuSection from './components/MenuSection';
import OffersSection from './components/OffersSection';
import OffersManager from './components/OffersManager';
import MenuManager from './components/MenuManager';
import ReservationsSection from './components/ReservationsSection';
import ContactSection from './components/ContactSection';
import AdminPanel from './components/AdminPanel';
import AdminReservations from './components/AdminReservations';
import AdminOrders from './components/AdminOrders';
import PlaceOrder from './components/PlaceOrder';
import AdminLogin from './components/AdminLogin';
import { 
  getReservations, 
  updateReservationStatus, 
  deleteReservation as apiDeleteReservation, 
  sendChatMessage
} from './services/apiService';
import { Menu as MenuIcon, Sun, Moon } from 'lucide-react';
import './App.css';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return (
        window.localStorage.getItem('tastybite-admin-auth') === 'true' ||
        window.sessionStorage.getItem('tastybite-admin-auth') === 'true'
      );
    } catch {
      return false;
    }
  });

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    try {
      window.localStorage.removeItem('tastybite-admin-auth');
      window.sessionStorage.removeItem('tastybite-admin-auth');
    } catch {}
    setIsAdminAuthenticated(false);
    setActiveTab('home');
  };

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    try {
      return window.localStorage.getItem('tastybite-active-tab') || 'home';
    } catch {
      return 'home';
    }
  });

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = window.localStorage.getItem('tastybite-theme');
      if (stored !== null) {
        return stored === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [reservations, setReservations] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('table-reservations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fetch initial reservations from backend API
  useEffect(() => {
    async function loadBackendReservations() {
      const apiRes = await getReservations();
      if (apiRes && apiRes.length > 0) {
        const formatted = apiRes.map(r => ({
          id: r.id,
          name: r.name,
          date: r.date,
          time: r.time,
          guests: r.guests ? String(r.guests) : '2',
          zone: r.tableType || 'Indoor Main Dining Room',
          status: r.status || 'CONFIRMED',
          createdAt: r.createdAt || new Date().toISOString()
        }));
        setReservations(formatted);
      }
    }
    loadBackendReservations();
  }, []);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      time: '10:30 AM',
      text: 'Welcome to TastyBite Restaurant! 👋 How can I help you today? You can ask about our menu, current offers or reservations.',
      subtext: ''
    }
  ]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      try { window.localStorage.setItem('tastybite-theme', 'dark'); } catch {}
    } else {
      document.documentElement.removeAttribute('data-theme');
      try { window.localStorage.setItem('tastybite-theme', 'light'); } catch {}
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem('tastybite-active-tab', activeTab);
    } catch {}
    // Scroll content to top whenever tab changes
    const scrollContainers = document.querySelectorAll('.home-section-container, .menu-section-container, .offers-section-container, .reservations-section-container, .contact-section-container, .main-wrapper');
    scrollContainers.forEach(el => {
      if (el) el.scrollTop = 0;
    });
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('table-reservations', JSON.stringify(reservations));
    }
  }, [reservations]);

  const handleReservationSuccess = (booking) => {
    setReservations((prev) => [
      {
        ...booking,
        createdAt: booking.createdAt || new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleReservationUpdate = async (id, updatedReservation) => {
    setReservations((prev) =>
      prev.map((reservation) => (reservation.id === id ? { ...reservation, ...updatedReservation } : reservation))
    );
    try {
      await updateReservationStatus(id, updatedReservation.status || 'CONFIRMED');
    } catch (err) {
      console.warn('API update reservation status error:', err);
    }
  };

  const handleReservationDelete = async (id) => {
    setReservations((prev) => prev.filter((reservation) => reservation.id !== id));
    try {
      await apiDeleteReservation(id);
    } catch (err) {
      console.warn('API delete reservation error:', err);
    }
  };

  const [isBotTyping, setIsBotTyping] = useState(false);

  // Shared send message function
  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const getCurrentTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutes} ${ampm}`;
    };

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      time: getCurrentTime(),
      text: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsBotTyping(true);

    // Call backend Chat API
    let botReply = null;
    try {
      botReply = await sendChatMessage(textToSend);
    } catch (err) {
      console.warn('Backend chat API note:', err);
    }

    if (botReply) {
      setMessages(prev => [...prev, botReply]);
      setIsBotTyping(false);
      return;
    }

    // Fallback response generator if API server is offline
    const lowerText = textToSend.toLowerCase();
    let botResponse = {
      id: Date.now() + 1,
      sender: 'bot',
      time: getCurrentTime(),
      text: '',
      pizzaList: null,
      subtext: ''
    };

    if (lowerText.includes('pizza') || lowerText.includes('veg option') || lowerText.includes('veg supreme') || lowerText.includes('margherita') || lowerText.includes('paneer tikka')) {
      botResponse.text = "Yes! We have a variety of delicious vegetarian pizzas. Here are some popular options:";
      botResponse.pizzaList = [
        {
          title: 'Veg Supreme Pizza',
          desc: 'Capsicum, Onion, Tomato, Corn, Black Olives, Mushroom, Cheese',
          price: '₹299',
          image: '/veg_supreme_pizza.png'
        },
        {
          title: 'Margherita Pizza',
          desc: 'Classic delight with 100% real mozzarella cheese & basil.',
          price: '₹249',
          image: '/margherita_pizza.png'
        },
        {
          title: 'Paneer Tikka Pizza',
          desc: 'Flavorful paneer tikka, capsicum, onion with cheesy topping.',
          price: '₹319',
          image: '/paneer_tikka_pizza.png'
        }
      ];
      botResponse.subtext = "Would you like to know more about any of these?";
    } else if (lowerText.includes('offer') || lowerText.includes('discount')) {
      botResponse.text = "We have some amazing offers active today! 🎉\n\n1. FLAT 20% OFF on orders above ₹499. Use coupon: SAVE20\n2. Free Garlic Bread on orders above ₹699. Use coupon: FREEGB";
      botResponse.subtext = "Which of these offers would you like to apply to your cart?";
    } else if (lowerText.includes('dessert') || lowerText.includes('sweet')) {
      botResponse.text = "Indulge in our sweet treats! 🍰 Here are our customer favorites:\n\n• Chocolate Brownie Fudge (₹149)\n• Creamy Red Velvet Pastry (₹179)\n• Classic NY Cheesecake (₹219)";
      botResponse.subtext = "Would you like me to add one of these to your order?";
    } else if (lowerText.includes('timing') || lowerText.includes('open') || lowerText.includes('hour')) {
      botResponse.text = "TastyBite is open daily to serve you your favorites! 📍\n\n• Monday to Thursday: 11:00 AM – 11:00 PM\n• Friday to Sunday: 11:00 AM – Midnight";
      botResponse.subtext = "Would you like to reserve a table for today?";
    } else {
      botResponse.text = `Thank you for reaching out! I'm here to assist you with our menu, current offers, reservations and timings.`;
      botResponse.subtext = "How can I help you today?";
    }

    setTimeout(() => {
      setMessages(prev => [...prev, botResponse]);
      setIsBotTyping(false);
    }, 400);
  };

  const [selectedOrderDish, setSelectedOrderDish] = useState(null);

  const handleOrderDish = (dish) => {
    if (!dish) return;
    // Add unique selectId timestamp so re-selecting triggers PlaceOrder add
    setSelectedOrderDish({
      ...dish,
      _selectId: Date.now()
    });
    setActiveTab('place-order');
  };

  return (
    <div className="app-container">
      {/* Mobile Top Navigation Header */}
      <header className="mobile-top-nav">
        <button 
          className="mobile-hamburger-btn" 
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <MenuIcon size={22} />
        </button>
        <div className="mobile-nav-brand" onClick={() => setActiveTab('home')}>
          <div className="mobile-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18V9a6 6 0 0 1 12 0v9" />
              <path d="M3 18h18a1 1 0 0 1 1 1v2H2v-2a1 1 0 0 1 1-1Z" />
              <path d="M12 2v3" />
            </svg>
          </div>
          <span className="mobile-brand-title">TastyBite</span>
        </div>
        <div className="mobile-nav-actions">
          <button 
            className="mobile-theme-toggle" 
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileSidebarOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <main className="main-wrapper">
        {(() => {
          switch (activeTab) {
            case 'home':
              return (
                <HomeSection 
                  setActiveTab={setActiveTab} 
                  handleSendMessage={handleSendMessage} 
                />
              );
            case 'menu':
              return (
                <MenuSection 
                  setActiveTab={setActiveTab} 
                  handleSendMessage={handleSendMessage} 
                  onOrderDish={handleOrderDish}
                />
              );
            case 'offers':
              return (
                <OffersSection />
              );
            case 'offers-manager':
              if (!isAdminAuthenticated) {
                return (
                  <AdminLogin 
                    onSuccess={handleAdminLoginSuccess} 
                    onCancel={() => setActiveTab('home')} 
                  />
                );
              }
              return (
                <OffersManager 
                  onBack={() => setActiveTab('admin-panel')} 
                />
              );
            case 'menu-manager':
              if (!isAdminAuthenticated) {
                return (
                  <AdminLogin 
                    onSuccess={handleAdminLoginSuccess} 
                    onCancel={() => setActiveTab('home')} 
                  />
                );
              }
              return (
                <MenuManager 
                  onBack={() => setActiveTab('admin-panel')} 
                />
              );
            case 'reservations':
              return (
                <ReservationsSection onReservationSuccess={handleReservationSuccess} />
              );
            case 'contact-us':
              return (
                <ContactSection />
              );
            case 'place-order':
              return (
                <PlaceOrder 
                  onBack={() => setActiveTab('menu')} 
                  preSelectedDish={selectedOrderDish} 
                />
              );
            case 'admin-panel':
              if (!isAdminAuthenticated) {
                return (
                  <AdminLogin 
                    onSuccess={handleAdminLoginSuccess} 
                    onCancel={() => setActiveTab('home')} 
                  />
                );
              }
              return (
                <AdminPanel 
                  setActiveTab={setActiveTab} 
                  onLogout={handleAdminLogout} 
                />
              );
            case 'admin-reservations':
              if (!isAdminAuthenticated) {
                return (
                  <AdminLogin 
                    onSuccess={handleAdminLoginSuccess} 
                    onCancel={() => setActiveTab('home')} 
                  />
                );
              }
              return (
                <AdminReservations
                  reservations={reservations}
                  onBack={() => setActiveTab('admin-panel')}
                  onUpdateReservation={handleReservationUpdate}
                  onDeleteReservation={handleReservationDelete}
                />
              );
            case 'admin-orders':
              if (!isAdminAuthenticated) {
                return (
                  <AdminLogin 
                    onSuccess={handleAdminLoginSuccess} 
                    onCancel={() => setActiveTab('home')} 
                  />
                );
              }
              return (
                <AdminOrders
                  onBack={() => setActiveTab('admin-panel')}
                  onLogout={handleAdminLogout}
                />
              );
            default:
              return (
                <ChatArea 
                  messages={messages} 
                  input={inputMessage}
                  setInput={setInputMessage}
                  handleSendMessage={handleSendMessage}
                  isTyping={isBotTyping}
                  onOrderDish={handleOrderDish}
                />
              );
          }
        })()}
        {activeTab !== 'place-order' && 
         activeTab !== 'contact-us' && 
         (!['admin-panel', 'admin-orders', 'admin-reservations', 'menu-manager', 'offers-manager'].includes(activeTab) || isAdminAuthenticated) && (
          <RightPanel onNavigateToMenu={() => setActiveTab('menu')} />
        )}
      </main>

    </div>
  );
}

export default App;
