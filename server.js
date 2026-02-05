const fs = require('fs');
const path = require('path');
const app = require('./app');
const mongoose = require('mongoose');

const uploadDir = path.join(__dirname, 'public', 'files');
fs.mkdirSync(uploadDir, { recursive: true });

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const DB = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/countwords';

const redactUri = (uri) => uri.replace(/\/\/([^@]+)@/, '//***@');

console.log(`MongoDB URI: ${redactUri(DB)}`);

const autoIndex =
  process.env.MONGOOSE_AUTO_INDEX === 'true' || (process.env.NODE_ENV || 'development') !== 'production';
console.log(`Mongoose autoIndex: ${autoIndex}`);

mongoose
  .connect(DB, {
    autoIndex,
  })
  .then(() => {
    console.log('DB connected successfully');
  })
  .catch((err) => {
    console.error('DB connection error:', err);
  });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log('Server is up listening on port:' + port);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

module.exports = server;
