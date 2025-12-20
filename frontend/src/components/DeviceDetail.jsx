import React from 'react';

function DeviceDetail({ device, files = [], loading, error, onClose, onRefresh }) {
  if (!device) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3>Device Details</h3>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        {loading && <p>Loading details...</p>}
        {error && <div className="error-banner compact">{error}</div>}
        {!loading && !error && (
          <>
            <div className="detail-grid">
              <div><strong>Hostname:</strong> {device.hostname}</div>
              <div><strong>IP:</strong> {device.ip_address}</div>
              <div><strong>Type:</strong> {device.device_type_name || device.device_type}</div>
              <div><strong>Manufacturer:</strong> {device.manufacturer_name || '—'}</div>
              <div><strong>Status:</strong> {device.status}</div>
              <div><strong>Location:</strong> {device.location || '—'}</div>
              <div><strong>Assigned To:</strong> {device.assigned_to_name ? `${device.assigned_to_name} (${device.assigned_to_email})` : 'Available'}</div>
              <div><strong>Created:</strong> {new Date(device.created_at).toLocaleString()}</div>
              <div><strong>Assigned At:</strong> {device.assigned_at ? new Date(device.assigned_at).toLocaleString() : '—'}</div>
            </div>
            {device.notes && (
              <div className="detail-notes">
                <strong>Notes:</strong>
                <p>{device.notes}</p>
              </div>
            )}

            <div className="detail-files">
              <div className="section-header">
                <h4>Files</h4>
                {onRefresh && (
                  <button className="btn btn-secondary" onClick={onRefresh}>Refresh</button>
                )}
              </div>
              {files.length === 0 && <p className="muted">No files yet.</p>}
              {files.length > 0 && (
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
          </>
        )}
      </div>
    </div>
  );
}

export default DeviceDetail;

