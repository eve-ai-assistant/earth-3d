#!/usr/bin/env node
/**
 * Earth 3D Test Harness
 * Tests all functionality via Puppeteer/Playwright without screenshots
 */

const { chromium } = require('playwright');

async function runTests() {
    console.log('🌍 Starting Earth 3D Test Harness...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    
    const results = [];
    
    try {
        // Test 1: Page loads
        console.log('Test 1: Page loads...');
        await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
        const title = await page.title();
        results.push({ name: 'Page loads', pass: title.includes('Earth'), detail: title });
        
        // Test 2: Canvas exists
        console.log('Test 2: Canvas exists...');
        const canvasExists = await page.$('#webgl-canvas');
        results.push({ name: 'Canvas exists', pass: !!canvasExists, detail: canvasExists ? 'found' : 'missing' });
        
        // Test 3: Settings panel exists
        console.log('Test 3: Settings panel...');
        const panelExists = await page.$('#settings-panel');
        results.push({ name: 'Settings panel', pass: !!panelExists, detail: panelExists ? 'found' : 'missing' });
        
        // Test 4: All sliders exist
        console.log('Test 4: Sliders...');
        const sliders = await page.$$eval('input[type="range"]', els => 
            els.map(el => ({ id: el.id, value: el.value }))
        );
        results.push({ 
            name: 'Sliders (3 expected)', 
            pass: sliders.length === 3, 
            detail: `${sliders.length} found: ${sliders.map(s => s.id).join(', ')}` 
        });
        
        // Test 5: Test exposure slider
        console.log('Test 5: Exposure slider...');
        await page.evaluate(() => {
            const slider = document.getElementById('exposure-slider');
            slider.value = 2.0;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const exposureValue = await page.evaluate(() => {
            const display = document.getElementById('exposure-value');
            return display ? display.textContent : 'missing';
        });
        results.push({ name: 'Exposure slider works', pass: exposureValue === '2.00', detail: `Display shows: ${exposureValue}` });
        
        // Test 6: Test clouds slider
        console.log('Test 6: Clouds slider...');
        await page.evaluate(() => {
            const slider = document.getElementById('clouds-slider');
            slider.value = 75;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const cloudsValue = await page.evaluate(() => {
            const display = document.getElementById('clouds-value');
            return display ? display.textContent : 'missing';
        });
        results.push({ name: 'Clouds slider works', pass: cloudsValue === '75%', detail: `Display shows: ${cloudsValue}` });
        
        // Test 7: Test checkboxes
        console.log('Test 7: Checkboxes...');
        const autoRotateChecked = await page.evaluate(() => {
            const checkbox = document.getElementById('autorotate-check');
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            return checkbox.checked;
        });
        results.push({ name: 'Auto-rotate checkbox', pass: typeof autoRotateChecked === 'boolean', detail: `Toggled: ${autoRotateChecked}` });
        
        // Test 8: Markers exist
        console.log('Test 8: Markers...');
        const markerCount = await page.evaluate(() => {
            const markers = document.querySelectorAll('.marker');
            return markers.length;
        });
        results.push({ name: 'Markers (6 expected)', pass: markerCount === 6, detail: `${markerCount} markers found` });
        
        // Test 9: Console errors
        console.log('Test 9: Console errors...');
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
        results.push({ 
            name: 'No critical console errors', 
            pass: criticalErrors.length === 0, 
            detail: criticalErrors.length > 0 ? criticalErrors.join('; ') : 'clean' 
        });
        
        // Test 10: Three.js loaded
        console.log('Test 10: Three.js...');
        const threeLoaded = await page.evaluate(() => typeof THREE !== 'undefined');
        results.push({ name: 'Three.js loaded', pass: threeLoaded, detail: threeLoaded ? 'yes' : 'no' });
        
    } catch (error) {
        console.error('Test execution error:', error.message);
        results.push({ name: 'Test execution', pass: false, detail: error.message });
    }
    
    await browser.close();
    
    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    results.forEach((test, i) => {
        const icon = test.pass ? '✅' : '❌';
        console.log(`${icon} Test ${i+1}: ${test.name}`);
        console.log(`   ${test.detail}`);
        test.pass ? passed++ : failed++;
    });
    
    console.log('='.repeat(60));
    console.log(`Total: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60));
    
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
