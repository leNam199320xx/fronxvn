const fs = require('fs');
const path = require('path');

const srcDir = 'D:\\fronxvn\\src';
const errors = [];

function resolveImport(filePath, importPath) {
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        return null; // external module, skip
    }
    const resolved = path.resolve(path.dirname(filePath), importPath);
    // Try with and without .js extension
    if (fs.existsSync(resolved)) return resolved;
    if (fs.existsSync(resolved + '.js')) return resolved + '.js';
    return resolved;
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
        
        // Check for import statements - support multi-line by tracking state
        const importMatch = line.match(/^import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
            const resolved = resolveImport(filePath, importMatch[1]);
            if (resolved && !fs.existsSync(resolved)) {
                errors.push({ file: filePath, line: i + 1, import: importMatch[1], resolved });
            }
        }
        
        // Check for dynamic imports
        const dynamicMatch = line.match(/import\(['"]([^'"]+)['"]\)/);
        if (dynamicMatch) {
            const resolved = resolveImport(filePath, dynamicMatch[1]);
            if (resolved && !fs.existsSync(resolved)) {
                errors.push({ file: filePath, line: i + 1, import: dynamicMatch[1], resolved, dynamic: true });
            }
        }
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.js')) {
            checkFile(fullPath);
        }
    }
}

walk(srcDir);

if (errors.length === 0) {
    console.log('All JS imports resolve correctly!');
} else {
    console.log('Broken imports found:');
    errors.forEach(e => console.log('  ' + path.relative('D:\\fronxvn', e.file) + ':' + e.line + ' -> ' + e.resolved + (e.dynamic ? ' (dynamic)' : '')));
}
