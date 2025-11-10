# Deployment Guide for Mangalore Bayaan

This guide will help you deploy your Mangalore Bayaan project to Netlify with MongoDB Atlas (free tier).

## Prerequisites

1. A GitHub account (or GitLab/Bitbucket)
2. A Netlify account (free tier)
3. A MongoDB Atlas account (free tier)

## Step 1: Set Up MongoDB Atlas (Free Tier)

### 1.1 Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Choose the **FREE (M0) tier** cluster

### 1.2 Create a Cluster

1. After signing up, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (512 MB storage)
3. Select a cloud provider and region (choose one closest to you)
4. Give your cluster a name (e.g., "MangaloreBayaan")
5. Click **"Create Cluster"** (takes 3-5 minutes)

### 1.3 Configure Database Access

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter a username and password (save these securely!)
5. Under "Database User Privileges", select **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

### 1.4 Configure Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Netlify deployment)
   - Alternatively, you can add Netlify's IP ranges, but allowing from anywhere is easier for serverless functions
4. Click **"Confirm"**

### 1.5 Get Your Connection String

1. In the left sidebar, click **"Database"**
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver and version **"5.5 or later"**
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
6. Replace `<password>` with your actual database user password
7. Replace `<dbname>` with `mangalorebayaan` (or your preferred database name)
8. Your final connection string should look like:
   ```
   mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/mangalorebayaan?retryWrites=true&w=majority
   ```
9. **Save this connection string** - you'll need it for Netlify environment variables

## Step 2: Prepare Your Code for Deployment

### 2.1 Create Environment Variables File

Create a `.env.example` file (don't commit `.env` to Git):

```env
MONGODB_URI=your_mongodb_connection_string_here
ADMIN_PASSWORD=your_secure_admin_password_here
JWT_SECRET=your_random_jwt_secret_here
```

### 2.2 Update .gitignore

Make sure your `.gitignore` includes:

```
node_modules/
.env
.DS_Store
uploads/
*.log
```

### 2.3 Test Locally (Optional)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your MongoDB connection string

3. Test the server locally:
   ```bash
   npm start
   ```

## Step 3: Deploy to Netlify

### 3.1 Push Your Code to GitHub

1. Initialize git (if not already):

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

### 3.2 Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Build command:** `npm install` (or leave empty if you set it in netlify.toml)
   - **Publish directory:** `frontend`
   - **Functions directory:** `api`
5. Click **"Show advanced"** and add environment variables:
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `ADMIN_PASSWORD` = your admin password (for admin panel login)
   - `JWT_SECRET` = a random secret string (e.g., generate with `openssl rand -base64 32`)
6. Click **"Deploy site"**

#### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:

   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:

   ```bash
   netlify login
   ```

3. Initialize Netlify in your project:

   ```bash
   netlify init
   ```

4. Set environment variables:

   ```bash
   netlify env:set MONGODB_URI "your_mongodb_connection_string"
   netlify env:set ADMIN_PASSWORD "your_admin_password"
   netlify env:set JWT_SECRET "your_jwt_secret"
   ```

5. Deploy:
   ```bash
   netlify deploy --prod
   ```

### 3.3 Verify Deployment

1. Once deployed, Netlify will provide you with a URL (e.g., `https://your-site.netlify.app`)
2. Test the API:
   - Visit `https://your-site.netlify.app/api/health` - should return `{"ok": true, "time": ...}`
   - Visit `https://your-site.netlify.app/api/lectures` - should return `[]` (empty array initially)
3. Test the frontend:
   - Visit `https://your-site.netlify.app/index.html`
   - Visit `https://your-site.netlify.app/admin.html`

## Step 4: Configure File Uploads (Optional)

Currently, file uploads are not fully configured for Netlify. For production, you have several options:

### Option 1: Use Cloudinary (Recommended - Free Tier Available)

1. Sign up for [Cloudinary](https://cloudinary.com/) (free tier: 25 GB storage, 25 GB bandwidth/month)
2. Get your Cloudinary credentials
3. Install Cloudinary SDK:
   ```bash
   npm install cloudinary
   ```
4. Update `api/upload.js` to use Cloudinary
5. Add Cloudinary environment variables to Netlify

### Option 2: Use AWS S3 (Free Tier Available)

1. Set up an AWS S3 bucket
2. Configure CORS and permissions
3. Update `api/upload.js` to upload to S3
4. Add AWS credentials to Netlify environment variables

### Option 3: Use Netlify Blob Storage (Paid Feature)

- Requires a paid Netlify plan
- Integrated with Netlify Functions

### Option 4: Use YouTube Links Only (Current Setup)

- For now, you can use YouTube video IDs only
- No file uploads needed
- Works immediately after deployment

## Step 5: Update Frontend API Base URL (If Needed)

The frontend code uses relative URLs (`API_BASE = ''`), which should work automatically with Netlify. However, if you need to point to a different API, update:

- `frontend/js/main.js`: Change `API_BASE` constant
- `frontend/js/admin.js`: Change `API_BASE` constant

## Troubleshooting

### MongoDB Connection Issues

1. **Check MongoDB Atlas Network Access:**

   - Make sure you've allowed access from anywhere (0.0.0.0/0)
   - Or add Netlify's IP ranges

2. **Check Connection String:**

   - Ensure password is URL-encoded if it contains special characters
   - Verify database name is correct

3. **Check Environment Variables:**
   - In Netlify Dashboard → Site settings → Environment variables
   - Ensure `MONGODB_URI` is set correctly
   - Redeploy after changing environment variables

### Function Errors

1. **Check Netlify Function Logs:**

   - Netlify Dashboard → Functions → Click on function → View logs

2. **Test Functions Locally:**
   ```bash
   netlify dev
   ```
   This will start a local development server with Netlify Functions

### CORS Issues

- CORS is already configured in the functions
- If you still have issues, check the `Access-Control-Allow-Origin` headers in function responses

## Security Notes

1. **Change Default Passwords:**

   - Never use default `ADMIN_PASSWORD` in production
   - Use a strong, random password

2. **JWT Secret:**

   - Use a strong, random JWT secret
   - Generate with: `openssl rand -base64 32`

3. **MongoDB Security:**

   - Use a strong database password
   - Consider restricting IP access to Netlify's IP ranges only

4. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use Netlify's environment variables for sensitive data

## Cost Estimation

### Free Tier Limits:

- **Netlify:**

  - 100 GB bandwidth/month
  - 300 build minutes/month
  - 125,000 serverless function invocations/month
  - Unlimited sites

- **MongoDB Atlas:**
  - 512 MB storage
  - Shared RAM and vCPU
  - Suitable for small to medium applications

### When to Upgrade:

- If you exceed 512 MB MongoDB storage
- If you need more than 125,000 function invocations/month
- If you need file uploads (consider Cloudinary free tier first)

## Support

If you encounter issues:

1. Check Netlify Function logs
2. Check MongoDB Atlas logs
3. Verify environment variables are set correctly
4. Test API endpoints directly
5. Check browser console for frontend errors

## Next Steps

1. Add your first lecture via the admin panel
2. Configure file uploads if needed
3. Set up a custom domain (optional)
4. Enable Netlify analytics (optional)
5. Set up automatic backups for MongoDB (optional)

---

**Congratulations! Your Mangalore Bayaan site is now live on Netlify! 🎉**
