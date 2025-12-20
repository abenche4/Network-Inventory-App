import React, { useState, useEffect } from 'react';

/**
 * DeviceForm Component
 * Form for creating new devices or editing existing devices
 * 
 * Props:
 * - device: Object containing device data (optional - if provided, form is in edit mode)
 * - onSave: Function to call when form is submitted
 * - onCancel: Function to call when cancel button is clicked
 * - deviceTypes: Lookup array for device types
 * - manufacturers: Lookup array for manufacturers
 */
function DeviceForm({ device, onSave, onCancel, deviceTypes = [], manufacturers = [] }) {
  // Initialize form data from device prop if editing, otherwise use defaults
  const [formData, setFormData] = useState({
    hostname: '',
    ip_address: '',
    device_type: 'Router',
    device_type_id: '',
    manufacturer_id: '',
    location: '',
    status: 'active',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Update form data when device prop changes (for edit mode)
  useEffect(() => {
    if (device) {
      setFormData({
        hostname: device.hostname || '',
        ip_address: device.ip_address || '',
        device_type: device.device_type || 'Router',
        device_type_id: device.device_type_id || '',
        manufacturer_id: device.manufacturer_id || '',
        location: device.location || '',
        status: device.status || 'active',
        notes: device.notes || ''
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        device_type_id: deviceTypes[0]?.id || '',
        device_type: deviceTypes[0]?.name || 'Router'
      }));
    }
  }, [device, deviceTypes]);

  /**
   * Handle input field changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'device_type_id') {
      const selected = deviceTypes.find((t) => String(t.id) === value);
      setFormData(prev => ({
        ...prev,
        device_type_id: value,
        device_type: selected?.name || prev.device_type
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Validate form data
   * @returns {boolean} True if valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate hostname
    if (!formData.hostname.trim()) {
      newErrors.hostname = 'Hostname is required';
    }

    // Validate IP address
    if (!formData.ip_address.trim()) {
      newErrors.ip_address = 'IP address is required';
    } else {
      // Simple IP address format validation
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipRegex.test(formData.ip_address.trim())) {
        newErrors.ip_address = 'Invalid IP address format (e.g., 192.168.1.1)';
      }
    }

    // Validate device type
    if (!formData.device_type && !formData.device_type_id) {
      newErrors.device_type = 'Device type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Trim string values before submitting
      const cleanedData = {
        ...formData,
        hostname: formData.hostname.trim(),
        ip_address: formData.ip_address.trim(),
        location: formData.location.trim() || null,
        notes: formData.notes.trim() || null,
        device_type_id: formData.device_type_id ? Number(formData.device_type_id) : null,
        manufacturer_id: formData.manufacturer_id ? Number(formData.manufacturer_id) : null
      };
      
      onSave(cleanedData);
    }
  };

  const isEditMode = !!device;

  return (
    <div className="device-form-container">
      <h2 className="form-title">
        {isEditMode ? '✏️ Edit Device' : '➕ Add New Device'}
      </h2>
      
      <form className="device-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="hostname">
            Hostname <span className="required">*</span>
          </label>
          <input
            type="text"
            id="hostname"
            name="hostname"
            value={formData.hostname}
            onChange={handleChange}
            required
            className={errors.hostname ? 'input-error' : ''}
            placeholder="e.g., router-main-01"
          />
          {errors.hostname && (
            <span className="error-message">{errors.hostname}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="ip_address">
            IP Address <span className="required">*</span>
          </label>
          <input
            type="text"
            id="ip_address"
            name="ip_address"
            value={formData.ip_address}
            onChange={handleChange}
            required
            pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
            className={errors.ip_address ? 'input-error' : ''}
            placeholder="e.g., 192.168.1.1"
          />
          {errors.ip_address && (
            <span className="error-message">{errors.ip_address}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="device_type">
            Device Type <span className="required">*</span>
          </label>
          {deviceTypes.length > 0 ? (
            <select
              id="device_type_id"
              name="device_type_id"
              value={formData.device_type_id}
              onChange={handleChange}
              required
              className={errors.device_type ? 'input-error' : ''}
            >
              <option value="">Select type</option>
              {deviceTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          ) : (
            <select
              id="device_type"
              name="device_type"
              value={formData.device_type}
              onChange={handleChange}
              required
              className={errors.device_type ? 'input-error' : ''}
            >
              <option value="Router">Router</option>
              <option value="Switch">Switch</option>
              <option value="Firewall">Firewall</option>
              <option value="Server">Server</option>
              <option value="Access Point">Access Point</option>
              <option value="Other">Other</option>
            </select>
          )}
          {errors.device_type && (
            <span className="error-message">{errors.device_type}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="manufacturer_id">
            Manufacturer
          </label>
          <select
            id="manufacturer_id"
            name="manufacturer_id"
            value={formData.manufacturer_id}
            onChange={handleChange}
          >
            <option value="">Select manufacturer</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Data Center - Rack A"
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Additional notes about the device..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEditMode ? '💾 Save Changes' : '➕ Add Device'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default DeviceForm;
