import fs from 'fs';
import path from 'path';

// Directories to process
const directories = [
  'src',
  'public',
  'scripts'
];

// File extensions to process
const extensions = [
  '.astro',
  '.js',
  '.ts',
  '.json',
  '.md',
  '.html',
  '.css'
];

// Files to skip
const skipFiles = [
  'node_modules',
  '.git',
  'dist',
  '.astro',
  '.netlify',
  'convert-to-org.js'
];

let totalFiles = 0;
let updatedFiles = 0;

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return extensions.includes(ext) || filePath.includes('netlify.toml') || filePath.includes('.gitignore');
}

function shouldSkipDirectory(dirName) {
  return skipFiles.includes(dirName);
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace all .co references with .org references
    let newContent = content
      .replace(/government-phone\.co/gi, 'government-phone.org')
      .replace(/Government-Phone\.Co/gi, 'Government-Phone.Org')
      .replace(/GOVERNMENT-PHONE\.CO/gi, 'GOVERNMENT-PHONE.ORG')
      .replace(/admin@government-phone\.co/gi, 'admin@government-phone.org')
      .replace(/support@government-phone\.co/gi, 'support@government-phone.org');
    
    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      updatedFiles++;
    }
    
    totalFiles++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldSkipDirectory(item)) {
          walkDirectory(fullPath);
        }
      } else if (shouldProcessFile(fullPath)) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
  }
}

console.log('🔍 Starting conversion to .org domain...\n');

// Process each directory
for (const dir of directories) {
  if (fs.existsSync(dir)) {
    console.log(`📁 Processing directory: ${dir}`);
    walkDirectory(dir);
  }
}

// Also process root files
const rootFiles = fs.readdirSync('.').filter(item => {
  const stat = fs.statSync(item);
  return stat.isFile() && shouldProcessFile(item);
});

for (const file of rootFiles) {
  processFile(file);
}

console.log('\n📊 Conversion Summary:');
console.log(`Total files processed: ${totalFiles}`);
console.log(`Files updated: ${updatedFiles}`);
console.log('\n✅ Domain conversion complete!'); 