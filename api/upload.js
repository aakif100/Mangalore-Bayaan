// Netlify Function: POST /api/upload
// Note: For file uploads on Netlify, we'll use a simple approach
// For production, consider using Cloudinary, AWS S3, or Netlify Blob Storage

const { verifyAuth } = require('./_auth');

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
    
    // For now, we'll return an error suggesting to use external storage
    // In production, you should use Cloudinary, AWS S3, or Netlify Blob Storage
    return {
      statusCode: 501,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({ 
        error: 'File upload not yet configured. Please use YouTube links or configure external storage (Cloudinary/AWS S3/Netlify Blob).' 
      })
    };
    
    // TODO: Implement file upload using external storage service
    // Example with base64 (not recommended for large files):
    // const body = JSON.parse(event.body);
    // const fileData = body.file; // base64 encoded
    // Upload to Cloudinary/S3 and return URL
    
  } catch (err) {
    console.error('Error:', err);
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

