// Netlify Function: Handle /api/lectures routes
// This handles both /api/lectures and /api/lectures/:id
const { connect, Lecture } = require('./_mongodb');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connect();
    const { verifyAuth } = require('./_auth');
    
    // Parse the path to determine if we have an ID
    // Netlify preserves the original request path in event.path
    // Example paths: "/api/lectures" or "/api/lectures/507f1f77bcf86cd799439011"
    let id = null;
    const path = event.path || '';
    
    // Extract ID from path (e.g., /api/lectures/507f1f77bcf86cd799439011)
    const pathMatch = path.match(/\/api\/lectures\/([^/?]+)/);
    if (pathMatch && pathMatch[1]) {
      id = pathMatch[1];
    }
    
    // Also check query parameters (in case ID is passed as query param)
    if (!id && event.queryStringParameters && event.queryStringParameters.id) {
      id = event.queryStringParameters.id;
    }
    
    // Handle OPTIONS for CORS first
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: ''
      };
    }
    
    // If there's an ID, handle single lecture operations
    if (id) {
      if (event.httpMethod === 'GET') {
        // GET /api/lectures/:id
        const doc = await Lecture.findById(id).lean();
        if (!doc) {
          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Lecture not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(doc)
        };
      }
      
      if (event.httpMethod === 'PUT') {
        // PUT /api/lectures/:id - Update lecture (requires auth)
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
        
        const body = JSON.parse(event.body || '{}');
        
        // Normalize tags
        if (body.tags) {
          if (typeof body.tags === 'string') {
            body.tags = body.tags.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
        
        // Only allow specific fields
        const allowed = ['title', 'speaker', 'masjid', 'date', 'tags', 'videoId', 'mediaType', 'mediaUrl'];
        const update = {};
        allowed.forEach(field => {
          if (body[field] !== undefined) {
            update[field] = body[field];
          }
        });
        
        if (update.date) {
          update.date = new Date(update.date);
        }
        
        const updated = await Lecture.findByIdAndUpdate(id, update, { new: true, lean: true });
        if (!updated) {
          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Lecture not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          body: JSON.stringify(updated)
        };
      }
      
      if (event.httpMethod === 'DELETE') {
        // DELETE /api/lectures/:id - Delete lecture (requires auth)
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
        
        const removed = await Lecture.findByIdAndDelete(id);
        if (!removed) {
          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Lecture not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          body: JSON.stringify({ ok: true })
        };
      }
    }
    
    // Handle collection operations (no ID)
    if (!id) {
      if (event.httpMethod === 'GET') {
        // GET /api/lectures - List all lectures
          const docs = await Lecture.find().sort({createdAt: -1}).lean();
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          body: JSON.stringify(docs)
        };
      }
      
      if (event.httpMethod === 'POST') {
        // POST /api/lectures - Create new lecture (requires auth)
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
        
        const body = JSON.parse(event.body || '{}');
        
        // Normalize tags
        let tags = [];
        if (body.tags) {
          if (typeof body.tags === 'string') {
            tags = body.tags.split(',').map(s => s.trim()).filter(Boolean);
          } else if (Array.isArray(body.tags)) {
            tags = body.tags;
          }
        }
        
        const lecture = new Lecture({
          title: body.title,
          speaker: body.speaker || '',
          masjid: body.masjid || '',
          date: body.date ? new Date(body.date) : undefined,
          mediaType: body.mediaType || (body.videoId ? 'youtube' : 'youtube'),
          mediaUrl: body.mediaUrl || '',
          tags: tags,
          videoId: body.videoId || ''
        });
        
        await lecture.save();
        
        return {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          body: JSON.stringify(lecture)
        };
      }
    }

    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

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
