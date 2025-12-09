// Test which hero variants each domain gets
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) ^ char;
  }
  hash = hash ^ (hash >>> 16);
  hash = Math.imul(hash, 0x85ebca6b);
  hash = hash ^ (hash >>> 13);
  return Math.abs(hash);
}

const heroVariants = ['centered', 'split-left', 'split-right', 'diagonal', 'wave', 'gradient-mesh', 'card-overlay', 'minimal'];

const domains = [
  'advanced-site-one.com',
  'advanced-site-two.com', 
  'advanced-site-three.com'
];

domains.forEach(domain => {
  const seed = hashString(domain);
  const variant = heroVariants[seed % heroVariants.length];
  console.log(`${domain}: ${variant} (hash: ${seed})`);
});
