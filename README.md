n# Mangalore Bayaan — UI Prototype

This is a simple static UI prototype for the "Mangalore Bayaan" website. It demonstrates a minimalist, peaceful palette with glass-morphism and a responsive card grid for lecture recordings.

Files added:

- `index.html` — main page with header, search, filters, grid, and modal player.
- `css/styles.css` — styling (palette, glass effect, spacing, responsive layout).
- `js/main.js` — sample lecture data, rendering, search/filter, and modal YouTube player.

How to view

1. Open `index.html` in your browser (double-click or run from command line):

   ```cmd
   start index.html
   ```

Notes & next steps

- Replace the sample `lectures` array in `js/main.js` with real data from your backend or a JSON file.
- Consider adding pagination, categories page, upload/admin interface, and deployment steps (Netlify/Vercel/GitHub Pages).
- For deployment, we'll wire a small backend or static JSON and configure production-friendly embeds.

Admin page

An admin page is included to let you add recordings locally and export/import JSON:

- `admin.html` — form to add recordings, list existing ones, delete, export JSON, import JSON.
- `js/admin.js` — stores data in localStorage under key `mangalore_lectures`.

Important: For `admin.html` and `index.html` to share the same stored data (localStorage), serve both pages from the same origin (run a simple static server in the project folder). If you open files directly by double-clicking, some browsers isolate storage per-file which will prevent automatic sharing.

Quick local server (if you have Python installed):

```cmd
python -m http.server 8000
# Then open http://localhost:8000/index.html and http://localhost:8000/admin.html
```

If you prefer Node's small static server and have npm installed:

```cmd
npx serve -s -l 8000
# Then open http://localhost:5000 (or the port printed)
```

## Server (API + MongoDB)

This project includes a Node + Express API that persists lectures to MongoDB. The server serves both the API and static files (`index.html` and `admin.html`).

### Quick Start

**See [RUN_LOCALLY.md](./RUN_LOCALLY.md) for a quick guide, or [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed instructions.**

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file:**

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mangalorebayaan?retryWrites=true&w=majority
   PORT=3000
   ADMIN_PASSWORD=changeme
   JWT_SECRET=change_this_secret
   ```

3. **Start the server:**

   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Main Page: http://localhost:3000/index.html
   - Admin Panel: http://localhost:3000/admin.html
   - API Health: http://localhost:3000/api/health

### API Endpoints

- `GET /api/lectures` - List all lectures
- `GET /api/lectures/:id` - Get single lecture
- `POST /api/lectures` - Create lecture (requires auth)
- `PUT /api/lectures/:id` - Update lecture (requires auth)
- `DELETE /api/lectures/:id` - Delete lecture (requires auth)
- `POST /api/auth/login` - Admin login
- `POST /api/upload` - File upload (requires auth)
- `GET /api/health` - Health check

### MongoDB Setup

- **Option 1: MongoDB Atlas (Recommended)** - Free tier available, no local installation needed
- **Option 2: Local MongoDB** - Install MongoDB locally

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed MongoDB setup instructions.

## Deployment

This project is configured for deployment to Netlify with MongoDB Atlas.

- **Quick Start:** See [QUICK_START.md](./QUICK_START.md)
- **Full Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Checklist:** See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## Documentation

- **[RUN_LOCALLY.md](./RUN_LOCALLY.md)** - Quick guide to run locally
- **[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)** - Detailed local development guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Full deployment guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Deployment checklist
