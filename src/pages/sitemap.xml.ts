import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';
import { getSiteURL } from '../lib/site-config';
import { createCitySlug } from '../lib/slug-utils.js';

export const GET: APIRoute = async () => {
  const SITE_URL = getSiteURL();
  
  // Static pages
  const staticPages = [
    '',
    '/eligibility',
    '/programs',
    '/providers',
    '/faq',
    '/contact',
    '/apply',
    '/lifeline-program',
    '/acp-program',
    '/tribal-programs',
    '/state-programs',
    '/emergency-broadband',
    '/free-government-phone-near-me',
    '/states',
  ];

  // Fetch all states
  let states: Array<{ name: string; abbreviation: string }> = [];
  if (supabase) {
    try {
      const { data } = await supabase
        .from('states')
        .select('name, abbreviation')
        .order('name');
      if (data) states = data;
    } catch (e) {
      console.error('Error fetching states for sitemap:', e);
    }
  }

  // Fetch cities (limit to most popular for performance)
  let cities: Array<{ name: string; state_abbr: string }> = [];
  if (supabase) {
    try {
      const { data } = await supabase
        .from('cities')
        .select('name, states(abbreviation)')
        .order('population', { ascending: false })
        .limit(1000);
      if (data) {
        cities = data.map((city: any) => ({
          name: city.name,
          state_abbr: city.states?.abbreviation || ''
        })).filter((c: any) => c.state_abbr);
      }
    } catch (e) {
      console.error('Error fetching cities for sitemap:', e);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${SITE_URL}${page}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>
`;
  }

  // Add state pages
  for (const state of states) {
    xml += `  <url>
    <loc>${SITE_URL}/${state.abbreviation.toLowerCase()}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  // Add city pages
  for (const city of cities) {
    const citySlug = createCitySlug(city.name);
    xml += `  <url>
    <loc>${SITE_URL}/${city.state_abbr.toLowerCase()}/${citySlug}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
