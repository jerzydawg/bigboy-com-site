// Dynamic middleware that uses site config for domain validation
// Allows Vercel previews and the configured production domain
import { getDomain } from './lib/site-config';

export const onRequest = async (context: any, next: any) => {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();
  
  // Get configured domain from site-config
  const configuredDomain = getDomain();

  const isPreviewHost =
    host.endsWith('.vercel.app') ||
    host === 'localhost' ||
    host === '127.0.0.1';

  const isAllowedProdHost =
    host === configuredDomain ||
    host.endsWith(`.${configuredDomain}`);

  if (isPreviewHost || isAllowedProdHost) {
    // Redirect www to non-www for consistency
    if (host === `www.${configuredDomain}`) {
      const destination = `https://${configuredDomain}${url.pathname}${url.search}`;
      return context.redirect(destination, 301);
    }
    return next();
  }

  // For any other host, redirect to the canonical production domain
  const destination = `https://${configuredDomain}${url.pathname}${url.search}`;
  return context.redirect(destination, 301);
};
