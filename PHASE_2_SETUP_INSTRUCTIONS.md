# Phase 2 Setup Instructions

## ✅ Project Structure Created

All files and folders have been created! Here's what you need to do next:

---

## 🔧 Create Environment Files

Since `.env` files are protected, you need to create them manually:

### Step 1: Create Backend .env File

1. Navigate to the `backend` folder
2. Create a new file named `.env` (with the dot at the beginning)
3. Copy and paste this content:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=network_inventory

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

4. **Replace `your_password_here`** with your actual PostgreSQL password

### Step 2: Create Frontend .env File

1. Navigate to the `frontend` folder
2. Create a new file named `.env` (with the dot at the beginning)
3. Copy and paste this content:

```env
VITE_API_URL=http://localhost:3001
```

**Note:** This is already set correctly for local development. No changes needed unless your backend runs on a different port.

---

## 📦 Install Dependencies

Before proceeding to Phase 3, install all npm packages:

### Backend Dependencies

Open PowerShell/Command Prompt and run:

```powershell
cd backend
npm install
```

You should see packages being installed. Wait for it to complete.

### Frontend Dependencies

From the project root, run:

```powershell
cd frontend
npm install
```

This will install React, Vite, Axios, and other frontend dependencies.

---

## ✅ Verification

After creating the `.env` files and installing dependencies, verify:

- [ ] `backend/.env` file exists with your database password
- [ ] `frontend/.env` file exists
- [ ] `backend/node_modules/` folder exists (created after npm install)
- [ ] `frontend/node_modules/` folder exists (created after npm install)

---

## 📁 Final Project Structure

Your project should now look like this:

```
network-inventory-app/
├── backend/
│   ├── index.js          (Placeholder)
│   ├── queries.js        (Placeholder)
│   ├── .env              ✅ You created this
│   ├── .gitignore        ✅ Created
│   ├── package.json      ✅ Created
│   └── node_modules/     ✅ Created after npm install
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx       (Placeholder)
│   │   ├── App.css       (Placeholder)
│   │   ├── main.jsx      ✅ Created
│   │   └── components/
│   │       ├── DeviceList.jsx    (Placeholder)
│   │       ├── DeviceForm.jsx    (Placeholder)
│   │       └── DeviceItem.jsx    (Placeholder)
│   ├── index.html        ✅ Created
│   ├── .env              ✅ You created this
│   ├── .gitignore        ✅ Created
│   ├── package.json      ✅ Created
│   ├── vite.config.js    ✅ Created
│   └── node_modules/     ✅ Created after npm install
│
├── .gitignore            ✅ Created
├── README.md             ✅ Created
├── database_setup.sql    ✅ From Phase 1
├── PHASE_1_DATABASE_SETUP.md  ✅ From Phase 1
└── PHASE_2_PROJECT_STRUCTURE.md  ✅ Created
```

---

## 🚀 Ready for Phase 3?

Once you've:
1. ✅ Created both `.env` files
2. ✅ Installed backend dependencies (`npm install` in backend folder)
3. ✅ Installed frontend dependencies (`npm install` in frontend folder)

**Let me know and I'll proceed with Phase 3: Backend Implementation!**

In Phase 3, we'll build the complete Express API with PostgreSQL integration.

---

## 💡 Quick Tip

**Windows Users:** If you have trouble creating `.env` files (files starting with a dot), you can:

1. Use a text editor (VS Code, Notepad++) and save as `.env`
2. Or use PowerShell:
   ```powershell
   New-Item -Path "backend\.env" -ItemType File
   New-Item -Path "frontend\.env" -ItemType File
   ```

Then edit the files and add the content shown above.

