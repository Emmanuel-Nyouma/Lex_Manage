const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));
let totalReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace text-slate-500 (but avoid replacing if it already has a dark variant next to it)
    content = content.replace(/text-slate-500\b/g, (match, offset, string) => {
        // If it's already followed by dark:text-slate-xxx or preceded by it, let's just make it text-slate-600
        const neighborhood = string.substring(Math.max(0, offset - 20), Math.min(string.length, offset + 20));
        if (neighborhood.includes('dark:text-slate')) {
            return 'text-slate-600';
        }
        return 'text-slate-600 dark:text-slate-300';
    });

    // Replace text-slate-400
    content = content.replace(/text-slate-400\b/g, (match, offset, string) => {
        const neighborhood = string.substring(Math.max(0, offset - 20), Math.min(string.length, offset + 20));
        if (neighborhood.includes('dark:text-slate')) {
            return 'text-slate-500';
        }
        return 'text-slate-500 dark:text-slate-300';
    });

    // Replace dark:text-slate-400 with dark:text-slate-300 for better contrast
    content = content.replace(/dark:text-slate-400\b/g, 'dark:text-slate-300');
    // Replace dark:text-slate-500 with dark:text-slate-400 for better contrast
    content = content.replace(/dark:text-slate-500\b/g, 'dark:text-slate-400');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        totalReplaced++;
    }
});

console.log(`Replaced contrast classes in ${totalReplaced} files.`);
