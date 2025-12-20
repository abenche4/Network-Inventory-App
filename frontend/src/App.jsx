import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeviceList from './components/DeviceList';
import DeviceDetail from './components/DeviceDetail';
import './App.css';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
axios.defaults.withCredentials = true;

/**
 * Main App Component
 * Manages application state, data fetching, and CRUD operations
 */
function App() {
  // State management using useState hooks
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [authMode, setAuthMode] = useState('login');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [detailFiles, setDetailFiles] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [detailHistory, setDetailHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  /**
   * Fetch all devices from the API
   * Called on component mount and after CRUD operations
   */
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/devices`, {
        params: {
          search: searchTerm || undefined,
          status: statusFilter || undefined
        }
      });
      
      if (response.data.success) {
        setDevices(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch devices');
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to load devices. Please check if the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch devices when component mounts
   */
  useEffect(() => {
    const init = async () => {
      // Check existing session
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        setUser(res.data.user);
      } catch (err) {
        console.warn('Unable to validate session', err);
      } finally {
        setAuthLoading(false);
      }

      // Load lookups
      try {
        const [typesRes, mansRes] = await Promise.all([
          axios.get(`${API_URL}/lookups/device-types`),
          axios.get(`${API_URL}/lookups/manufacturers`)
        ]);
        if (typesRes.data.success) setDeviceTypes(typesRes.data.data || []);
        if (mansRes.data.success) setManufacturers(mansRes.data.data || []);
      } catch (err) {
        console.warn('Failed to load lookups', err);
      }

      fetchDevices();
    };

    init();
  }, []);

  /**
   * Handle login submit
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, loginForm);
      if (res.data.success) {
        setUser(res.data.user);
        setLoginForm({ email: '', password: '' });
        fetchUsers();
      } else {
        setAuthError(res.data.message || 'Login failed');
      }
    } catch (err) {
      setAuthError(
        err.response?.data?.message ||
          err.message ||
          'Login failed. Check your credentials.'
      );
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await axios.post(`${API_URL}/auth/logout`);
    setUser(null);
    setUsers([]);
  };

  /**
   * Handle register submit
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, registerForm);
      if (res.data.success) {
        setUser(res.data.user);
        setRegisterForm({ name: '', email: '', password: '' });
        fetchUsers();
        setAuthMode('login');
      } else {
        setAuthError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setAuthError(
        err.response?.data?.message ||
          err.message ||
          'Registration failed. Check your input.'
      );
    }
  };

  /**
   * Fetch users (requires auth)
   */
  const fetchUsers = async () => {
    if (!user) return;
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await axios.get(`${API_URL}/users`);
      if (res.data.success) {
        setUsers(res.data.data || []);
      } else {
        setUsersError(res.data.message || 'Failed to load users');
      }
    } catch (err) {
      setUsersError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load users. Please ensure you are logged in.'
      );
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch users whenever the logged-in user changes
  useEffect(() => {
    if (user) {
      fetchUsers();
    } else {
      setUsers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /**
   * Open device detail modal
   */
  const openDeviceDetail = async (id) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const [deviceRes, filesRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/devices/${id}`),
        axios.get(`${API_URL}/devices/${id}/files`),
        axios.get(`${API_URL}/devices/${id}/history`)
      ]);
      if (deviceRes.data.success) {
        setSelectedDevice(deviceRes.data.data);
      } else {
        setDetailError(deviceRes.data.message || 'Failed to load device');
      }
      if (filesRes.data.success) {
        setDetailFiles(filesRes.data.data || []);
      }
      if (historyRes.data.success) {
        setDetailHistory(historyRes.data.data || []);
      }
    } catch (err) {
      setDetailError(
        err.response?.data?.message || err.message || 'Failed to load device details'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDeviceDetail = () => {
    setSelectedDevice(null);
    setDetailFiles([]);
    setDetailError(null);
    setDetailHistory([]);
  };

  /**
   * Handle creating a new device
   * @param {Object} newDevice - Device data to create
   */
  const handleCreate = async (newDevice) => {
    try {
      setError(null);
      
      const response = await axios.post(`${API_URL}/devices`, newDevice);
      
      if (response.data.success) {
        // Add new device to state
        setDevices(prevDevices => [...prevDevices, response.data.data]);
        
        // Optionally refresh all devices to ensure consistency
        // fetchDevices();
      } else {
        throw new Error(response.data.message || 'Failed to create device');
      }
    } catch (err) {
      console.error('Error creating device:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to create device. Please check your input and try again.'
      );
      throw err; // Re-throw to let form handle it
    }
  };

  /**
   * Handle updating an existing device
   * @param {number} id - Device ID to update
   * @param {Object} updatedDevice - Updated device data
   */
  const handleUpdate = async (id, updatedDevice) => {
    try {
      setError(null);
      
      const response = await axios.put(`${API_URL}/devices/${id}`, updatedDevice);
      
      if (response.data.success) {
        // Update device in state
        setDevices(prevDevices =>
          prevDevices.map(device =>
            device.id === id ? response.data.data : device
          )
        );
      } else {
        throw new Error(response.data.message || 'Failed to update device');
      }
    } catch (err) {
      console.error('Error updating device:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to update device. Please check your input and try again.'
      );
      throw err; // Re-throw to let form handle it
    }
  };

  /**
   * Handle deleting a device
   * @param {number} id - Device ID to delete
   */
  const handleDelete = async (id) => {
    // Confirm deletion
    const device = devices.find(d => d.id === id);
    const confirmMessage = device
      ? `Are you sure you want to delete "${device.hostname}"? This action cannot be undone.`
      : 'Are you sure you want to delete this device? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) {
      return; // User cancelled
    }

    try {
      setError(null);
      
      const response = await axios.delete(`${API_URL}/devices/${id}`);
      
      if (response.data.success) {
        // Remove device from state
        setDevices(prevDevices => prevDevices.filter(device => device.id !== id));
      } else {
        throw new Error(response.data.message || 'Failed to delete device');
      }
    } catch (err) {
      console.error('Error deleting device:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to delete device. Please try again.'
      );
    }
  };

  /**
   * Calculate dashboard statistics
   */
  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status?.toLowerCase() === 'active').length,
    inactive: devices.filter(d => d.status?.toLowerCase() === 'inactive').length,
    maintenance: devices.filter(d => d.status?.toLowerCase() === 'maintenance').length
  };

  const statusBreakdown = [
    { label: 'Active', value: stats.active, color: '#4CAF50' },
    { label: 'Inactive', value: stats.inactive, color: '#f44336' },
    { label: 'Maintenance', value: stats.maintenance, color: '#ff9800' },
    { label: 'Other', value: Math.max(stats.total - (stats.active + stats.inactive + stats.maintenance), 0), color: '#94a3b8' }
  ];

  const pieTotal = Math.max(
    statusBreakdown.reduce((sum, seg) => sum + seg.value, 0),
    1
  );

  const pieSegments = (() => {
    let cumulative = 0;
    return statusBreakdown
      .filter((seg) => seg.value > 0)
      .map((seg, idx) => {
        const dash = (seg.value / pieTotal) * 100;
        const offset = 100 - cumulative;
        cumulative += dash;
        return (
          <circle
            key={seg.label + idx}
            r="15.915"
            cx="50%"
            cy="50%"
            fill="transparent"
            stroke={seg.color}
            strokeWidth="6"
            strokeDasharray={`${dash} ${100 - dash}`}
            strokeDashoffset={offset}
          />
        );
      });
  })();

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchDevices();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    fetchDevices();
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API_URL}/devices/export`, {
        params: {
          search: searchTerm || undefined,
          status: statusFilter || undefined
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'devices.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">🌐 Network Device Inventory</h1>
        <p className="app-tagline">Manage and track your network infrastructure devices</p>

        <div className="auth-panel">
          {authLoading ? (
            <span>Checking session...</span>
          ) : user ? (
            <div className="auth-info">
              <div>
                <strong>{user.name}</strong> ({user.role})
              </div>
              <div className="auth-actions">
                <button className="btn btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-forms">
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`tab ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`tab ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                  }}
                >
                  Register
                </button>
              </div>

              {authMode === 'login' ? (
                <form className="auth-form" onSubmit={handleLogin}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <button type="submit" className="btn btn-primary">Login</button>
                  {authError && <span className="error-message inline">{authError}</span>}
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleRegister}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <button type="submit" className="btn btn-primary">Register</button>
                  {authError && <span className="error-message inline">{authError}</span>}
                </form>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Users panel */}
        <section className="users-section">
          <div className="section-header">
            <h2>👥 Users</h2>
            {user && (
              <button className="btn btn-secondary" onClick={fetchUsers} disabled={usersLoading}>
                Refresh
              </button>
            )}
          </div>
          {!user && <p className="muted">Login to view users.</p>}
          {user && usersError && <div className="error-banner compact">{usersError}</div>}
          {user && usersLoading && <p>Loading users...</p>}
          {user && !usersLoading && users.length === 0 && <p className="muted">No users found.</p>}
          {user && users.length > 0 && (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.active ? 'Active' : 'Inactive'}</td>
                      <td>{new Date(u.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <section className="filter-bar">
          <form className="filter-form" onSubmit={handleFilterSubmit}>
            <input
              type="text"
              placeholder="Search by hostname or IP"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button type="submit" className="btn btn-primary">Apply</button>
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
              Clear
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleExport}>
              Export CSV
            </button>
          </form>
        </section>

        {/* Dashboard Statistics */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Devices</div>
            </div>
          </div>

          <div className="stat-card stat-active">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>

          <div className="stat-card stat-inactive">
            <div className="stat-icon">🔴</div>
            <div className="stat-info">
              <div className="stat-value">{stats.inactive}</div>
              <div className="stat-label">Inactive</div>
            </div>
          </div>

          <div className="stat-card stat-maintenance">
            <div className="stat-icon">🔧</div>
            <div className="stat-info">
              <div className="stat-value">{stats.maintenance}</div>
              <div className="stat-label">Maintenance</div>
            </div>
          </div>
        </div>

        {/* Pie chart visualization */}
        <section className="pie-section">
          <div className="pie-card">
            <svg viewBox="0 0 36 36" className="pie-svg">
              <circle
                className="pie-bg"
                r="15.915"
                cx="50%"
                cy="50%"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="6"
              />
              {pieSegments}
            </svg>
            <div className="pie-center">
              <div className="pie-total">{stats.total}</div>
              <div className="pie-label">Devices</div>
            </div>
          </div>
          <div className="pie-legend">
            {statusBreakdown.map((seg) => (
              <div key={seg.label} className="pie-legend-item">
                <span className="legend-color" style={{ backgroundColor: seg.color }} />
                <span>{seg.label}</span>
                <span className="legend-value">{seg.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading devices...</p>
          </div>
        )}

        {/* Device List */}
        {!loading && (
          <DeviceList
            devices={devices}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            users={users}
            onRefresh={fetchDevices}
            onShowDetails={openDeviceDetail}
            deviceTypes={deviceTypes}
            manufacturers={manufacturers}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Network Device Inventory Manager © 2024</p>
      </footer>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          files={detailFiles}
          history={detailHistory}
          loading={detailLoading}
          error={detailError}
          onClose={closeDeviceDetail}
          onRefresh={() => openDeviceDetail(selectedDevice.id)}
        />
      )}
    </div>
  );
}

export default App;
