// Netlify Function: GET /api/health
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ ok: true, time: Date.now() })
  };
};

