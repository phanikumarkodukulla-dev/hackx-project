/**
 * AI Interview Validation and Job Application System
 * Main Server File
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const resumeRoutes = require('./routes/resumeRoutes');
const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AI Interview Validation System',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/resume', resumeRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/jobs', jobRoutes);

// Serve frontend - home.html as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

// Serve index.html (landing page)
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve static files AFTER route handlers to avoid index.html being served for /
app.use(express.static(path.join(__dirname, '../frontend')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║    AI Interview Validation & Job Application System            ║
║                    Server Started                              ║
╚════════════════════════════════════════════════════════════════╝

📌 Server running on http://localhost:${PORT}
🔗 API Health Check: http://localhost:${PORT}/health
📁 Frontend: http://localhost:${PORT}

⚙️  Configuration:
   - Environment: ${process.env.NODE_ENV || 'development'}
   - Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}
   - SMTP Service: ${process.env.SMTP_SERVICE || 'Not configured'}

💡 Tips:
   1. Update .env file with your Gemini API key
   2. Load jobs data before matching candidates
   3. Ensure resume.json is in /backend/data folder
   4. Configure SMTP for email sending

Ctrl+C to stop the server
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nServer stopped.');
    process.exit(0);
});

module.exports = app;
