const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  'https://tastybite-spye.onrender.com/api';

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tastybite_jwt_token');
  }
  return null;
}

export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('tastybite_jwt_token', token);
    } else {
      localStorage.removeItem('tastybite_jwt_token');
    }
  }
}

export function getStoredUser() {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('tastybite_user_profile');
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function setStoredUser(user) {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('tastybite_user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('tastybite_user_profile');
    }
  }
}

// In-memory cache & in-flight request deduplication for instant loading
const apiCache = new Map();
const inFlightRequests = new Map();

export function clearApiCache(endpointPrefix) {
  if (!endpointPrefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(endpointPrefix)) {
      apiCache.delete(key);
    }
  }
}

/**
 * Generic fetch wrapper with graceful error handling, fast memory cache and request deduplication
 */
async function fetchApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${endpoint}`;

  // If GET request, check cache (30s TTL)
  if (method === 'GET' && !options.noCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 30000)) {
      return cached.data;
    }

    // Deduplicate in-flight requests (e.g. RightPanel + HomeSection calling /menu at the same time)
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }
  }

  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson = null;
        try { errorJson = JSON.parse(errorText); } catch {}
        const msg = errorJson?.message || `API error: ${response.status} ${response.statusText}`;
        throw new Error(msg);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (method === 'GET') {
        apiCache.set(cacheKey, { timestamp: Date.now(), data });
      } else {
        // Any mutation (POST, PUT, DELETE) clears the cache for that resource
        const resource = endpoint.split('/')[1] || '';
        if (resource) clearApiCache(resource);
      }

      return data;
    } catch (error) {
      console.warn(`Backend connection issue at ${endpoint}:`, error.message);
      throw error;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  if (method === 'GET') {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

// --- AUTH API ---
export async function signupUser(name, email, password) {
  const data = await fetchApi('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  if (data?.token) setAuthToken(data.token);
  if (data?.user) setStoredUser(data.user);
  return data;
}

export async function loginUser(email, password) {
  const data = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data?.token) setAuthToken(data.token);
  if (data?.user) setStoredUser(data.user);
  return data;
}

export async function loginWithGoogle(idToken, email, name, picture) {
  const data = await fetchApi('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, email, name, picture })
  });
  if (data?.token) setAuthToken(data.token);
  if (data?.user) setStoredUser(data.user);
  return data;
}

export async function getCurrentUser() {
  try {
    const data = await fetchApi('/auth/me');
    if (data?.user) setStoredUser(data.user);
    return data?.user || null;
  } catch {
    return null;
  }
}

export function logoutUser() {
  setAuthToken(null);
  setStoredUser(null);
}

// --- MENU API ---
export async function getMenuItems() {
  try {
    return await fetchApi('/menu');
  } catch {
    return null;
  }
}

export async function createMenuItem(item) {
  return await fetchApi('/menu', {
    method: 'POST',
    body: JSON.stringify(item)
  });
}

export async function updateMenuItem(id, item) {
  return await fetchApi(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  });
}

export async function deleteMenuItem(id) {
  return await fetchApi(`/menu/${id}`, {
    method: 'DELETE'
  });
}

// --- RESERVATIONS API ---
export async function getReservations() {
  try {
    return await fetchApi('/reservations');
  } catch {
    return null;
  }
}

export async function createReservation(reservation) {
  return await fetchApi('/reservations', {
    method: 'POST',
    body: JSON.stringify(reservation)
  });
}

export async function updateReservationStatus(id, status) {
  return await fetchApi(`/reservations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

export async function deleteReservation(id) {
  return await fetchApi(`/reservations/${id}`, {
    method: 'DELETE'
  });
}

// --- OFFERS API ---
export async function getOffers() {
  try {
    return await fetchApi('/offers');
  } catch {
    return null;
  }
}

export async function createOffer(offer) {
  return await fetchApi('/offers', {
    method: 'POST',
    body: JSON.stringify(offer)
  });
}

export async function updateOffer(id, offer) {
  return await fetchApi(`/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(offer)
  });
}

export async function deleteOffer(id) {
  return await fetchApi(`/offers/${id}`, {
    method: 'DELETE'
  });
}

// --- ORDERS API ---
export async function getOrders() {
  try {
    return await fetchApi('/orders');
  } catch {
    return null;
  }
}

export async function createOrder(order) {
  return await fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  });
}

export async function updateOrderStatus(id, status) {
  return await fetchApi(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

export async function updateOrderPaymentStatus(id, paymentStatus) {
  return await fetchApi(`/orders/${id}/payment-status`, {
    method: 'PUT',
    body: JSON.stringify({ paymentStatus })
  });
}

// --- CHAT API ---
export async function sendChatMessage(messageText) {
  try {
    return await fetchApi('/chat', {
      method: 'POST',
      body: JSON.stringify({ message: messageText })
    });
  } catch {
    return null;
  }
}

// --- ADMIN API ---
export async function adminLogin(usernameOrEmail, password) {
  return await fetchApi('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ 
      username: usernameOrEmail, 
      email: usernameOrEmail, 
      password 
    })
  });
}

// --- ACTIVITIES API ---
export async function getActivities() {
  try {
    return await fetchApi('/activities');
  } catch {
    return null;
  }
}

export async function logActivity(title, category = 'system') {
  try {
    const res = await fetchApi('/activities', {
      method: 'POST',
      body: JSON.stringify({ title, category })
    });
    window.dispatchEvent(new CustomEvent('activitiesUpdated'));
    return res;
  } catch {
    return null;
  }
}
