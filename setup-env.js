#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up environment variables for GovernmentPhoneCo...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  .env file already exists. Backing up to .env.backup');
  fs.copyFileSync(envPath, path.join(process.cwd(), '.env.backup'));
}

// Create .env file with governmentphoneco configuration
const envContent = `# GovernmentPhoneCo Supabase Configuration
PUBLIC_SUPABASE_URL=https://amhtjazsxrbftufkhwhf.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Site Configuration
PUBLIC_SITE_URL=https://government-phone.org
PUBLIC_SITE_NAME=Government Phone Programs

# Admin Configuration
ADMIN_EMAIL=admin@government-phone.org
ADMIN_PASSWORD=your_admin_password_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Analytics (optional)
PUBLIC_PLAUSIBLE_DOMAIN=government-phone.org
`;

fs.writeFileSync(envPath, envContent);

console.log('✅ Created .env file with GovernmentPhoneCo configuration');
console.log('\n📋 Next steps:');
console.log('1. Get your Supabase anon key from: https://amhtjazsxrbftufkhwhf.supabase.co/project/settings/api');
console.log('2. Replace "your_anon_key_here" in the .env file with your actual anon key');
console.log('3. Set a secure admin password');
console.log('4. Run "npm run dev" to start the development server');
console.log('\n🔗 GitHub Repository: https://github.com/jerzydawg/gov1');
console.log('🔗 Supabase Project: https://amhtjazsxrbftufkhwhf.supabase.co'); 