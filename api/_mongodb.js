// MongoDB connection utility for Netlify Functions (serverless-friendly)
const mongoose = require('mongoose');

let conn = null;

const options = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 1, // Maintain up to 1 socket connection
  bufferCommands: false, // Disable mongoose buffering
//   bufferMaxEntries: 0 // Disable mongoose buffering
};

exports.connect = async function() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  
  // Check if mongoose is already connected (readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  
  // If connecting, wait for connection
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
    return mongoose.connection;
  }
  
  // Connect if not connected or connecting
  try {
    await mongoose.connect(uri, options);
    return mongoose.connection;
  } catch (error) {
    // If connection fails, throw error
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Lecture Schema
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

// Use mongoose.model which works with the default connection
exports.Lecture = mongoose.models.Lecture || mongoose.model('Lecture', LectureSchema);

