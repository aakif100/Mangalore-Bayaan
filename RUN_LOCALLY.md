# 🚀 Run Project Locally - Quick Guide

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB Atlas account OR local MongoDB installation

## Quick Start (3 steps)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create `.env` File

Create a `.env` file in the project root:

```env
# MongoDB Connection (use MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mangalorebayaan?retryWrites=true&w=majority

# Or use local MongoDB
# MONGODB_URI=mongodb://127.0.0.1:27017/mangalorebayaan

# Server Port
PORT=3000

# Admin Password
ADMIN_PASSWORD=changeme

# JWT Secret
JWT_SECRET=change_this_secret
```

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

## Access the Application

- **Main Page:** http://localhost:3000/index.html
- **Admin Panel:** http://localhost:3000/admin.html
- **API:** http://localhost:3000/api/health

## Setup MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a FREE (M0) cluster
4. Create a database user
5. Allow network access from anywhere (0.0.0.0/0)
6. Get connection string and add to `.env`

## Troubleshooting

### MongoDB Connection Error

- Check your connection string in `.env`
- Ensure MongoDB Atlas network access allows your IP
- Verify database user credentials

### Port Already in Use

Change `PORT=3001` in `.env` file

### Module Not Found

```bash
rm -rf node_modules
npm install
```

## Full Documentation

For detailed instructions, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

---

**That's it! Your server should be running on http://localhost:3000** 🎉
