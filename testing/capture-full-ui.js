const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test credentials
const TEST_USER = 'test@test.com';
const TEST_PASSWORD = 'test';
const BASE_URL = 'http://localhost:3000';

// Create output directory
const OUTPUT_DIR = path.join(__dirname, 'ui-screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Define all routes to capture
const routes = {
  public: [
    { path: '/', name: '01-landing' },
    { path: '/login', name: '02-login' },
    { path: '/signup', name: '03-signup' },
    { path: '/blog', name: '04-blog' },
    { path: '/unauthorized', name: '05-unauthorized' }
  ],
  user: [
    { path: '/user/dashboard', name: '06-user-dashboard' },
    { path: '/user/subscriptions', name: '07-user-subscriptions' },
    { path: '/subscriptions/create', name: '08-create-subscription' },
    { path: '/user/orders', name: '09-user-orders' },
    { path: '/user/payments', name: '10-user-payments' },
    { path: '/user/profile', name: '11-user-profile' }
  ],
  admin: [
    { path: '/admin/dashboard', name: '12-admin-dashboard' },
    { path: '/admin/menu', name: '13-admin-menu' },
    { path: '/admin/orders', name: '14-admin-orders' }
  ],
  payment: [
    { path: '/success', name: '15-payment-success' },
    { path: '/cancel', name: '16-payment-cancel' }
  ]
};

async function captureScreenshots() {
  console.log('🚀 Starting UI capture process...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Capture public pages
    console.log('📸 Capturing public pages...');
    for (const route of routes.public) {
      try {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: path.join(OUTPUT_DIR, `${route.name}.png`),
          fullPage: true 
        });
        console.log(`  ✅ ${route.name} - ${route.path}`);
      } catch (error) {
        console.log(`  ❌ ${route.name} - Error: ${error.message}`);
      }
    }
    
    // 2. Login as user
    console.log('\n🔐 Logging in as user...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // Wait for redirect
    console.log('  ✅ Logged in successfully');
    
    // 3. Capture user pages
    console.log('\n📸 Capturing user pages...');
    for (const route of routes.user) {
      try {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: path.join(OUTPUT_DIR, `${route.name}.png`),
          fullPage: true 
        });
        console.log(`  ✅ ${route.name} - ${route.path}`);
      } catch (error) {
        console.log(`  ❌ ${route.name} - Error: ${error.message}`);
      }
    }
    
    // 4. Try admin pages (may fail if test user isn't admin)
    console.log('\n📸 Attempting admin pages...');
    for (const route of routes.admin) {
      try {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        // Check if we were redirected
        const currentUrl = page.url();
        if (currentUrl.includes('unauthorized') || currentUrl.includes('login')) {
          console.log(`  ⚠️  ${route.name} - Unauthorized (need admin role)`);
        } else {
          await page.screenshot({ 
            path: path.join(OUTPUT_DIR, `${route.name}.png`),
            fullPage: true 
          });
          console.log(`  ✅ ${route.name} - ${route.path}`);
        }
      } catch (error) {
        console.log(`  ❌ ${route.name} - Error: ${error.message}`);
      }
    }
    
    // 5. Capture payment pages (these might need special context)
    console.log('\n📸 Capturing payment flow pages...');
    for (const route of routes.payment) {
      try {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: path.join(OUTPUT_DIR, `${route.name}.png`),
          fullPage: true 
        });
        console.log(`  ✅ ${route.name} - ${route.path}`);
      } catch (error) {
        console.log(`  ❌ ${route.name} - Error: ${error.message}`);
      }
    }
    
    // 6. Capture mobile versions of key pages
    console.log('\n📱 Capturing mobile views...');
    await context.close();
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
      isMobile: true
    });
    const mobilePage = await mobileContext.newPage();
    
    const mobileRoutes = [
      { path: '/', name: 'mobile-01-landing' },
      { path: '/login', name: 'mobile-02-login' },
      { path: '/user/dashboard', name: 'mobile-03-dashboard' }
    ];
    
    for (const route of mobileRoutes) {
      try {
        if (route.path.includes('user')) {
          // Login first for protected routes
          await mobilePage.goto(`${BASE_URL}/login`);
          await mobilePage.fill('input[type="email"]', TEST_USER);
          await mobilePage.fill('input[type="password"]', TEST_PASSWORD);
          await mobilePage.click('button[type="submit"]');
          await mobilePage.waitForTimeout(3000);
        }
        
        await mobilePage.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
        await mobilePage.waitForTimeout(1000);
        await mobilePage.screenshot({ 
          path: path.join(OUTPUT_DIR, `${route.name}.png`),
          fullPage: true 
        });
        console.log(`  ✅ ${route.name} - ${route.path}`);
      } catch (error) {
        console.log(`  ❌ ${route.name} - Error: ${error.message}`);
      }
    }
    
    console.log('\n✨ UI capture complete!');
    console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);
    
    // Generate HTML viewer
    generateHTMLViewer();
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

function generateHTMLViewer() {
  const screenshots = fs.readdirSync(OUTPUT_DIR)
    .filter(file => file.endsWith('.png'))
    .sort();
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lums Kitchen - UI Review</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Inter, system-ui, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { 
      color: #C52D2F;
      margin-bottom: 10px;
    }
    .filters {
      margin: 20px 0;
      display: flex;
      gap: 10px;
    }
    .filter-btn {
      padding: 8px 16px;
      border: 2px solid #C52D2F;
      background: white;
      color: #C52D2F;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .filter-btn:hover,
    .filter-btn.active {
      background: #C52D2F;
      color: white;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .screenshot {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }
    .screenshot:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }
    .screenshot-header {
      padding: 15px;
      background: linear-gradient(135deg, #C52D2F, #FF6F3C);
      color: white;
    }
    .screenshot-title {
      font-weight: bold;
      font-size: 14px;
    }
    .screenshot img {
      width: 100%;
      height: auto;
      display: block;
    }
    .mobile { border-left: 5px solid #F1C40F; }
    .admin { border-left: 5px solid #FF6F3C; }
    .user { border-left: 5px solid #C52D2F; }
    .public { border-left: 5px solid #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍴 Lums Kitchen - UI Review Gallery</h1>
    <p>Complete UI audit of all application pages</p>
    <div class="filters">
      <button class="filter-btn active" onclick="filterScreenshots('all')">All Pages</button>
      <button class="filter-btn" onclick="filterScreenshots('public')">Public</button>
      <button class="filter-btn" onclick="filterScreenshots('user')">User</button>
      <button class="filter-btn" onclick="filterScreenshots('admin')">Admin</button>
      <button class="filter-btn" onclick="filterScreenshots('mobile')">Mobile</button>
    </div>
  </div>
  
  <div class="grid" id="screenshot-grid">
    ${screenshots.map(file => {
      const name = file.replace('.png', '').replace(/-/g, ' ');
      const type = file.includes('admin') ? 'admin' : 
                   file.includes('user') ? 'user' :
                   file.includes('mobile') ? 'mobile' : 'public';
      return `
        <div class="screenshot ${type}" data-type="${type}">
          <div class="screenshot-header">
            <div class="screenshot-title">${name}</div>
          </div>
          <img src="${file}" alt="${name}" loading="lazy">
        </div>
      `;
    }).join('')}
  </div>
  
  <script>
    function filterScreenshots(type) {
      const buttons = document.querySelectorAll('.filter-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      const screenshots = document.querySelectorAll('.screenshot');
      screenshots.forEach(shot => {
        if (type === 'all' || shot.dataset.type === type) {
          shot.style.display = 'block';
        } else {
          shot.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html);
  console.log('📄 HTML viewer generated: ui-screenshots/index.html');
}

// Run the capture
captureScreenshots().catch(console.error);