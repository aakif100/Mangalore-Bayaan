require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const { uploadFile, getFileMetadata, deleteFile } = require('./api/_gridfs');

const app = express();
const PORT = process.env.PORT || 3000;
// Support both MONGO_URI and MONGO_URI for consistency
const MONGO = process.env.MONGO_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mangalorebayaan';

app.use(cors());
app.use(express.json({limit: '50mb'})); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Config
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'changeme';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = '8h';

function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({error:'missing auth'});
  const parts = auth.split(' ');
  if(parts.length!==2 || parts[0] !== 'Bearer') return res.status(401).json({error:'invalid auth format'});
  const token = parts[1];
  try{
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  }catch(err){
    return res.status(401).json({error:'invalid token'});
  }
}

// Mongoose model
const LectureSchema = new mongoose.Schema({
  title: {type: String, required: true},
  speaker: {type: String},
  masjid: {type: String},
  date: {type: Date},
  mediaType: {type: String, enum: ['youtube','video','audio'], default: 'youtube'},
  mediaUrl: {type: String, default: ''},
  tags: [String],
  videoId: {type: String},
  createdAt: {type: Date, default: Date.now}
});
const Lecture = mongoose.model('Lecture', LectureSchema);

// Connect to MongoDB
mongoose.connect(MONGO, {autoIndex:true})
  .then(()=>{
    console.log('Connected to MongoDB');
    // Initialize GridFS bucket after connection
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('GridFS bucket initialized');
  })
  .catch(err=>console.error('MongoDB connection error:', err.message));

// Multer setup for memory storage (we'll get the buffer and upload to GridFS)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// API routes
app.get('/api/health', (req,res)=>res.json({ok:true, time:Date.now()}));

app.get('/api/lectures', async (req,res)=>{
  try{
    const docs = await Lecture.find().sort({createdAt: -1}).lean();
    res.json(docs);
  }catch(err){
    res.status(500).json({error: err.message});
  }
});

app.get('/api/lectures/:id', async (req,res)=>{
  try{
    const doc = await Lecture.findById(req.params.id).lean();
    if(!doc) return res.status(404).json({error:'not found'});
    res.json(doc);
  }catch(err){
    res.status(500).json({error: err.message});
  }
});

app.post('/api/lectures', authMiddleware, async (req,res)=>{
  try{
    const body = req.body;
    // normalize tags
    if(body.tags && typeof body.tags === 'string'){
      body.tags = body.tags.split(',').map(s=>s.trim()).filter(Boolean);
    }
    // Determine mediaType: prioritize body.mediaType, then videoId (youtube), then mediaUrl (video/audio), default to youtube
    let mediaType = body.mediaType;
    if (!mediaType) {
      if (body.videoId) {
        mediaType = 'youtube';
      } else if (body.mediaUrl) {
        // If mediaUrl starts with /api/files/, it's a GridFS file - default to video (should be set by upload)
        // Otherwise check extension
        if (body.mediaUrl.startsWith('/api/files/')) {
          mediaType = 'video'; // Default, but should be set by upload response
        } else {
          mediaType = body.mediaUrl.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i) ? 'audio' : 'video';
        }
      } else {
        mediaType = 'youtube';
      }
    }
    
    const lecture = new Lecture({
      title: body.title,
      speaker: body.speaker || '',
      masjid: body.masjid || '',
      date: body.date ? new Date(body.date) : undefined,
      mediaType: mediaType,
      mediaUrl: body.mediaUrl || '',
      tags: Array.isArray(body.tags) ? body.tags : [],
      videoId: body.videoId || ''
    });
    await lecture.save();
    res.status(201).json(lecture);
  }catch(err){
    res.status(500).json({error: err.message});
  }
});

app.put('/api/lectures/:id', authMiddleware, async (req,res)=>{
  try{
    const body = req.body;
    if(body.tags && typeof body.tags === 'string'){
      body.tags = body.tags.split(',').map(s=>s.trim()).filter(Boolean);
    }
    const update = Object.assign({}, body);
    // ensure only allowed fields
    const allowed = ['title','speaker','masjid','date','tags','videoId','mediaType','mediaUrl'];
    Object.keys(update).forEach(k=>{ if(!allowed.includes(k)) delete update[k]; });
    if(update.date) update.date = new Date(update.date);
    const updated = await Lecture.findByIdAndUpdate(req.params.id, update, {new:true});
    if(!updated) return res.status(404).json({error:'not found'});
    res.json(updated);
  }catch(err){
    res.status(500).json({error: err.message});
  }
});

app.delete('/api/lectures/:id', authMiddleware, async (req,res)=>{
  try{
    const lecture = await Lecture.findById(req.params.id);
    if(!lecture) return res.status(404).json({error:'not found'});
    
    // If lecture has a mediaUrl pointing to GridFS, delete the file
    if(lecture.mediaUrl && lecture.mediaUrl.startsWith('/api/files/')) {
      const fileId = lecture.mediaUrl.split('/').pop();
      try {
        await deleteFile(fileId);
      } catch (err) {
        console.error('Error deleting file from GridFS:', err);
        // Continue with lecture deletion even if file deletion fails
      }
    }
    
    await Lecture.findByIdAndDelete(req.params.id);
    res.json({ok:true});
  }catch(err){
    res.status(500).json({error: err.message});
  }
});

// Auth route for admin login
app.post('/api/auth/login', (req,res)=>{
  const pw = req.body && req.body.password;
  if(!pw) return res.status(400).json({error:'password required'});
  if(pw !== ADMIN_PASS) return res.status(401).json({error:'invalid password'});
  const token = jwt.sign({role:'admin'}, JWT_SECRET, {expiresIn: JWT_EXPIRES});
  res.json({token});
});

// File upload using GridFS
app.post('/api/upload', authMiddleware, upload.single('file'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({error:'no file uploaded'});
    
    // Determine media type
    const mime = req.file.mimetype || '';
    let mediaType = 'video';
    if(mime.startsWith('audio/')) mediaType = 'audio';
    
    // Generate unique filename
    const ext = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    
    // Upload to GridFS
    const result = await uploadFile(
      req.file.buffer,
      filename,
      {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        mediaType: mediaType,
        uploadedAt: new Date()
      }
    );
    
    // Return URL that points to our file serving endpoint
    const url = `/api/files/${result.fileId}`;
    
    return res.json({
      ok: true,
      url: url,
      fileId: result.fileId,
      mediaType: mediaType,
      filename: filename
    });
  }catch(err){
    console.error('Upload error:', err);
    return res.status(500).json({error: err.message});
  }
});

// Serve files from GridFS with range request support
app.get('/api/files/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    // Get file metadata
    const metadata = await getFileMetadata(fileId);
    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const fileSize = metadata.length;
    // GridFS stores metadata in metadata field, and also has contentType field
    const mimeType = metadata.metadata?.mimetype || metadata.contentType || metadata.metadata?.contentType || 'application/octet-stream';
    
    // Handle Range requests (required for video/audio playback)
    const range = req.headers.range;
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length'
      });
      
      // Stream the requested range
      const db = mongoose.connection.db;
      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId), {
        start: start,
        end: end
      });
      
      downloadStream.on('error', (err) => {
        console.error('Error streaming file range:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });
      
      downloadStream.pipe(res);
    } else {
      // No range request - send entire file
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${metadata.metadata?.originalName || metadata.filename}"`);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Stream entire file from GridFS
      const db = mongoose.connection.db;
      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
      
      downloadStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });
      
      downloadStream.pipe(res);
    }
  } catch (err) {
    console.error('Error serving file:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, ()=>console.log(`Server listening on port ${PORT}`));
