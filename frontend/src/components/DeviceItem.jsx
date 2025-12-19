import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * DeviceItem Component
 * Displays an individual device as a card with edit and delete functionality
 * 
 * Props:
 * - device: Object containing device data
 * - onEdit: Function to call when edit button is clicked
 * - onDelete: Function to call when delete button is clicked
 */
function DeviceItem({ device, onEdit, onDelete }) {
  const [filesOpen, setFilesOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    try {
      setFilesLoading(true);
      setFilesError(null);
      const res = await axios.get(`${API_URL}/devices/${device.id}/files`);
      if (res.data.success) {
        setFiles(res.data.data || []);
      } else {
        setFilesError(res.data.message || 'Failed to load files');
      }
    } catch (err) {
      setFilesError(
        err.response?.data?.message || err.message || 'Unable to load files'
      );
    } finally {
      setFilesLoading(false);
    }
  };

  const toggleFiles = () => {
    const next = !filesOpen;
    setFilesOpen(next);
    if (next && files.length === 0) {
      loadFiles();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(
        `${API_URL}/devices/${device.id}/files`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success && res.data.data) {
        setFiles((prev) => [res.data.data, ...prev]);
      }
    } catch (err) {
      setFilesError(
        err.response?.data?.message || err.message || 'Upload failed'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  /**
   * Get status color based on device status
   * @param {string} status - Device status
   * @returns {string} Hex color code
   */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4CAF50'; // Green
      case 'inactive':
        return '#f44336'; // Red
      case 'maintenance':
        return '#ff9800'; // Orange
      default:
        return '#9e9e9e'; // Gray
    }
  };

  /**
   * Get icon emoji based on device type
   * @param {string} type - Device type
   * @returns {string} Emoji icon
   */
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'Router':
        return '🔀';
      case 'Switch':
        return '🔌';
      case 'Firewall':
        return '🛡️';
      case 'Server':
        return '🖥️';
      case 'Access Point':
        return '📡';
      default:
        return '📦';
    }
  };

  const statusColor = getStatusColor(device.status);
  const deviceIcon = getDeviceIcon(device.device_type);

  return (
    <div className="device-item" style={{ borderLeftColor: statusColor }}>
      <div className="device-header">
        <span className="device-icon">{deviceIcon}</span>
        <h3 className="device-hostname">{device.hostname}</h3>
      </div>

      <div className="device-details">
        <div className="device-detail-row">
          <span className="detail-label">IP Address:</span>
          <span className="detail-value">{device.ip_address}</span>
        </div>

        <div className="device-detail-row">
          <span className="detail-label">Type:</span>
          <span className="detail-value device-type">{device.device_type}</span>
        </div>

        {device.location && (
          <div className="device-detail-row">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{device.location}</span>
          </div>
        )}

        <div className="device-detail-row">
          <span className="detail-label">Status:</span>
          <span 
            className="detail-value device-status"
            style={{ color: statusColor }}
          >
            {device.status || 'active'}
          </span>
        </div>

        {device.notes && (
          <div className="device-notes">
            <span className="detail-label">Notes:</span>
            <p className="detail-value">{device.notes}</p>
          </div>
        )}
      </div>

      <div className="device-actions">
        <button
          className="btn btn-edit"
          onClick={() => onEdit(device)}
          aria-label={`Edit ${device.hostname}`}
        >
          ✏️ Edit
        </button>
        <button
          className="btn btn-delete"
          onClick={() => onDelete(device.id)}
          aria-label={`Delete ${device.hostname}`}
        >
          🗑️ Delete
        </button>
        <button
          className="btn btn-secondary"
          onClick={toggleFiles}
          aria-label={`View files for ${device.hostname}`}
        >
          📁 Files
        </button>
      </div>

      {filesOpen && (
        <div className="device-files">
          <div className="files-header">
            <h4>Config / Files</h4>
            <label className="btn btn-primary file-upload">
              {uploading ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {filesError && <div className="error-banner compact">{filesError}</div>}
          {filesLoading && <p>Loading files...</p>}
          {!filesLoading && files.length === 0 && <p className="muted">No files yet.</p>}
          {!filesLoading && files.length > 0 && (
            <ul className="files-list">
              {files.map((f) => (
                <li key={f.id}>
                  <div>
                    <strong>v{f.version}</strong> — {f.filename}
                  </div>
                  <div className="muted small">
                    {new Date(f.uploaded_at).toLocaleString()} • {(f.file_size / 1024).toFixed(1)} KB
                  </div>
                  <a href={f.file_url} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default DeviceItem;
