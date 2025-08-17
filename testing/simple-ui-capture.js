#!/usr/bin/env node

/**
 * Simple JavaScript runner for the UI Route Capture script
 * This allows running the capture without tsx dependency
 */

const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'playwright/e2e/scripts/capture-all-ui-routes.ts');

console.log('🚀 Starting UI Route Capture...');
console.log('This will capture screenshots of all pages in the Osassy\'s Kitchen application');
console.log('=' .repeat(60));

// Check if the Next.js dev server is running
const checkServer = () => {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      resolve(false);
    });

    req.end();
  });
};

const runCapture = async () => {
  console.log('🔍 Checking if Next.js dev server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Next.js dev server is not running on http://localhost:3000');
    console.log('📝 Please start the dev server first:');
    console.log('   npm run dev');
    console.log('\nThen run this script again.');
    process.exit(1);
  }

  console.log('✅ Next.js dev server is running');
  console.log('🎬 Starting screenshot capture...\n');

  // Run the TypeScript file with tsx
  const child = spawn('npx', ['tsx', scriptPath], {
    stdio: 'inherit',
    cwd: path.dirname(__dirname)
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ UI Route Capture completed successfully!');
      console.log('📁 Check the testing/playwright/screenshots/ui-audit/ directory for results');
    } else {
      console.log(`\n❌ UI Route Capture failed with exit code ${code}`);
      console.log('💡 Make sure:');
      console.log('   - Next.js dev server is running (npm run dev)');
      console.log('   - Test credentials (test@test.com / test) exist in your database');
      console.log('   - Playwright is installed (npm run playwright:install)');
    }
  });

  child.on('error', (error) => {
    console.error('❌ Failed to start capture process:', error.message);
    
    if (error.message.includes('tsx')) {
      console.log('\n💡 It seems tsx is not installed. Try installing it:');
      console.log('   npm install -g tsx');
      console.log('   # or');
      console.log('   npx tsx ' + scriptPath);
    }
  });
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Capture process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Capture process terminated');
  process.exit(0);
});

// Run the capture
runCapture().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});