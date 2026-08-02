const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            consoleErrors.push(text);
        } else if (type === 'warning') {
            consoleWarnings.push(text);
        }
    });
    
    page.on('pageerror', error => {
        consoleErrors.push('PageError: ' + error.message);
    });
    
    try {
        await page.goto('http://localhost:8080/index.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Wait a bit more for any async errors
        await new Promise(resolve => setTimeout(resolve, 3000));
        
    } catch (e) {
        consoleErrors.push('NavigationError: ' + e.message);
    }
    
    await browser.close();
    
    console.log('\n=== CONSOLE ERRORS ===');
    if (consoleErrors.length === 0) {
        console.log('No console errors!');
    } else {
        consoleErrors.forEach(e => console.log('  ERROR: ' + e));
    }
    
    console.log('\n=== CONSOLE WARNINGS ===');
    if (consoleWarnings.length === 0) {
        console.log('No console warnings!');
    } else {
        consoleWarnings.forEach(w => console.log('  WARN: ' + w));
    }
    
    if (consoleErrors.length === 0 && consoleWarnings.length === 0) {
        console.log('\n✅ Application loaded successfully with zero console errors!');
        process.exit(0);
    } else {
        console.log('\n❌ Application has console issues');
        process.exit(1);
    }
})();
