// Netlify Function: GET /api/files/:fileId (Serve files from GridFS)
const { connect } = require('./_mongodb');
const { getFileMetadata } = require('./_gridfs');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: ''
      };
    }
    
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
    // Connect to MongoDB
    await connect();
    
    // Extract fileId from path
    // Handle both /api/files/:fileId and /.netlify/functions/files/:fileId
    let fileId = null;
    const path = event.path || '';
    
    // Try to extract from /api/files/:fileId pattern
    const apiFilesMatch = path.match(/\/api\/files\/([^/?]+)/);
    if (apiFilesMatch) {
      fileId = apiFilesMatch[1];
    } else {
      // Fallback: get last part of path
      const pathParts = path.split('/').filter(Boolean);
      fileId = pathParts[pathParts.length - 1];
    }
    
    // Remove query parameters if any
    if (fileId) {
      fileId = fileId.split('?')[0];
    }
    
    if (!fileId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'File ID required' })
      };
    }
    
    // Get file metadata
    const metadata = await getFileMetadata(fileId);
    if (!metadata) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'File not found' })
      };
    }
    
    // Download file from GridFS
    // For Netlify Functions, we need to read the entire file into memory
    // (GridFS streaming doesn't work well with serverless)
    return new Promise((resolve, reject) => {
      const db = mongoose.connection.db;
      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
      // Use new keyword for ObjectId
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
      const chunks = [];
      
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('error', (err) => {
        console.error('Error downloading file:', err);
        resolve({
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Error downloading file' })
        });
      });
      
      downloadStream.on('end', () => {
        const fileBuffer = Buffer.concat(chunks);
        const base64File = fileBuffer.toString('base64');
        
        // Get MIME type from metadata
        const mimeType = metadata.metadata?.mimetype || metadata.contentType || 'application/octet-stream';
        
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${metadata.metadata?.originalName || metadata.filename}"`,
            'Content-Length': metadata.length.toString(),
            'Access-Control-Allow-Origin': '*',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
          },
          body: base64File,
          isBase64Encoded: true
        });
      });
    });
    
  } catch (err) {
    console.error('Error serving file:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};

