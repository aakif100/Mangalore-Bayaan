// Netlify Function: POST /api/upload (GridFS)
const { connect } = require('./_mongodb');
const { uploadFile } = require('./_gridfs');
const { verifyAuth } = require('./_auth');
const path = require('path');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Check authentication
    const authResult = verifyAuth(event);
    if (!authResult.valid) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: authResult.error })
      };
    }
    
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: ''
      };
    }
    
    // Connect to MongoDB
    await connect();
    
    // Parse request body
    let fileBuffer, fileName, mimeType;
    
    // Check if body is base64 encoded (Netlify Functions)
    if (event.isBase64Encoded && event.body) {
      fileBuffer = Buffer.from(event.body, 'base64');
      fileName = event.headers['x-filename'] || event.headers['X-Filename'] || `upload-${Date.now()}`;
      mimeType = event.headers['content-type'] || event.headers['Content-Type'] || 'application/octet-stream';
    } else if (event.body) {
      // Try to parse as JSON (for base64 file data)
      try {
        const body = JSON.parse(event.body);
        if (body.file && body.fileName) {
          fileBuffer = Buffer.from(body.file, 'base64');
          fileName = body.fileName;
          mimeType = body.mimeType || 'application/octet-stream';
        } else {
          throw new Error('Invalid file data format');
        }
      } catch (err) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Could not parse file data. Please send file as base64 in request body with format: {file: "base64data", fileName: "filename", mimeType: "mime/type"}' 
          })
        };
      }
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No file data received' })
      };
    }
    
    // Determine media type
    let mediaType = 'video';
    if (mimeType.startsWith('audio/')) mediaType = 'audio';
    
    // Generate unique filename
    const ext = path.extname(fileName) || '';
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    
    // Upload to GridFS
    const result = await uploadFile(
      fileBuffer,
      uniqueFilename,
      {
        originalName: fileName,
        mimetype: mimeType,
        mediaType: mediaType,
        uploadedAt: new Date()
      }
    );
    
    // Return URL that points to our file serving endpoint
    const url = `/api/files/${result.fileId}`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        ok: true,
        url: url,
        fileId: result.fileId,
        mediaType: mediaType,
        filename: uniqueFilename
      })
    };
    
  } catch (err) {
    console.error('Upload error:', err);
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
