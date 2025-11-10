# GridFS Implementation for File Storage

## Overview

File uploads have been migrated from local disk storage to MongoDB Atlas GridFS. This allows files to be stored directly in your MongoDB database, making it work seamlessly with both local Express server and Netlify Functions (serverless).

## What Changed

### 1. New Files Created

- **`api/_gridfs.js`** - GridFS utility module for file operations (upload, download, delete, metadata)

### 2. Files Modified

#### Backend (Express Server)

- **`server.js`**
  - Removed local disk storage (multer diskStorage)
  - Changed to memory storage (multer memoryStorage)
  - Added GridFS upload functionality
  - Added `/api/files/:fileId` endpoint to serve files from GridFS
  - Updated delete endpoint to remove files from GridFS when deleting lectures
  - Increased request size limit to 50MB for file uploads

#### Netlify Functions

- **`api/upload.js`** - Updated to handle base64 file uploads and store in GridFS
- **`api/files.js`** - New function to serve files from GridFS (returns base64 encoded)
- **`api/lectures.js`** - Updated delete endpoint to remove GridFS files

#### Configuration

- **`netlify.toml`** - Added redirect for `/api/files/*` endpoint
- **`frontend/js/admin.js`** - Updated to detect Netlify environment and send base64 files

## How It Works

### File Upload Flow

1. **Local Express Server:**

   - Frontend sends file as `FormData`
   - Multer receives file in memory
   - File buffer is uploaded to GridFS
   - Returns URL: `/api/files/:fileId`

2. **Netlify Functions:**
   - Frontend detects Netlify environment
   - Converts file to base64
   - Sends as JSON: `{file: "base64data", fileName: "name", mimeType: "type"}`
   - Netlify Function uploads to GridFS
   - Returns URL: `/api/files/:fileId`

### File Serving

- **Express Server:** Streams files directly from GridFS
- **Netlify Functions:** Reads entire file into memory and returns as base64 (required for serverless)

### File Deletion

- When a lecture is deleted, if it has a `mediaUrl` starting with `/api/files/`, the associated GridFS file is also deleted

## MongoDB Collections

GridFS creates two collections in your MongoDB database:

- **`uploads.files`** - Stores file metadata (filename, uploadDate, length, contentType, etc.)
- **`uploads.chunks`** - Stores file data in chunks (default 255KB per chunk)

## Benefits

✅ **Works with Netlify** - No local file system needed
✅ **Scalable** - Files stored in MongoDB Atlas (scales with your database)
✅ **Automatic Backups** - Files backed up with MongoDB Atlas backups
✅ **No External Services** - No need for Cloudinary, AWS S3, etc.
✅ **Consistent** - Same storage for both local and production

## File Size Limits

- **Express Server:** 100MB per file (configurable in `server.js`)
- **Netlify Functions:** Limited by Netlify's function timeout and memory (recommended: < 10MB for optimal performance)

## API Endpoints

### Upload File

- **POST** `/api/upload`
- **Auth:** Required (Bearer token)
- **Request:**
  - Express: `multipart/form-data` with `file` field
  - Netlify: `application/json` with `{file: "base64", fileName: "name", mimeType: "type"}`
- **Response:**
  ```json
  {
    "ok": true,
    "url": "/api/files/507f1f77bcf86cd799439011",
    "fileId": "507f1f77bcf86cd799439011",
    "mediaType": "video",
    "filename": "1234567890-abc123.mp4"
  }
  ```

### Get File

- **GET** `/api/files/:fileId`
- **Auth:** Not required (public files)
- **Response:** File stream (Express) or base64 (Netlify)

## Usage in Frontend

The frontend automatically detects the environment:

```javascript
// Automatically uses FormData for Express or base64 for Netlify
const result = await apiUploadFile(file);
// result.url will be: "/api/files/:fileId"
```

Files are played using the `mediaUrl` from the API:

```javascript
// Video element
<video src="/api/files/507f1f77bcf86cd799439011"></video>

// Audio element
<audio src="/api/files/507f1f77bcf86cd799439011"></audio>
```

## Migration Notes

- **Old uploads:** Files previously stored in `uploads/` directory are not automatically migrated
- **Existing lectures:** Lectures with old `/uploads/` URLs will need to be updated manually
- **New uploads:** All new uploads are stored in GridFS

## Testing

1. **Local Testing:**

   ```bash
   npm run dev
   # Upload a file via admin panel
   # Verify it's stored in MongoDB Atlas GridFS
   ```

2. **Netlify Testing:**
   - Deploy to Netlify
   - Upload a file via admin panel
   - Verify file is accessible at `/api/files/:fileId`

## Troubleshooting

### Files not uploading

- Check MongoDB connection
- Verify `MONGODB_URI` environment variable is set
- Check file size limits
- Check browser console for errors

### Files not playing

- Verify file URL is correct (`/api/files/:fileId`)
- Check file exists in MongoDB GridFS
- Verify MIME type is set correctly
- Check browser console for CORS errors

### Large file uploads failing

- Reduce file size
- Check MongoDB Atlas storage limits
- For Netlify: Consider using smaller files (< 10MB)

## Next Steps

- Monitor MongoDB Atlas storage usage
- Consider implementing file compression for large videos
- Add file validation (file type, size limits)
- Implement file cleanup for orphaned files
- Add file metadata search capabilities

---

**Implementation Complete!** 🎉

Files are now stored in MongoDB Atlas GridFS and work with both Express server and Netlify Functions.
