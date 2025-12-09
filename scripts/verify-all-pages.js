import { spawn } from 'child_process';

const testStates = [
  { abbr: 'pa', expected: 2903 },
  { abbr: 'il', expected: 2703 },
  { abbr: 'mn', expected: 2500 },
  { abbr: 'tx', expected: 1825 },
  { abbr: 'co', expected: 477 },
  { abbr: 'dc', expected: 1 }
];

async function checkPage(state) {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', `https://government-phone.co/${state.abbr}/all/`]);
    let html = '';
    curl.stdout.on('data', d => html += d);
    curl.on('close', () => {
      // Look for the city count in the page
      const match = html.match(/(\d[\d,]*)\s*cities\s*with\s*free/i);
      const pageCount = match ? parseInt(match[1].replace(/,/g, '')) : 0;
      resolve({ abbr: state.abbr, expected: state.expected, pageCount, match: pageCount === state.expected });
    });
  });
}

async function run() {
  console.log('Verifying /all/ pages match Supabase counts...\n');
  console.log('State | Expected | Page Shows | Match?');
  console.log('------|----------|------------|-------');
  
  for (const state of testStates) {
    const result = await checkPage(state);
    const status = result.match ? '✓' : '✗';
    console.log(`${result.abbr.toUpperCase().padEnd(5)} | ${String(result.expected).padEnd(8)} | ${String(result.pageCount).padEnd(10)} | ${status}`);
  }
}

run();
