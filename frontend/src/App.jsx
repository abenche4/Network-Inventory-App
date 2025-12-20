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
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [detailFiles, setDetailFiles] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  /**
   * Fetch all devices from the API
   * Called on component mount and after CRUD operations
   */
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/devices`);
      
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
      const [deviceRes, filesRes] = await Promise.all([
        axios.get(`${API_URL}/devices/${id}`),
        axios.get(`${API_URL}/devices/${id}/files`)
      ]);
      if (deviceRes.data.success) {
        setSelectedDevice(deviceRes.data.data);
      } else {
        setDetailError(deviceRes.data.message || 'Failed to load device');
      }
      if (filesRes.data.success) {
        setDetailFiles(filesRes.data.data || []);
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
