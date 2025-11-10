# Deployment Checklist

Use this checklist to ensure your deployment is successful.

## Pre-Deployment

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created (FREE M0 tier)
- [ ] Database user created with admin privileges
- [ ] Network access configured (allow from anywhere: 0.0.0.0/0)
- [ ] MongoDB connection string obtained and saved
- [ ] Connection string tested (password and database name are correct)
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] `.env` file is in `.gitignore` (never commit secrets!)
- [ ] `node_modules` is in `.gitignore`

## Netlify Setup

- [ ] Netlify account created
- [ ] Site connected to GitHub repository
- [ ] Build settings configured:
  - [ ] Build command: `npm install` (or leave empty)
  - [ ] Publish directory: `frontend`
  - [ ] Functions directory: `api`
- [ ] Environment variables set:
  - [ ] `MONGODB_URI` = MongoDB Atlas connection string
  - [ ] `ADMIN_PASSWORD` = Strong admin password
  - [ ] `JWT_SECRET` = Random secret string
- [ ] Site deployed successfully

## Post-Deployment Verification

- [ ] Health endpoint works: `https://your-site.netlify.app/api/health`
- [ ] Lectures API works: `https://your-site.netlify.app/api/lectures` (returns `[]` initially)
- [ ] Frontend loads: `https://your-site.netlify.app/index.html`
- [ ] Admin panel loads: `https://your-site.netlify.app/admin.html`
- [ ] Admin login works (using `ADMIN_PASSWORD`)
- [ ] Can add a lecture via admin panel
- [ ] Can view lecture on main page
- [ ] Can edit a lecture
- [ ] Can delete a lecture

## Security Checklist

- [ ] Changed default `ADMIN_PASSWORD` to a strong password
- [ ] Changed default `JWT_SECRET` to a random secret
- [ ] MongoDB password is strong and secure
- [ ] Environment variables are set in Netlify (not in code)
- [ ] `.env` file is not committed to Git
- [ ] Sensitive data is not in code or configuration files

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate active (automatic with Netlify)
- [ ] File uploads configured (Cloudinary/AWS S3)
- [ ] Analytics enabled
- [ ] Backup strategy for MongoDB

## Troubleshooting

If something doesn't work:

1. **Check Netlify Function Logs:**

   - Netlify Dashboard → Functions → Click function → View logs
   - Look for error messages

2. **Check MongoDB Connection:**

   - Verify connection string is correct
   - Check network access is configured
   - Test connection string locally

3. **Check Environment Variables:**

   - Verify all variables are set in Netlify
   - Redeploy after changing environment variables
   - Check for typos in variable names

4. **Test Locally:**

   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Test locally
   netlify dev
   ```

5. **Check Browser Console:**
   - Open browser DevTools
   - Check Console for JavaScript errors
   - Check Network tab for API errors

## Common Issues

### MongoDB Connection Fails

- **Solution:** Check network access is set to allow from anywhere (0.0.0.0/0)
- **Solution:** Verify connection string password is URL-encoded if it contains special characters
- **Solution:** Check database name is correct in connection string

### Functions Return 500 Error

- **Solution:** Check function logs in Netlify Dashboard
- **Solution:** Verify environment variables are set correctly
- **Solution:** Check MongoDB connection string is valid

### CORS Errors

- **Solution:** CORS is already configured in functions
- **Solution:** Check browser console for specific error messages
- **Solution:** Verify API endpoints are correct

### Admin Login Doesn't Work

- **Solution:** Verify `ADMIN_PASSWORD` environment variable is set correctly
- **Solution:** Check browser console for errors
- **Solution:** Verify JWT_SECRET is set

## Next Steps After Deployment

1. Add your first lecture via admin panel
2. Test all CRUD operations (Create, Read, Update, Delete)
3. Configure file uploads if needed
4. Set up a custom domain
5. Enable analytics
6. Set up monitoring and alerts

## Support Resources

- **Netlify Docs:** https://docs.netlify.com
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Netlify Functions Docs:** https://docs.netlify.com/functions/overview/
- **Mongoose Docs:** https://mongoosejs.com/docs

---

**Remember:** Always test your deployment before sharing it with others!
