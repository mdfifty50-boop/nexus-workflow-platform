const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to page
  await page.goto('http://localhost:5182');
  
  // Test 375px mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.evaluate(() => {
    const element = document.querySelector('#features');
    element?.scrollIntoView();
  });
  await page.screenshot({ path: 'mobile-375-features.png', fullPage: false });
  console.log('✓ Mobile 375px Features section captured');
  
  // Scroll to pricing
  await page.evaluate(() => {
    const element = document.querySelector('#pricing');
    element?.scrollIntoView();
  });
  await page.screenshot({ path: 'mobile-375-pricing.png', fullPage: false });
  console.log('✓ Mobile 375px Pricing section captured');
  
  // Test 768px tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.evaluate(() => {
    const element = document.querySelector('#features');
    element?.scrollIntoView();
  });
  await page.screenshot({ path: 'tablet-768-features.png', fullPage: false });
  console.log('✓ Tablet 768px Features section captured');
  
  // Scroll to pricing
  await page.evaluate(() => {
    const element = document.querySelector('#pricing');
    element?.scrollIntoView();
  });
  await page.screenshot({ path: 'tablet-768-pricing.png', fullPage: false });
  console.log('✓ Tablet 768px Pricing section captured');
  
  // Test 1024px desktop
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => {
    const element = document.querySelector('#features');
    element?.scrollIntoView();
  });
  await page.screenshot({ path: 'desktop-1024-features.png', fullPage: false });
  console.log('✓ Desktop 1024px Features section captured');
  
  await page.evaluate(() => {
    const element = document.querySelector('#pricing');
    element?.scrollIntoView();
  });
  await page.screenshot({ path: 'desktop-1024-pricing.png', fullPage: false });
  console.log('✓ Desktop 1024px Pricing section captured');
  
  await browser.close();
  console.log('\nAll screenshots completed!');
})();
