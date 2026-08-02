const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const consoleErrors = [];
    const failedRequests = [];
    
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            consoleErrors.push(text);
        }
    });
    
    page.on('pageerror', error => {
        consoleErrors.push('PageError: ' + error.message);
    });
    
    page.on('requestfailed', request => {
        const url = request.url();
        if (url.includes('http://localhost:8080')) {
            failedRequests.push(url);
        }
    });
    
    try {
        await page.goto('http://localhost:8080/index.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
    } catch (e) {
        consoleErrors.push('NavigationError: ' + e.message);
    }
    
    await browser.close();
    
    console.log('\n=== FAILED REQUESTS (404s) ===');
    if (failedRequests.length === 0) {
        console.log('No failed requests!');
    } else {
        const unique = [...new Set(failedRequests)];
        unique.forEach(url => console.log('  404: ' + url.replace('http://localhost:8080', '')));
    }
    
    console.log('\n=== CONSOLE ERRORS ===');
    if (consoleErrors.length === 0) {
        console.log('No console errors!');
    } else {
        consoleErrors.forEach(e => console.log('  ERROR: ' + e));
    }
    
    const totalIssues = failedRequests.length + consoleErrors.length;
    if (totalIssues === 0) {
        console.log('\n✅ Application loaded successfully!');
        process.exit(0);
    } else {
        console.log(`\n❌ ${failedRequests.length} failed requests, ${consoleErrors.length} console errors`);
        process.exit(1);
    }
})();
