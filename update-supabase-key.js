import fs from 'fs';

console.log('🔑 Supabase Key Update Tool');
console.log('');
console.log('1. Go to: https://amhtjazsxrbftufkhwhf.supabase.co/project/settings/api');
console.log('2. Copy your anon key (starts with eyJ...)');
console.log('3. Enter it below:');
console.log('');

// This is a helper script - you'll need to manually update the .env file
// with your actual Supabase anon key

const envPath = '.env';
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('Current .env content:');
console.log(envContent);
console.log('');
console.log('Replace "your_anon_key_here" with your actual anon key');
console.log('Then run: npm run test-subdomains');
