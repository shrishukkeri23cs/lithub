const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const waitlistRoutes = require('./routes/waitlist');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`LitHub Backend running on port ${PORT}`);
});
