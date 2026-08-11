// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\services\api.js

const API_BASE = window.location.port && window.location.port !== '5001'
  ? `${window.location.protocol}//${window.location.hostname}:5001/api`
  : '/api';

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'API isteği başarısız oldu.');
  }
  return response.json();
};

export const api = {
  // Books
  getBooks: () => fetchJson(`${API_BASE}/books`),
  addBook: (book, userId) => fetchJson(`${API_BASE}/books`, {
    method: 'POST',
    body: JSON.stringify({ ...book, userId })
  }),
  updateBook: (book, userId) => fetchJson(`${API_BASE}/books/${book.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...book, userId })
  }),
  deleteBook: (id, userId) => fetchJson(`${API_BASE}/books/${id}?userId=${userId}`, {
    method: 'DELETE'
  }),

  // Users
  getUsers: () => fetchJson(`${API_BASE}/users`),
  addUser: (user, actorId) => fetchJson(`${API_BASE}/users`, {
    method: 'POST',
    body: JSON.stringify({ ...user, actorId })
  }),
  updateUser: (user, actorId) => fetchJson(`${API_BASE}/users/${user.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...user, actorId })
  }),
  deleteUser: (id, actorId) => fetchJson(`${API_BASE}/users/${id}?actorId=${actorId}`, {
    method: 'DELETE'
  }),

  // Lend & Return
  getLendRecords: () => fetchJson(`${API_BASE}/lend`),
  lendBook: (bookId, userId, dueDate, actorId) => fetchJson(`${API_BASE}/lend`, {
    method: 'POST',
    body: JSON.stringify({ bookId, userId, dueDate, actorId })
  }),
  returnBook: (recordId, returnStatus, actorId) => fetchJson(`${API_BASE}/return`, {
    method: 'POST',
    body: JSON.stringify({ recordId, returnStatus, actorId })
  }),

  // Logs
  getLogs: () => fetchJson(`${API_BASE}/logs`),
  deleteLog: (id) => fetchJson(`${API_BASE}/logs/${id}`, {
    method: 'DELETE'
  }),

  // Settings
  getSettings: () => fetchJson(`${API_BASE}/settings`),
  saveSettings: (settings, actorId) => fetchJson(`${API_BASE}/settings`, {
    method: 'POST',
    body: JSON.stringify({ ...settings, actorId })
  }),
  changePassword: (currentPassword, newPassword, actorId) => fetchJson(`${API_BASE}/settings/change-password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword, actorId })
  }),
  forceChangePassword: (newPassword, actorId) => fetchJson(`${API_BASE}/settings/force-change-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword, actorId })
  }),
  resetPassword: (email) => fetchJson(`${API_BASE}/settings/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  addLocation: (type, value, actorId) => fetchJson(`${API_BASE}/settings/locations`, {
    method: 'POST',
    body: JSON.stringify({ type, value, actorId })
  }),
  deleteLocation: (type, value, actorId) => fetchJson(`${API_BASE}/settings/locations?type=${type}&value=${encodeURIComponent(value)}&actorId=${actorId}`, {
    method: 'DELETE'
  }),

  // Local Session simulator
  getActiveUser: () => {
    const user = sessionStorage.getItem('vantso_session_user');
    return user ? JSON.parse(user) : null;
  },
  setActiveUser: (user) => {
    sessionStorage.setItem('vantso_session_user', JSON.stringify(user));
  },
  logout: () => {
    sessionStorage.removeItem('vantso_session_user');
  },
  login: (email, password) => fetchJson(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  // Calculate notifications locally on the frontend (keeps the UI fast)
  getNotifications: (records, books, users, warningDays = 3) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const notifications = [];

    records.forEach(record => {
      if (record.status === 'Ödünçte' && !record.returnDate) {
        const book = books.find(b => b.id === record.bookId);
        const user = users.find(u => u.id === record.userId);
        if (!book || !user) return;

        const dueDate = new Date(record.dueDate);
        dueDate.setHours(0,0,0,0);

        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          notifications.push({
            id: `N-OVERDUE-${record.id}`,
            type: 'danger',
            title: 'Geciken Kitap Uyarısı',
            message: `"${book.name}" adlı kitabın teslim tarihi ${Math.abs(diffDays)} gün geçti. Ödünç alan: ${user.name} (${user.department})`,
            recordId: record.id,
            bookId: book.id,
            days: diffDays
          });
        } else if (diffDays <= warningDays) {
          notifications.push({
            id: `N-WARNING-${record.id}`,
            type: 'warning',
            title: 'Teslim Tarihi Yaklaşıyor',
            message: `"${book.name}" adlı kitabın teslimine ${diffDays} gün kaldı. Ödünç alan: ${user.name}`,
            recordId: record.id,
            bookId: book.id,
            days: diffDays
          });
        }
      }
    });

    return notifications;
  }
};
export default api;
