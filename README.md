# Network Device Inventory Application

A full-stack web application for managing and tracking network infrastructure devices including routers, switches, firewalls, servers, and access points.

## Features

- Session login/register (email/password) with session cookies
- Users list with roles and active status (auth)
- Full device CRUD with assignment (check-out / check-in)
- Device types & manufacturers lookups (normalized tables)
- Config file uploads per device with versioning and download
- Device detail modal with history (status/assignment) and attachments
- Search + status filter and CSV export (respects filters)
- Dashboard stats, assigned/available badges, and pie-chart visualization

## Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client for Node.js

### Deployment
- **Vercel** - Frontend hosting
- **Railway** - Backend and database hosting

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/download/) (v12 or higher)
- [Git](https://git-scm.com/downloads)

## Local Setup

### 1. Database Setup

Follow the instructions in `PHASE_1_DATABASE_SETUP.md` to set up your PostgreSQL database.

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your database credentials:
# DB_USER=your_username
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432
# DB_DATABASE=network_inventory

# Start the server
npm start
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables (already set in .env)
# VITE_API_URL=http://localhost:3001

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=network_inventory
PORT=3001
FRONTEND_URL=http://localhost:5173         # comma-separated for multiple origins
SESSION_SECURE=false                       # set true on HTTPS deployments
SESSION_SECRET=change_me

# Default admin bootstrap (created at server start if missing)
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_NAME=Admin User
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## API Endpoints

### Base URL: `http://localhost:3001`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Session login |
| POST | `/auth/register` | Create user + start session |
| POST | `/auth/logout` | Session logout |
| GET | `/auth/me` | Current session user |
| GET | `/users` | List users (auth) |
| GET | `/lookups/device-types` | Device types lookup |
| GET | `/lookups/manufacturers` | Manufacturers lookup |
| GET | `/devices` | Get devices (filters: `search`, `status`) |
| GET | `/devices/:id` | Get device by ID |
| POST | `/devices` | Create device (supports device_type_id/manufacturer_id) |
| PUT | `/devices/:id` | Update device |
| DELETE | `/devices/:id` | Delete device |
| POST | `/devices/:id/assign` | Assign (check-out) to user (auth) |
| POST | `/devices/:id/checkin` | Check-in (unassign) device (auth) |
| GET | `/devices/:id/files` | List device files |
| POST | `/devices/:id/files` | Upload device file (multipart/form-data) |
| GET | `/devices/:id/history` | Device history (status/assignment) |
| GET | `/devices/export` | CSV export (respects filters) |

## Project Structure

```
network-device-inventory/
├── backend/
│   ├── index.js          # Express server
│   ├── queries.js        # Database operations
│   ├── .env              # Environment variables
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main app component
│   │   ├── App.css       # Styles
│   │   ├── main.jsx      # React entry point
│   │   └── components/
│   │       ├── DeviceList.jsx
│   │       ├── DeviceForm.jsx
│   │       └── DeviceItem.jsx
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Deployment

### Backend (Railway)
1. Create Railway account
2. Provision PostgreSQL database
3. Deploy backend from GitHub
4. Set environment variables
5. Get production backend URL

### Frontend (Vercel)
1. Update frontend .env with Railway backend URL
2. Connect Vercel to GitHub repository
3. Configure environment variables
4. Deploy

See deployment guide in Phase 6 documentation.

## Development Status

- [x] Database & seed data
- [x] Auth + users
- [x] Devices CRUD with assignment
- [x] Device types/manufacturers lookups
- [x] File uploads per device
- [x] Device history
- [x] Search/filter + CSV export
- [ ] Deployment (pending)
- [ ] Documentation polish

## Future Improvements

- Bulk operations
- Device status monitoring (ping/SNMP)
- Email/alert notifications
- CI/CD with auto-deploy

## License

MIT

## Author

**Adan Benchekroun**

For IT by IT
