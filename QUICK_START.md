# Quick Start Guide - Deploy to Netlify

This is a condensed version of the full deployment guide. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- GitHub account
- Netlify account (sign up at https://netlify.com)
- MongoDB Atlas account (sign up at https://www.mongodb.com/cloud/atlas/register)

## Step 1: Set Up MongoDB Atlas (5 minutes)

1. **Create Account & Cluster:**

   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up and create a **FREE (M0) cluster**
   - Wait 3-5 minutes for cluster to be created

2. **Create Database User:**

   - Go to **Database Access** → **Add New Database User**
   - Choose **Password** authentication
   - Create username and password (save these!)
   - Set privileges to **"Atlas admin"**
   - Click **Add User**

3. **Configure Network Access:**

   - Go to **Network Access** → **Add IP Address**
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click **Confirm**

4. **Get Connection String:**
   - Go to **Database** → Click **Connect** on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `mangalorebayaan`
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mangalorebayaan?retryWrites=true&w=majority`
   - **Save this connection string!**

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for Netlify deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

## Step 3: Deploy to Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Build command:** `npm install` (or leave empty)
   - **Publish directory:** `frontend`
   - **Functions directory:** `api`
5. Click **"Show advanced"** → **"New variable"** and add:
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `ADMIN_PASSWORD` = your admin password (for admin panel)
   - `JWT_SECRET` = a random secret (generate with `openssl rand -base64 32` or use any random string)
6. Click **"Deploy site"**
7. Wait for deployment to complete (2-5 minutes)

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify in your project
netlify init

# Set environment variables
netlify env:set MONGODB_URI "your_mongodb_connection_string"
netlify env:set ADMIN_PASSWORD "your_admin_password"
netlify env:set JWT_SECRET "your_random_jwt_secret"

# Deploy
netlify deploy --prod
```

## Step 4: Verify Deployment

1. Once deployed, Netlify will give you a URL like `https://your-site.netlify.app`
2. Test the API:
   - Visit `https://your-site.netlify.app/api/health` - should show `{"ok": true, "time": ...}`
   - Visit `https://your-site.netlify.app/api/lectures` - should show `[]` (empty array)
3. Test the frontend:
   - Visit `https://your-site.netlify.app/index.html`
   - Visit `https://your-site.netlify.app/admin.html`
4. Login to admin panel:
   - Use the `ADMIN_PASSWORD` you set in environment variables
   - Add your first lecture!

## Troubleshooting

### MongoDB Connection Issues

- **Check Network Access:** Make sure you allowed access from anywhere (0.0.0.0/0) in MongoDB Atlas
- **Check Connection String:** Ensure password is URL-encoded if it contains special characters
- **Check Environment Variables:** In Netlify Dashboard → Site settings → Environment variables

### Function Errors

- **Check Logs:** Netlify Dashboard → Functions → Click function → View logs
- **Test Locally:** Run `netlify dev` to test functions locally

### CORS Issues

- CORS is already configured in the functions
- If issues persist, check browser console for errors

## Important Security Notes

1. **Change Default Passwords:**

   - Never use default passwords in production
   - Use strong, random passwords

2. **JWT Secret:**

   - Use a strong, random JWT secret
   - Generate with: `openssl rand -base64 32`

3. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use Netlify's environment variables for sensitive data

## Next Steps

1. ✅ Add your first lecture via the admin panel
2. ✅ Configure a custom domain (optional)
3. ✅ Set up file uploads (currently disabled - see DEPLOYMENT.md for options)
4. ✅ Enable Netlify analytics (optional)

## File Uploads

Currently, file uploads are disabled. For production, consider:

- **Cloudinary** (free tier: 25 GB storage)
- **AWS S3** (free tier available)
- **YouTube links only** (current setup - works immediately)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed file upload setup instructions.

## Support

If you encounter issues:

1. Check Netlify Function logs
2. Check MongoDB Atlas logs
3. Verify environment variables are set correctly
4. Test API endpoints directly
5. Check browser console for frontend errors

---

**Congratulations! Your site is now live on Netlify! 🎉**

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
