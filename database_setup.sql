-- ============================================
-- Network Inventory Database Setup Script
-- ============================================
-- Run this script to set up your database
-- 
-- Usage:
--   1. Create database first: CREATE DATABASE network_inventory;
--   2. Connect to it: \c network_inventory
--   3. Run this script: \i database_setup.sql
--    OR copy-paste the commands below
-- ============================================

-- Create devices table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(100) NOT NULL,
    ip_address VARCHAR(15) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    device_type_id INT REFERENCES device_types(id),
    manufacturer_id INT REFERENCES manufacturers(id),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    assigned_user_id INT REFERENCES users(id),
    assigned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Config / attachment versions per device
CREATE TABLE IF NOT EXISTS device_files (
    id SERIAL PRIMARY KEY,
    device_id INT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    version INT NOT NULL,
    content_type VARCHAR(100),
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT device_version_unique UNIQUE (device_id, version)
);

-- Seed device types
INSERT INTO device_types (name) VALUES
('Router'), ('Switch'), ('Firewall'), ('Server'), ('Access Point'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- Seed manufacturers
INSERT INTO manufacturers (name) VALUES
('Cisco'), ('Dell'), ('HP'), ('Juniper'), ('Ubiquiti'), ('Aruba')
ON CONFLICT (name) DO NOTHING;

-- Insert 5 sample devices
INSERT INTO devices (hostname, ip_address, device_type, location, status, notes) VALUES
('router-main-01', '192.168.1.1', 'Router', 'Data Center - Rack A', 'active', 'Primary gateway router for main network segment'),
('switch-floor2', '192.168.1.10', 'Switch', 'Building A - Floor 2', 'active', '24-port managed switch for office floor'),
('firewall-perimeter', '203.0.113.1', 'Firewall', 'DMZ Zone', 'active', 'Perimeter firewall with WAF capabilities'),
('ap-conference-room', '192.168.1.50', 'Access Point', 'Conference Room B', 'active', 'Wireless access point with 802.11ax support'),
('server-web-01', '192.168.1.100', 'Server', 'Data Center - Rack B', 'active', 'Web server running Ubuntu 22.04 LTS')
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT * FROM devices ORDER BY id ASC;

-- Display table structure
\d devices

