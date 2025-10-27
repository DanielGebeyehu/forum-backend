// Root-level app.js for Railway deployment
// This file simply starts the server from the Server directory

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Evangadi Forum Backend...');

// Change to Server directory and start the app
const serverPath = path.join(__dirname, 'Server');
process.chdir(serverPath);

// Start the server
const child = spawn('npm', ['start'], {
  stdio: 'inherit',
  cwd: serverPath
});

child.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});
