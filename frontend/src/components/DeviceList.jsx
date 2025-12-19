import React, { useState } from 'react';
import DeviceItem from './DeviceItem';
import DeviceForm from './DeviceForm';

/**
 * DeviceList Component
 * Manages the device list display, creation, and editing
 * 
 * Props:
 * - devices: Array of device objects
 * - onCreate: Function to call when a new device is created
 * - onUpdate: Function to call when a device is updated
 * - onDelete: Function to call when a device is deleted
 * - users: Array of user objects (optional, for assignment)
 * - onRefresh: Function to refresh device list (optional)
 */
function DeviceList({ devices, onCreate, onUpdate, onDelete, users = [], onRefresh }) {
  const [editingDevice, setEditingDevice] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  /**
   * Handle edit button click
   */
  const handleEdit = (device) => {
    setEditingDevice(device);
    setShowCreateForm(false);
  };

  /**
   * Handle cancel edit
   */
  const handleCancelEdit = () => {
    setEditingDevice(null);
  };

  /**
   * Handle save edit
   */
  const handleSaveEdit = (updatedData) => {
    onUpdate(editingDevice.id, updatedData);
    setEditingDevice(null);
  };

  /**
   * Handle cancel create
   */
  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  /**
   * Handle save create
   */
  const handleSaveCreate = (newDevice) => {
    onCreate(newDevice);
    setShowCreateForm(false);
  };

  return (
    <div className="device-list-container">
      <div className="device-list-header">
        <h2>📋 Device List</h2>
        {!showCreateForm && !editingDevice && (
          <button
            className="btn btn-primary btn-add"
            onClick={() => {
              setShowCreateForm(true);
              setEditingDevice(null);
            }}
          >
            ➕ Add New Device
          </button>
        )}
      </div>

      {/* Show create form */}
      {showCreateForm && (
        <DeviceForm
          onSave={handleSaveCreate}
          onCancel={handleCancelCreate}
        />
      )}

      {/* Device list */}
      {!showCreateForm && (
        <div className="device-list">
          {devices.length === 0 ? (
            <div className="empty-state">
              <p>📭 No devices found. Add your first device to get started!</p>
            </div>
          ) : (
            devices.map((device) => (
              editingDevice && editingDevice.id === device.id ? (
                <DeviceForm
                  key={device.id}
                  device={device}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <DeviceItem
                  key={device.id}
                  device={device}
                  onEdit={handleEdit}
                  onDelete={onDelete}
                  users={users}
                  onRefresh={onRefresh}
                />
              )
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DeviceList;
