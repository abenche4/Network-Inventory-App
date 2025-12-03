import React from 'react';

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
      </div>
    </div>
  );
}

export default DeviceItem;
