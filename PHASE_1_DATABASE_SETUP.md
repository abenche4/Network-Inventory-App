# Phase 1: Database Setup Guide

This guide will walk you through creating the PostgreSQL database and setting up the `devices` table with sample data.

---

## Prerequisites

Before starting, ensure you have:
- PostgreSQL installed on your system
- Access to `psql` command-line tool (usually comes with PostgreSQL)
- Basic knowledge of terminal/command prompt

**Verify PostgreSQL installation:**
```bash
psql --version
```

If this command doesn't work, you may need to:
- Add PostgreSQL to your system PATH
- Or use the full path to psql.exe (typically in `C:\Program Files\PostgreSQL\{version}\bin\`)

---

## Step-by-Step Instructions

### Step 1: Open PostgreSQL Command Line

**On Windows:**
1. Open Command Prompt or PowerShell
2. Navigate to PostgreSQL bin directory (if not in PATH):
   ```powershell
   cd "C:\Program Files\PostgreSQL\{your-version}\bin"
   ```
3. Run psql:
   ```powershell
   psql -U postgres
   ```
   
   **Note:** If you have a different username or need to specify host/port:
   ```powershell
   psql -U your_username -h localhost -p 5432
   ```

**Alternative - Using pgAdmin:**
- Open pgAdmin
- Right-click on "Databases" → "Create" → "Database"
- Name it `network_inventory`
- Then use the Query Tool to run the SQL commands below

---

### Step 2: Create the Database

Once you're in the psql prompt (you should see `postgres=#`), run:

```sql
CREATE DATABASE network_inventory;
```

**Expected output:**
```
CREATE DATABASE
```

---

### Step 3: Connect to the New Database

Switch to the new database:

```sql
\c network_inventory
```

**Expected output:**
```
You are now connected to database "network_inventory" as user "postgres".
network_inventory=#
```

---

### Step 4: Create the Devices Table

Copy and paste the entire SQL block below into your psql prompt:

```sql
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(100) NOT NULL,
    ip_address VARCHAR(15) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Expected output:**
```
CREATE TABLE
```

**Verify the table was created:**
```sql
\d devices
```

This will show you the table structure with all columns, data types, and constraints.

---

### Step 5: Insert Sample Data

Insert 5 sample devices representing different device types:

```sql
INSERT INTO devices (hostname, ip_address, device_type, location, status, notes) VALUES
('router-main-01', '192.168.1.1', 'Router', 'Data Center - Rack A', 'active', 'Primary gateway router for main network segment'),
('switch-floor2', '192.168.1.10', 'Switch', 'Building A - Floor 2', 'active', '24-port managed switch for office floor'),
('firewall-perimeter', '203.0.113.1', 'Firewall', 'DMZ Zone', 'active', 'Perimeter firewall with WAF capabilities'),
('ap-conference-room', '192.168.1.50', 'Access Point', 'Conference Room B', 'active', 'Wireless access point with 802.11ax support'),
('server-web-01', '192.168.1.100', 'Server', 'Data Center - Rack B', 'active', 'Web server running Ubuntu 22.04 LTS');
```

**Expected output:**
```
INSERT 0 5
```

---

### Step 6: Verify Sample Data

View all inserted devices:

```sql
SELECT * FROM devices ORDER BY id ASC;
```

**Expected output:** You should see 5 rows with all device information.

**Quick count check:**
```sql
SELECT COUNT(*) FROM devices;
```

Should return: `5`

**Check by device type:**
```sql
SELECT device_type, COUNT(*) FROM devices GROUP BY device_type;
```

This will show how many of each device type you have.

---

### Step 7: Test Query Operations

Test a few queries to ensure everything works:

**Get a single device:**
```sql
SELECT * FROM devices WHERE id = 1;
```

**Search by device type:**
```sql
SELECT * FROM devices WHERE device_type = 'Router';
```

**Search by status:**
```sql
SELECT * FROM devices WHERE status = 'active';
```

---

### Step 8: Exit psql

When you're done, exit the psql prompt:

```sql
\q
```

Or press `Ctrl+D` (on Windows, `Ctrl+Z` then Enter)

---

## Complete SQL Script (For Reference)

Here's the complete SQL script you can save and run all at once:

```sql
-- Create database (run this first, then connect to it)
CREATE DATABASE network_inventory;

-- Connect to database (in psql: \c network_inventory)

-- Create devices table
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(100) NOT NULL,
    ip_address VARCHAR(15) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO devices (hostname, ip_address, device_type, location, status, notes) VALUES
('router-main-01', '192.168.1.1', 'Router', 'Data Center - Rack A', 'active', 'Primary gateway router for main network segment'),
('switch-floor2', '192.168.1.10', 'Switch', 'Building A - Floor 2', 'active', '24-port managed switch for office floor'),
('firewall-perimeter', '203.0.113.1', 'Firewall', 'DMZ Zone', 'active', 'Perimeter firewall with WAF capabilities'),
('ap-conference-room', '192.168.1.50', 'Access Point', 'Conference Room B', 'active', 'Wireless access point with 802.11ax support'),
('server-web-01', '192.168.1.100', 'Server', 'Data Center - Rack B', 'active', 'Web server running Ubuntu 22.04 LTS');

-- Verify data
SELECT * FROM devices ORDER BY id ASC;
```

---

## Troubleshooting

### Error: "database already exists"
- You can drop it and recreate: `DROP DATABASE network_inventory;` (⚠️ WARNING: This deletes all data!)
- Or use the existing database if it's already set up

### Error: "password authentication failed"
- Check your PostgreSQL username and password
- You might need to use: `psql -U postgres -W` (prompts for password)

### Error: "relation already exists"
- The table already exists. You can drop it first:
  ```sql
  DROP TABLE IF EXISTS devices;
  ```
- Then run the CREATE TABLE command again

### Can't find psql command
- On Windows, add PostgreSQL bin directory to PATH:
  1. Search "Environment Variables" in Windows
  2. Edit "Path" variable
  3. Add: `C:\Program Files\PostgreSQL\{version}\bin`
  4. Restart terminal

---

## Verification Checklist

Before moving to Phase 2, verify:

- [ ] Database `network_inventory` exists
- [ ] Table `devices` exists with correct columns
- [ ] 5 sample devices are inserted
- [ ] Can query devices successfully
- [ ] All columns have correct data types

**Quick verification command:**
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;
```

This will show all columns with their properties.

---

## What's Next?

Once you've completed Phase 1 and verified everything works:

1. Make note of your PostgreSQL credentials:
   - Username (usually `postgres`)
   - Password
   - Host (usually `localhost`)
   - Port (usually `5432`)

2. You'll need these for the backend `.env` file in Phase 3.

3. Confirm completion and I'll proceed with Phase 2: Project Structure setup!

---

## Notes

- The `SERIAL` type automatically creates a sequence and sets the column as auto-incrementing
- `DEFAULT CURRENT_TIMESTAMP` will automatically set the creation time
- `NOT NULL` constraints ensure required fields are always filled
- IP addresses are stored as VARCHAR(15) to accommodate IPv4 addresses (format: xxx.xxx.xxx.xxx)

---

**Ready for Phase 2?** Let me know once you've completed the database setup and verified everything works!

