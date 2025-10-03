// Vercel Serverless Function entrypoint
// Wrap Express app in a request handler for compatibility
const app = require('../app');

module.exports = (req, res) => app(req, res);
