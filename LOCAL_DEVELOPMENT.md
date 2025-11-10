# Local Development Guide

This guide explains how to run the Mangalore Bayaan project locally for development.

## 🚀 Quick Start

You have **two options** for running the project locally:

1. **Express Server** (Recommended for development) - Traditional Node.js server
2. **Netlify Functions** (For testing serverless functions) - Simulates Netlify environment

## Option 1: Express Server (Recommended)

This is the easiest way to develop locally. The Express server (`server.js`) serves both the API and frontend.

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB (local installation OR MongoDB Atlas account)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB Connection
# Option A: Local MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/mangalorebayaan

# Option B: MongoDB Atlas (recommended)
# MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mangalorebayaan?retryWrites=true&w=majority

# Server Port
PORT=3000

# Admin Password (for admin panel login)
ADMIN_PASSWORD=changeme

# JWT Secret (for authentication tokens)
JWT_SECRET=change_this_secret
```

### Step 3: Set Up MongoDB

#### Option A: Local MongoDB

1. **Install MongoDB locally:**

   - Windows: Download from https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: Follow MongoDB installation guide

2. **Start MongoDB:**

   ```bash
   # Windows
   net start MongoDB

   # Mac/Linux
   mongod
   ```

3. **Verify MongoDB is running:**
   ```bash
   mongosh
   ```

#### Option B: MongoDB Atlas (Recommended - No local installation needed)

1. Create a free account at https://www.mongodb.com/cloud/atlas/register
2. Create a FREE (M0) cluster
3. Create a database user
4. Allow network access from anywhere (0.0.0.0/0)
5. Get your connection string and add it to `.env` as `MONGO_URI`

### Step 4: Start the Server

#### Development Mode (with auto-reload):

```bash
npm run dev
```

#### Production Mode:

```bash
npm start
```

The server will start on `http://localhost:3000`

### Step 5: Access the Application

- **Main Page:** http://localhost:3000/ or http://localhost:3000/index.html
- **Admin Panel:** http://localhost:3000/admin.html
- **API Health Check:** http://localhost:3000/api/health
- **API Lectures:** http://localhost:3000/api/lectures

### Features Available with Express Server

✅ Full API functionality
✅ File uploads (saves to `uploads/` folder)
✅ Static file serving
✅ Hot reload with nodemon (in dev mode)
✅ CORS enabled
✅ MongoDB connection

## Option 2: Netlify Functions (For Testing Serverless)

This option tests the Netlify Functions locally, simulating the Netlify environment.

### Prerequisites

- Node.js (v14 or higher)
- npm
- Netlify CLI
- MongoDB Atlas account (local MongoDB won't work with Netlify Functions)

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB Atlas Connection (required for Netlify Functions)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mangalorebayaan?retryWrites=true&w=majority

# Admin Password
ADMIN_PASSWORD=changeme

# JWT Secret
JWT_SECRET=change_this_secret
```

**Note:** Netlify Functions require MongoDB Atlas (not local MongoDB) because they run in a serverless environment.

### Step 3: Start Netlify Dev Server

```bash
netlify dev
```

This will:

- Start a local development server (usually on `http://localhost:8888`)
- Simulate Netlify Functions
- Serve the frontend from the `frontend/` directory
- Use environment variables from `.env`

### Step 4: Access the Application

- **Main Page:** http://localhost:8888/index.html
- **Admin Panel:** http://localhost:8888/admin.html
- **API Health Check:** http://localhost:8888/api/health
- **API Lectures:** http://localhost:8888/api/lectures

### Features Available with Netlify Functions

✅ Netlify Functions simulation
✅ API endpoints (serverless)
✅ Static file serving
❌ File uploads (disabled - requires external storage)
✅ Hot reload
✅ MongoDB Atlas connection

## 🛠️ Development Workflow

### Recommended Workflow

1. **For general development:** Use Express Server (Option 1)

   - Faster iteration
   - File uploads work
   - Easier debugging
   - Can use local MongoDB

2. **Before deploying:** Test with Netlify Functions (Option 2)
   - Verify serverless functions work
   - Test API endpoints
   - Check for any deployment issues

### Making Changes

1. **Frontend changes:**

   - Edit files in `frontend/` directory
   - Changes are reflected immediately (with hot reload)

2. **API changes:**

   - **Express Server:** Edit `server.js`
   - **Netlify Functions:** Edit files in `api/` directory
   - Restart the server to see changes (or use nodemon for Express)

3. **Database changes:**
   - Changes are automatically reflected
   - No migration needed for schema changes (Mongoose handles it)

## 📁 Project Structure

```
mangalore-bayaans/
├── server.js              # Express server (for local development)
├── api/                   # Netlify Functions (for deployment)
│   ├── lectures.js        # Lectures API
│   ├── auth.js            # Authentication
│   ├── _mongodb.js        # MongoDB connection
│   └── ...
├── frontend/              # Frontend files
│   ├── index.html         # Main page
│   ├── admin.html         # Admin panel
│   ├── css/
│   └── js/
├── uploads/               # Uploaded files (Express server only)
├── .env                   # Environment variables (not in git)
└── package.json           # Dependencies
```

## 🔧 Troubleshooting

### MongoDB Connection Issues

**Error: "MongoDB connection error"**

1. **Check MongoDB is running (local):**

   ```bash
   mongosh
   ```

2. **Check connection string:**

   - Verify `MONGO_URI` in `.env` is correct
   - For MongoDB Atlas, ensure password is URL-encoded
   - Check network access is allowed (for Atlas)

3. **Check firewall:**
   - Ensure MongoDB port (27017) is not blocked
   - For Atlas, ensure IP is whitelisted

### Port Already in Use

**Error: "Port 3000 is already in use"**

```bash
# Change port in .env
PORT=3001

# Or kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### Module Not Found

**Error: "Cannot find module"**

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Admin Login Doesn't Work

1. **Check `ADMIN_PASSWORD` in `.env`:**

   - Ensure it matches what you're typing
   - Default is `changeme`

2. **Check browser console:**
   - Look for JavaScript errors
   - Check network requests

### File Uploads Not Working (Netlify Functions)

File uploads are **disabled** in Netlify Functions mode. They only work with the Express server. For Netlify deployment, you'll need to configure external storage (Cloudinary, AWS S3, etc.).

## 🧪 Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/api/health

# Get all lectures
curl http://localhost:3000/api/lectures

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"changeme"}'

# Create lecture (requires token)
curl -X POST http://localhost:3000/api/lectures \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Lecture",
    "speaker": "Test Speaker",
    "videoId": "dQw4w9WgXcQ"
  }'
```

### Using Browser

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make requests and see responses
4. Check Console for errors

## 📝 Environment Variables Reference

| Variable         | Description                             | Required      | Default                                     |
| ---------------- | --------------------------------------- | ------------- | ------------------------------------------- |
| `MONGO_URI`      | MongoDB connection string               | Yes           | `mongodb://127.0.0.1:27017/mangalorebayaan` |
| `MONGODB_URI`    | MongoDB connection string (for Netlify) | Yes (Netlify) | -                                           |
| `PORT`           | Server port                             | No            | `3000`                                      |
| `ADMIN_PASSWORD` | Admin panel password                    | No            | `changeme`                                  |
| `JWT_SECRET`     | JWT token secret                        | No            | `change_this_secret`                        |

## 🎯 Next Steps

1. **Set up your database:**

   - Create MongoDB Atlas account (recommended)
   - Or install MongoDB locally

2. **Configure environment:**

   - Create `.env` file
   - Set up MongoDB connection string
   - Set admin password

3. **Start developing:**

   - Run `npm run dev` for Express server
   - Or `netlify dev` for Netlify Functions
   - Start making changes!

4. **Test your changes:**

   - Test API endpoints
   - Test frontend functionality
   - Test admin panel

5. **Deploy:**
   - When ready, deploy to Netlify
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions

## 💡 Tips

- **Use Express Server for development** - It's faster and easier to work with
- **Use Netlify Functions before deploying** - Ensures everything works in serverless environment
- **Keep `.env` out of Git** - Never commit sensitive data
- **Use MongoDB Atlas** - Easier than local MongoDB, works everywhere
- **Test API endpoints** - Use curl or browser DevTools
- **Check logs** - Server logs show errors and debugging info

## 🆘 Need Help?

- Check the troubleshooting section above
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Check MongoDB Atlas documentation
- Check Netlify Functions documentation

---

**Happy Coding! 🚀**
