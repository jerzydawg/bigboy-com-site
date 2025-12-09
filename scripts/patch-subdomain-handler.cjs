const fs = require('fs');
const path = 'netlify/functions/subdomain-handler.js';
let src = fs.readFileSync(path, 'utf8');
// Replace host header extraction to prefer x-original-host
src = src.replace(
  /const host = event.headers.host \|\| event.headers.Host;/,
  "const host = (event.headers['x-original-host'] || event.headers['X-Original-Host'] || event.headers.host || event.headers.Host);"
);
fs.writeFileSync(path, src);
console.log('Updated host header handling in subdomain-handler.js');
