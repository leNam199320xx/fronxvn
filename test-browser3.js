const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    
    const failedRequests = [];
    
    page.on('requestfailed', request => {
        const url = request.url();
        if (url.includes('http://localhost:8080')) {
            failedRequests.push(url);
            console.log('FAILED: ' + url);
        }
    });
    
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('404') || text.includes('error')) {
            console.log('CONSOLE: ' + text);
        }
    });
    
    try {
        await page.goto('http://localhost:8080/index.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
    } catch (e) {
        console.log('NavigationError: ' + e.message);
    }
    
    await browser.close();
    
    console.log('\nTotal failed requests:', failedRequests.length);
})();
