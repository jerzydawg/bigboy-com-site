#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Building Netlify functions...');

// Create functions directory if it doesn't exist
const functionsDir = path.join(process.cwd(), '.netlify', 'functions');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

// Copy subdomain handler
const sourceFile = path.join(process.cwd(), 'netlify', 'functions', 'subdomain-handler.js');
const destFile = path.join(functionsDir, 'subdomain-handler.js');

if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, destFile);
  console.log('✅ Copied subdomain-handler.js');
} else {
  console.log('❌ Source file not found');
}

console.log('✅ Functions built successfully!');
