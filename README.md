# Network Device Inventory Application

A full-stack web application for managing and tracking network infrastructure devices including routers, switches, firewalls, servers, and access points.

## Features

-  Full CRUD operations (Create, Read, Update, Delete)
-  Responsive design for desktop and tablet
-  Modern, professional UI with intuitive navigation
-  Device filtering and search capabilities
-  Secure environment variable management
-  Ready for production deployment

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
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## API Endpoints

### Base URL: `http://localhost:3001`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/devices` | Get all devices |
| GET | `/devices/:id` | Get device by ID |
| POST | `/devices` | Create new device |
| PUT | `/devices/:id` | Update device |
| DELETE | `/devices/:id` | Delete device |

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

- [x] Phase 1: Database Setup ✅
- [x] Phase 2: Project Structure ✅
- [x] Phase 3: Backend Implementation ✅
- [x] Phase 4: Frontend Implementation ✅
- [x] Phase 5: Git Workflow ✅
- [ ] Phase 6: Deployment
- [ ] Phase 7: Documentation

## Future Improvements

- [ ] Device search and filtering
- [ ] Bulk operations
- [ ] Export to CSV/JSON
- [ ] Device status monitoring
- [ ] User authentication
- [ ] Device history tracking
- [ ] Email notifications

## License

MIT

## Author

**Adan Benchekroun**

For IT by IT
