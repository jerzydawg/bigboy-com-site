export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const host = (event.headers['x-original-host'] || event.headers['X-Original-Host'] || event.headers.host || event.headers.Host || '').toLowerCase();
  const path = event.path || '/';

  // Only handle true subdomains like city-state.domain.com
  const labels = host.split('.');
  if (labels.length < 3 || labels[0] === 'www') {
    return { statusCode: 204, headers: { 'X-Bypass-Subdomain-Handler': 'true' }, body: '' };
  }

  try {
    const sub = labels[0]; // e.g., houston-tx
    const parts = sub.split('-');

    let stateSlug = '';
    let citySlug = '';

    if (parts.length >= 2) {
      stateSlug = parts[parts.length - 1].toLowerCase();
      citySlug = parts.slice(0, -1).join('-').toLowerCase();
    } else {
      // Not a city-state; this function shouldn't handle it
      return { statusCode: 204, headers: { 'X-Bypass-Subdomain-Handler': 'true' }, body: '' };
    }

    const trailing = path === '/' ? '/' : path;
    const internalPath = `/${stateSlug}/${citySlug}${trailing}`; // e.g., /tx/houston/

    // Proxy the HTML from the main site so styling matches exactly
    const originUrl = `https://governmentphoneco.netlify.app${internalPath}`;
    const upstream = await fetch(originUrl, {
      headers: {
        'User-Agent': 'SubdomainProxy/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'identity'
      }
    });

    if (upstream.status === 404) {
      // fallback to main
      return { statusCode: 302, headers: { Location: 'https://government-phone.co' }, body: '' };
    }

    let body = await upstream.text();

    // Rewrite sitewide navigation links to subdomain hosts
    const SUBS = {
      '/apply': 'https://apply.government-phone.co',
      '/eligibility': 'https://eligibility.government-phone.co',
      '/check-eligibility': 'https://eligibility.government-phone.co',
      '/providers': 'https://providers.government-phone.co',
      '/faq': 'https://faq.government-phone.co',
      '/contact': 'https://contact.government-phone.co',
      '/programs': 'https://programs.government-phone.co'
    };

    for (const [fromPath, toHost] of Object.entries(SUBS)) {
      const re1 = new RegExp(`href=\\"${fromPath}\\"`, 'g');
      const re2 = new RegExp(`href=\\"${fromPath}/\\"`, 'g');
      body = body.replace(re1, `href=\"${toHost}\"`).replace(re2, `href=\"${toHost}/\"`);
    }

    // Make the subdomain page canonical to itself
    const subdomainUrl = `https://${host}${internalPath}`;
    body = body
      .replace(/<link rel=\"canonical\" href=\"[^\"]*\"\s*\/>/i, `<link rel=\"canonical\" href=\"${subdomainUrl}\"/>`)
      .replace(/(<meta property=\"og:url\" content=\")[^\"]*(\"\s*\/>)/i, `$1${subdomainUrl}$2`)
      .replace(/(\"url\":\s*\")[^\"]*(\")/g, `$1${subdomainUrl}$2`);

    return {
      statusCode: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Proxied-From': originUrl
      },
      body
    };
  } catch (e) {
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
