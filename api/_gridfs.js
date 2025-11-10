// GridFS utility for MongoDB file storage
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket = null;

// Initialize GridFS bucket
function getBucket() {
  if (!bucket && mongoose.connection.db) {
    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, {
      bucketName: 'uploads' // Collection name: uploads.files and uploads.chunks
    });
  }
  return bucket;
}

// Helper to convert string to ObjectId
function toObjectId(id) {
  if (typeof id === 'string') {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}

// Upload file to GridFS
exports.uploadFile = async function(buffer, filename, metadata = {}) {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB not connected');
  }
  
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: metadata
    });
    
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve({
        fileId: uploadStream.id.toString(),
        filename: filename,
        length: uploadStream.length
      });
    });
    
    uploadStream.end(buffer);
  });
};

// Download file from GridFS
exports.downloadFile = async function(fileId) {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB not connected');
  }
  
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const downloadStream = bucket.openDownloadStream(toObjectId(fileId));
    
    const chunks = [];
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    downloadStream.on('error', reject);
    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

// Get file metadata
exports.getFileMetadata = async function(fileId) {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB not connected');
  }
  
  const bucket = getBucket();
  const files = await bucket.find({ _id: toObjectId(fileId) }).toArray();
  return files[0] || null;
};

// Delete file from GridFS
exports.deleteFile = async function(fileId) {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB not connected');
  }
  
  const bucket = getBucket();
  await bucket.delete(toObjectId(fileId));
};

// Check if file exists
exports.fileExists = async function(fileId) {
  try {
    const metadata = await exports.getFileMetadata(fileId);
    return metadata !== null;
  } catch (error) {
    return false;
  }
};

