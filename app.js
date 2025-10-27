// Root-level app.js for Railway deployment
// This file installs dependencies and starts the server from the Server directory

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Evangadi Forum Backend...');

// Change to Server directory
const serverPath = path.join(__dirname, 'Server');
process.chdir(serverPath);

console.log('📦 Installing dependencies...');

// First install dependencies, then start the server
const installProcess = spawn('npm', ['install'], {
  stdio: 'inherit',
  cwd: serverPath
});

installProcess.on('error', (error) => {
  console.error('❌ Failed to install dependencies:', error);
  process.exit(1);
});

installProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error('❌ Dependency installation failed');
    process.exit(code);
  }
  
  console.log('✅ Dependencies installed successfully');
  console.log('🚀 Starting server...');
  
  // Start the server after dependencies are installed
  const serverProcess = spawn('npm', ['start'], {
    stdio: 'inherit',
    cwd: serverPath
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    serverProcess.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    serverProcess.kill('SIGINT');
  });
});
