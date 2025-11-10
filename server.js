require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
// Support both MONGO_URI and MONGODB_URI for consistency
const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mangalorebayaan';

app.use(cors());
app.use(express.json({limit: '2mb'}));

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
  .then(()=>console.log('Connected to MongoDB'))
  .catch(err=>console.error('MongoDB connection error:', err.message));

// ensure uploads folder exists and serve it
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
// Setup proper MIME types for audio formats
const mimeTypes = {
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac'
};

app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

// multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).slice(2,8) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

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
    const lecture = new Lecture({
      title: body.title,
      speaker: body.speaker || '',
      masjid: body.masjid || '',
      date: body.date ? new Date(body.date) : undefined,
      mediaType: body.mediaType || (body.videoId ? 'youtube' : 'youtube'),
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
    const removed = await Lecture.findByIdAndDelete(req.params.id);
    if(!removed) return res.status(404).json({error:'not found'});
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

// File upload (video/audio)
app.post('/api/upload', authMiddleware, upload.single('file'), (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({error:'no file uploaded'});
    const url = `/uploads/${req.file.filename}`;
    // determine media type
    const mime = req.file.mimetype || '';
    let mediaType = 'video';
    if(mime.startsWith('audio/')) mediaType = 'audio';
    return res.json({ok:true, url, mediaType});
  }catch(err){
    return res.status(500).json({error: err.message});
  }
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, ()=>console.log(`Server listening on port ${PORT}`));
