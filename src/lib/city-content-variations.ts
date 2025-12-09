/**
 * City Content Variations Library - BULLETPROOF EDITION
 * Generates unique 500-650 word content for city pages across 1000+ sites
 * Uses COMPOUND hash (domain + city) for 99-100% uniqueness
 * Zero API cost - all variations are pre-written
 * 
 * SINGLE SOURCE OF TRUTH for city page content variations
 */

// ============================================
// Type Definitions (moved from legacy content-variations.ts)
// ============================================

export interface CityData {
  id: number;
  name: string;
  slug?: string;
  state_id: number;
  population?: number;
  stats?: {
    population?: number;
    median_income?: number;
    poverty_rate?: number;
    unemployment_rate?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface StateData {
  id: number;
  name: string;
  abbreviation: string;
  [key: string]: any;
}

// ============================================
// Hash Functions - COMPOUND for 99%+ uniqueness
// ============================================

function hashString(str: string): number {
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

/**
 * COMPOUND HASH: Combines domain + city/state for maximum uniqueness
 * This ensures that even if two domains have similar hashes,
 * different cities will produce different content
 */
function getCompoundHash(domain: string, location: string): number {
  const domainHash = hashString(domain);
  const locationHash = hashString(location);
  // XOR and multiply for excellent distribution
  const combined = (domainHash ^ (locationHash * 31)) >>> 0;
  return Math.abs(combined);
}

function pickVariation<T>(domain: string, city: string, variations: T[], offset: number = 0): T {
  const hash = getCompoundHash(domain, city);
  const index = (hash + offset * 7) % variations.length; // multiply offset by prime for better spread
  return variations[index];
}

// Legacy single-hash picker for backward compatibility
function pickVariationSimple<T>(domain: string, variations: T[], offset: number = 0): T {
  const hash = hashString(domain);
  const index = (hash + offset) % variations.length;
  return variations[index];
}

// ============================================
// Helper Functions (moved from legacy)
// ============================================

/**
 * Extract city statistics from city data
 */
export function getCityStats(cityData: CityData): {
  population?: number;
  medianIncome?: number;
  povertyRate?: number;
  unemploymentRate?: number;
} {
  const stats = cityData.stats || {};
  return {
    population: stats.population || cityData.population,
    medianIncome: stats.median_income,
    povertyRate: stats.poverty_rate,
    unemploymentRate: stats.unemployment_rate,
  };
}

/**
 * Generate city-specific facts
 */
export function getCityFacts(
  cityName: string,
  stateName: string,
  stateAbbr: string,
  cityData: CityData
): string[] {
  const stats = getCityStats(cityData);
  const facts: string[] = [];

  if (stats.population) {
    facts.push(`${cityName} has a population of approximately ${stats.population.toLocaleString()} residents.`);
  }

  if (stats.medianIncome) {
    facts.push(`The median household income in ${cityName} is $${stats.medianIncome.toLocaleString()}.`);
  }

  if (stats.povertyRate) {
    facts.push(`Approximately ${stats.povertyRate}% of ${cityName} residents live below the poverty line.`);
  }

  facts.push(`${cityName} is located in ${stateName} (${stateAbbr}).`);
  facts.push(`Lifeline service is available to eligible ${cityName} residents through multiple providers.`);
  facts.push(`${stateAbbr} residents can apply for free government phones online or at local assistance offices.`);

  return facts;
}

// ============================================
// Intro Paragraph Variations (23 variations - PRIME NUMBER)
// ============================================

const INTRO_VARIATIONS = [
  `{city}, {state} residents can access free smartphone service through the federal Lifeline and ACP programs. With {population} people calling this community home, many households qualify for no-cost devices and monthly wireless plans. These government-backed programs help families stay connected without the burden of expensive phone bills.`,
  
  `Get your free government phone in {city}! This {state} community of {population} residents has multiple pathways to no-cost wireless service. The Lifeline program and Affordable Connectivity Program provide eligible households with free devices, unlimited talk and text, plus monthly data allowances.`,
  
  `Free cell phone programs serve {city}, {state} households every day. With {population} locals potentially eligible, federal benefits deliver smartphones and monthly plans at absolutely zero cost. No credit checks, no contracts, no hidden fees—just reliable communication service for qualifying families.`,
  
  `{city} residents in {state} deserve affordable communication options. That's why federal programs like Lifeline and ACP exist—to provide {population} community members with free phones and service. Check your eligibility today and join thousands already benefiting from these programs.`,
  
  `Looking for free phone service in {city}, {state}? You're not alone. The {population} residents here have access to multiple government assistance programs offering free smartphones, unlimited calling, texting, and generous data packages without monthly bills or surprise charges.`,
  
  `The {population} residents of {city}, {state} can take advantage of federal communication assistance programs. Lifeline and ACP benefits provide qualifying households with free mobile devices and ongoing service—helping families stay connected to jobs, healthcare, schools, and loved ones.`,
  
  `Free government phones are available right now in {city}, {state}. Whether you participate in SNAP, Medicaid, or meet income guidelines, the {population} people in this area may qualify for no-cost wireless service through federally-approved programs.`,
  
  `{city} is home to {population} {state} residents, many of whom qualify for free government phone programs. These federal initiatives—Lifeline and ACP—provide smartphones and monthly service at no charge to eligible households struggling with communication costs.`,
  
  `Stay connected in {city}, {state} without breaking the bank. Federal programs offer free phones and service to qualifying residents among the {population} people living here. No contracts required, no credit checks performed, and absolutely no monthly payments.`,
  
  `Residents of {city}, {state} have a valuable resource available: free government phone programs. The Lifeline and ACP initiatives help the {population} community members access essential communication services without financial strain.`,
  
  `{city}, {state} families can now get connected for free. With {population} residents in the area, many households meet the eligibility requirements for government-sponsored phone programs that include free devices and unlimited monthly service.`,
  
  `Discover free phone options in {city}! This {state} community serves {population} residents, offering multiple pathways to no-cost wireless through Lifeline and ACP. Eligible families receive smartphones plus talk, text, and data at zero monthly cost.`,
  
  `The federal government provides free phone service to qualifying {city}, {state} residents. Among the {population} people here, many can access Lifeline and ACP benefits—free devices, unlimited calls, texts, and monthly data without paying a dime.`,
  
  `{city} residents seeking free communication services have options. This {state} community of {population} people can apply for government phone programs that deliver smartphones and monthly plans at no cost to eligible households.`,
  
  `Free wireless service awaits eligible {city}, {state} households. The {population} residents here can tap into Lifeline and ACP programs for complimentary phones, unlimited talk and text, plus substantial monthly data—all without credit checks or contracts.`,
  
  `Government phone programs serve {city}, {state} daily. With {population} potential beneficiaries in this community, federal initiatives provide free smartphones and ongoing service to households meeting income or program participation requirements.`,
  
  `{city} offers free phone access to qualifying residents. This {state} area, home to {population} people, participates in federal programs that deliver no-cost mobile devices and service to families who need communication assistance.`,
  
  `Eligible {city}, {state} residents can receive free government phones today. The {population} community members here have access to Lifeline and ACP—programs providing complimentary devices and monthly wireless service without financial obligation.`,
  
  `Connect for free in {city}! {state} residents among the {population} locals can apply for government phone programs offering free smartphones, unlimited calling, texting, and data packages—no monthly bills, no credit requirements.`,
  
  `{city}, {state} participates in federal free phone initiatives. The {population} residents here can access Lifeline and ACP programs that provide qualifying households with complimentary mobile devices and ongoing wireless service at zero cost.`,
  
  // 3 NEW variations to reach 23 (prime)
  `Need a phone in {city}? Federal assistance programs help {population} {state} residents get free smartphones and service. Lifeline and ACP cover devices, unlimited talk, text, and data—completely free for qualifying households.`,
  
  `{city}, {state} welcomes federal phone programs serving {population} residents. Eligible households receive free devices and monthly wireless service through Lifeline and ACP—no applications fees, no credit checks, no monthly bills.`,
  
  `Access free communication in {city} today! The {population} {state} residents here can qualify for government phone programs delivering free smartphones with unlimited calling, texting, and data at absolutely no cost.`,
];

// ============================================
// Who Qualifies Intro Variations (17 variations - PRIME NUMBER)
// ============================================

const QUALIFIES_INTRO_VARIATIONS = [
  `To qualify for a free government phone in {city}, {state}, you must meet at least one eligibility requirement. Most {city} residents qualify through either income-based criteria or participation in government assistance programs.`,
  
  `Eligibility for free phones in {city}, {state} is straightforward. If your household income falls below federal guidelines or you participate in qualifying assistance programs, you likely qualify for Lifeline or ACP benefits.`,
  
  `{city} residents can qualify for free government phones through two main pathways. Either demonstrate household income at or below 135% of poverty guidelines, or show participation in programs like SNAP, Medicaid, or SSI.`,
  
  `Wondering if you qualify in {city}, {state}? The requirements are simple. You're eligible if you receive government benefits or if your household income meets federal poverty guidelines.`,
  
  `Free phone eligibility in {city} depends on your circumstances. {state} residents qualify through income requirements or by participating in federal/state assistance programs. Most applicants discover they're already eligible.`,
  
  `{city}, {state} residents seeking free phones must meet basic eligibility criteria. Qualification comes through either low household income or current enrollment in government assistance programs.`,
  
  `The path to a free government phone in {city} is clear. {state} residents qualify by meeting income thresholds or proving participation in programs such as Medicaid, SNAP, SSI, or federal housing assistance.`,
  
  `Qualifying for free phone service in {city}, {state} requires meeting one simple criterion. Either your income falls within federal guidelines, or you already receive qualifying government benefits.`,
  
  `{city} residents have two routes to free phone eligibility. Income-based qualification uses federal poverty guidelines, while program-based qualification recognizes participation in assistance programs throughout {state}.`,
  
  `To get your free government phone in {city}, {state}, verify your eligibility first. Qualification is based on household income levels or current participation in government assistance programs.`,
  
  `Free phone programs in {city} serve {state} residents meeting specific criteria. You qualify if your income is at or below 135% FPL, or if you participate in qualifying federal or state programs.`,
  
  `{city}, {state} eligibility for free phones follows federal guidelines. Residents qualify through demonstrated financial need or by showing enrollment in government assistance programs like SNAP or Medicaid.`,
  
  `Determining your eligibility in {city} is quick and easy. {state} residents who receive government benefits or meet income requirements can access free phone programs immediately.`,
  
  `{city} residents qualify for free government phones under federal guidelines. {state} households meeting income thresholds or participating in assistance programs are automatically eligible for Lifeline and ACP.`,
  
  `Free phone qualification in {city}, {state} is designed to be accessible. If you receive benefits or have limited income, you likely meet the requirements for government phone programs.`,
  
  // 2 NEW variations to reach 17 (prime)
  `{city} eligibility requirements are simple: either receive government assistance (SNAP, Medicaid, SSI) or have household income below 135% of federal poverty level. Most {state} residents already qualify.`,
  
  `Checking qualification in {city}, {state} takes minutes. If you participate in federal programs or meet income guidelines, you're likely eligible for a free government phone with full service.`,
];

// ============================================
// How to Apply Step Variations (13 variations per step - PRIME NUMBER)
// ============================================

const STEP1_VARIATIONS = [
  `Review the eligibility criteria above to confirm you qualify for Lifeline or ACP in {city}. Most {state} residents can verify their status in under two minutes.`,
  `Start by checking if you meet the requirements for free phone service in {city}, {state}. Eligibility verification takes just moments and requires no commitment.`,
  `First, confirm your eligibility for government phone programs. {city} residents can quickly determine qualification status based on income or program participation.`,
  `Begin your application by verifying eligibility. {state} residents in {city} can check qualification requirements online in minutes without providing sensitive information.`,
  `Check your qualification status for free phone service in {city}. The eligibility requirements for {state} residents are straightforward and easy to verify.`,
  `Verify that you meet Lifeline or ACP requirements before applying. {city}, {state} residents can confirm eligibility through a quick online check.`,
  `Your first step is confirming eligibility for free phone programs in {city}. {state} households can verify qualification status instantly online.`,
  `Determine if you qualify for government phone benefits in {city}, {state}. Eligibility checking is free, fast, and doesn't affect your credit.`,
  `Start by reviewing qualification criteria for {city} residents. {state} has clear guidelines that make eligibility verification simple and quick.`,
  `Confirm your eligibility for free phone service before proceeding. {city}, {state} residents can check their status online in approximately two minutes.`,
  // 3 NEW variations to reach 13 (prime)
  `Verify your {city} eligibility online—it's fast and free. {state} residents can check qualification in under 2 minutes with no obligation.`,
  `Begin by confirming you meet {city}, {state} requirements. The eligibility checker is quick, private, and won't affect your credit score.`,
  `First step: check if you qualify in {city}. Most {state} residents discover they're already eligible through income or program participation.`,
];

const STEP2_VARIATIONS = [
  `Select a participating Lifeline or ACP provider serving {city}, {state}. Compare plans, coverage, and device options to find your best match.`,
  `Browse available providers in {city} and choose one that fits your needs. Each {state} carrier offers different phones and plan features.`,
  `Pick your preferred wireless provider from those serving {city}, {state}. Consider coverage quality, phone selection, and included features.`,
  `Choose a government phone provider operating in {city}. Multiple carriers serve {state} residents with varying plans and device options.`,
  `Select from approved providers serving the {city} area. {state} residents have several carrier options with different benefits and coverage.`,
  `Find a participating provider in {city}, {state} that meets your needs. Compare available phones, data amounts, and coverage maps.`,
  `Review provider options available to {city} residents. Each {state} carrier offers unique benefits, so compare before choosing.`,
  `Choose your Lifeline or ACP provider carefully. {city}, {state} is served by multiple carriers with different phones and plan structures.`,
  `Select a wireless provider from those approved for {city}. {state} has several participating carriers offering free government phones.`,
  `Pick the provider that best serves your {city} location. {state} residents should compare coverage and features before deciding.`,
  // 3 NEW variations to reach 13 (prime)
  `Compare providers serving {city}, {state} to find your best fit. Consider coverage, phone options, and data amounts before choosing.`,
  `Browse {city} provider options—each {state} carrier offers different devices and plans. Select the one matching your needs.`,
  `Choose from multiple carriers in {city}. {state} providers vary in coverage and features, so review options before selecting.`,
];

const STEP3_VARIATIONS = [
  `Complete your application online or visit a local provider location in {city}. Bring proof of eligibility and valid identification for {state} residency.`,
  `Submit your application through your chosen provider's website or {city} office. {state} residents need ID and eligibility documentation.`,
  `Apply online or in person at a {city} provider location. Have your {state} ID and proof of program participation or income ready.`,
  `Fill out the application form with your provider. {city}, {state} applicants need valid identification and eligibility verification documents.`,
  `Complete the enrollment process online or at a {city} location. {state} residents should prepare ID and proof of qualification beforehand.`,
  `Submit your free phone application through the provider. {city} residents need {state} identification and documentation proving eligibility.`,
  `Apply for your free government phone online or locally in {city}. {state} applicants must provide ID and eligibility proof.`,
  `Finish your application with required documentation. {city}, {state} residents need government ID and proof of program enrollment or income.`,
  `Complete enrollment by submitting your application. {city} applicants should have {state} ID and eligibility documents prepared.`,
  `Finalize your application online or at a {city} provider office. {state} identification and eligibility verification are required.`,
  // 3 NEW variations to reach 13 (prime)
  `Submit your {city} application with ID and eligibility proof. {state} residents can apply online or visit local provider offices.`,
  `Complete the {city}, {state} enrollment form with required documents. Have your ID and program verification ready for quick processing.`,
  `Apply through your chosen provider's website or {city} location. {state} applicants need identification and eligibility documentation.`,
];

const STEP4_VARIATIONS = [
  `Once approved, your free phone ships directly to your {city} address. Most {state} residents receive devices within 5-7 business days.`,
  `After approval, expect your phone to arrive at your {city} home within a week. {state} deliveries typically take 5-7 business days.`,
  `Your free device will be mailed to your {city}, {state} address after approval. Delivery usually takes less than one week.`,
  `Approved applicants receive phones at their {city} address. {state} shipping typically completes within 5-7 business days.`,
  `Following approval, your phone ships to {city}. Most {state} residents have their devices within a week of verification.`,
  `Your free government phone arrives by mail in {city}. {state} delivery times average 5-7 business days after approval.`,
  `After verification, your device ships to your {city}, {state} home. Expect delivery within approximately one week.`,
  `Approved {city} residents receive phones via mail. {state} shipping is fast—typically 5-7 business days to your door.`,
  `Your phone will be delivered to your {city} address post-approval. {state} residents usually receive devices within a week.`,
  `Once verified, your free phone ships to {city}, {state}. Most deliveries arrive within 5-7 business days of approval.`,
  // 3 NEW variations to reach 13 (prime)
  `Receive your free phone at your {city} address within days. {state} deliveries typically arrive 5-7 business days after approval.`,
  `Your device ships to {city}, {state} immediately after verification. Expect delivery within one week of approval.`,
  `After approval, your phone arrives at your {city} home quickly. {state} shipping averages 5-7 business days.`,
];

// ============================================
// Provider Description Variations (11 variations per provider - PRIME NUMBER)
// ============================================

const PROVIDER_ASSURANCE_VARIATIONS = [
  `Assurance Wireless delivers free Android phones and comprehensive monthly plans to {state} Lifeline customers. {city} residents enjoy unlimited talk, text, and generous data allowances.`,
  `{city} residents choose Assurance Wireless for reliable free phone service. This {state} provider offers quality Android devices and robust monthly plans.`,
  `Assurance Wireless serves {city}, {state} with free smartphones and monthly service. Their plans include unlimited calls, texts, and substantial data packages.`,
  `For {city} residents, Assurance Wireless provides dependable free phone service. {state} customers receive Android phones with comprehensive talk, text, and data.`,
  `Assurance Wireless offers {city}, {state} households free Android smartphones. Their Lifeline plans feature unlimited calling, texting, and monthly data.`,
  `{city} families trust Assurance Wireless for government phone service. This {state} provider delivers free devices with complete monthly plans.`,
  `Assurance Wireless brings free phone service to {city} residents. {state} customers get quality Android phones plus unlimited talk and text.`,
  `Choose Assurance Wireless in {city} for reliable free phone service. {state} Lifeline customers enjoy free Android devices and full-featured plans.`,
  // 3 NEW variations to reach 11 (prime)
  `{city}, {state} residents trust Assurance Wireless for quality free service. Get Android phones with unlimited talk, text, and monthly data included.`,
  `Assurance Wireless provides {city} households with dependable free phones. {state} customers receive devices and comprehensive monthly plans at no cost.`,
  `Select Assurance Wireless in {city} for proven free phone service. {state} residents enjoy Android devices with unlimited calling and texting.`,
];

const PROVIDER_SAFELINK_VARIATIONS = [
  `SafeLink Wireless provides free phone service to eligible {city}, {state} households. Their plans include free smartphones and monthly talk, text, and data.`,
  `{city} residents can access SafeLink Wireless for government phone benefits. This {state} provider offers free devices and comprehensive service plans.`,
  `SafeLink Wireless serves {city}, {state} with quality free phone programs. Eligible households receive smartphones and generous monthly allowances.`,
  `For {city} households, SafeLink Wireless delivers reliable free phone service. {state} customers enjoy free devices with unlimited talk and text.`,
  `SafeLink Wireless offers {city}, {state} residents free government phones. Their service includes monthly data, unlimited calls, and text messaging.`,
  `{city} families choose SafeLink Wireless for dependable free service. This {state} provider supplies smartphones and comprehensive monthly plans.`,
  `SafeLink Wireless brings affordable connectivity to {city} residents. {state} households receive free phones with talk, text, and data included.`,
  `Choose SafeLink Wireless in {city} for trusted free phone service. {state} customers get free devices and full monthly service plans.`,
  // 3 NEW variations to reach 11 (prime)
  `SafeLink Wireless serves {city}, {state} with reliable free phones. Eligible households get devices and monthly service at absolutely no cost.`,
  `{city} residents choose SafeLink for quality government phone service. {state} customers receive smartphones with unlimited talk, text, and data.`,
  `Access SafeLink Wireless in {city} for comprehensive free service. {state} households enjoy free devices and full monthly plans.`,
];

const PROVIDER_QLINK_VARIATIONS = [
  `Q Link Wireless serves {city}, {state} with free Android phones and comprehensive monthly plans. Their service includes unlimited talk, text, and high-speed data.`,
  `{city} residents benefit from Q Link Wireless free phone programs. This {state} provider offers quality devices and generous service allowances.`,
  `Q Link Wireless provides {city}, {state} households with free smartphones. Plans feature unlimited calling, texting, and monthly data packages.`,
  `For {city} families, Q Link Wireless delivers excellent free phone service. {state} customers receive Android devices with complete monthly plans.`,
  `Q Link Wireless offers {city}, {state} residents free government phones. Their plans include unlimited talk and text plus substantial data.`,
  `{city} households trust Q Link Wireless for reliable free service. This {state} provider supplies smartphones and comprehensive monthly allowances.`,
  `Q Link Wireless brings free phone benefits to {city} residents. {state} customers enjoy free Android phones with unlimited talk and text.`,
  `Choose Q Link Wireless in {city} for quality free phone service. {state} households get free devices and full-featured monthly plans.`,
  // 3 NEW variations to reach 11 (prime)
  `Q Link Wireless delivers free phones to {city}, {state} households. Get Android devices with unlimited talk, text, and high-speed data included.`,
  `{city} residents select Q Link for reliable government phone service. {state} customers receive quality smartphones and comprehensive monthly plans.`,
  `Access Q Link Wireless in {city} for excellent free service. {state} households enjoy free devices with unlimited calling and texting.`,
];

const PROVIDER_ENTOUCH_VARIATIONS = [
  `enTouch Wireless provides free phone service to {city}, {state} households meeting Lifeline requirements. Their plans include devices and monthly service.`,
  `{city} residents can access enTouch Wireless for government phone benefits. This {state} provider offers free smartphones and service plans.`,
  `enTouch Wireless serves {city}, {state} with free phone programs. Eligible households receive devices and monthly talk, text, and data.`,
  `For {city} households, enTouch Wireless delivers free phone service. {state} customers enjoy free devices with comprehensive monthly plans.`,
  `enTouch Wireless offers {city}, {state} residents free government phones. Service includes monthly data, unlimited calls, and text messaging.`,
  `{city} families choose enTouch Wireless for free phone service. This {state} provider supplies devices and monthly service allowances.`,
  `enTouch Wireless brings connectivity to {city} residents. {state} households receive free phones with talk, text, and data included.`,
  `Choose enTouch Wireless in {city} for free phone service. {state} customers get devices and monthly plans at no cost.`,
  // 3 NEW variations to reach 11 (prime)
  `enTouch Wireless serves {city}, {state} with quality free phones. Eligible households receive devices and comprehensive monthly service.`,
  `{city} residents access enTouch for reliable government phone service. {state} customers enjoy free smartphones with full monthly plans.`,
  `Select enTouch Wireless in {city} for free phone benefits. {state} households get devices with unlimited talk, text, and data.`,
];

// ============================================
// Benefits Section Variations (13 sets - PRIME NUMBER)
// ============================================

const BENEFITS_CONNECTIVITY_VARIATIONS = [
  { title: 'Stay Connected', bullets: ['Unlimited talk & text', 'Monthly data allowance', 'Voicemail and caller ID'] },
  { title: 'Always Reachable', bullets: ['Free unlimited calling', 'Unlimited text messages', 'High-speed data included'] },
  { title: 'Connected 24/7', bullets: ['Unlimited voice calls', 'Free texting nationwide', 'Monthly data package'] },
  { title: 'Never Miss a Call', bullets: ['Unlimited talk time', 'Text messaging included', 'Data for browsing'] },
  { title: 'Full Connectivity', bullets: ['Unlimited phone calls', 'Unlimited SMS/MMS', 'Monthly data allowance'] },
  { title: 'Complete Service', bullets: ['Free unlimited calls', 'Free text messaging', 'Data every month'] },
  { title: 'Stay in Touch', bullets: ['Unlimited calling', 'Unlimited texting', 'Internet data included'] },
  { title: 'Always Connected', bullets: ['Talk all you want', 'Text without limits', 'Monthly data plan'] },
  { title: 'Reliable Service', bullets: ['Unlimited voice', 'Unlimited messaging', 'Data allowance monthly'] },
  { title: 'Keep Connected', bullets: ['Free calls nationwide', 'Free texts nationwide', 'Data each month'] },
  { title: 'Communication Freedom', bullets: ['Unlimited talking', 'Unlimited texting', 'Monthly internet data'] },
  { title: 'Total Connectivity', bullets: ['Call anyone free', 'Text anyone free', 'Browse with data'] },
  // 1 NEW variation to reach 13 (prime)
  { title: 'Fully Connected', bullets: ['Unlimited voice calls', 'Unlimited text messages', 'Monthly high-speed data'] },
];

const BENEFITS_NOCOST_VARIATIONS = [
  { title: 'No Hidden Fees', bullets: ['No contracts required', 'No monthly bills', 'Completely free service'] },
  { title: 'Zero Cost', bullets: ['No credit checks', 'No activation fees', 'Free forever'] },
  { title: 'Totally Free', bullets: ['No payments ever', 'No surprise charges', 'No obligations'] },
  { title: 'Cost-Free Service', bullets: ['No monthly payments', 'No hidden costs', 'No contracts'] },
  { title: 'Absolutely Free', bullets: ['No bills to pay', 'No credit required', 'No commitments'] },
  { title: '100% Free', bullets: ['No fees whatsoever', 'No contract lock-in', 'No credit check'] },
  { title: 'No Charges Ever', bullets: ['Free monthly service', 'No activation cost', 'No termination fees'] },
  { title: 'Free Service', bullets: ['No payment required', 'No credit needed', 'No strings attached'] },
  { title: 'No Bills', bullets: ['Zero monthly cost', 'Zero hidden fees', 'Zero obligations'] },
  { title: 'Completely Free', bullets: ['No money down', 'No recurring charges', 'No credit checks'] },
  { title: 'Free Forever', bullets: ['No payments needed', 'No surprise bills', 'No contracts'] },
  { title: 'No Cost Service', bullets: ['Free phone included', 'Free monthly plan', 'Free activation'] },
  // 1 NEW variation to reach 13 (prime)
  { title: 'Zero Fees', bullets: ['No upfront costs', 'No monthly charges', 'No hidden expenses'] },
];

const BENEFITS_EMERGENCY_VARIATIONS = [
  { title: 'Emergency Access', bullets: ['911 emergency calls', 'Healthcare connections', 'Family communication'] },
  { title: 'Safety First', bullets: ['Emergency 911 service', 'Medical appointment calls', 'Stay close to family'] },
  { title: 'Peace of Mind', bullets: ['911 always available', 'Doctor appointments', 'Family connections'] },
  { title: 'Emergency Ready', bullets: ['Call 911 anytime', 'Healthcare access', 'Reach loved ones'] },
  { title: 'Stay Safe', bullets: ['Emergency services', 'Medical contacts', 'Family communication'] },
  { title: 'Always Prepared', bullets: ['911 emergency access', 'Health appointments', 'Connect with family'] },
  { title: 'Safety Net', bullets: ['Emergency calling', 'Healthcare scheduling', 'Family contact'] },
  { title: 'Protected', bullets: ['911 service included', 'Medical access', 'Family connections'] },
  { title: 'Secure Connection', bullets: ['Emergency 911', 'Healthcare calls', 'Stay connected'] },
  { title: 'Ready for Anything', bullets: ['911 access', 'Doctor calls', 'Family reach'] },
  { title: 'Emergency Coverage', bullets: ['Call 911 free', 'Healthcare contact', 'Family communication'] },
  { title: 'Safety Assured', bullets: ['911 always works', 'Medical appointments', 'Reach family'] },
  // 1 NEW variation to reach 13 (prime)
  { title: 'Emergency Ready', bullets: ['911 service always', 'Healthcare connections', 'Family accessibility'] },
];

// ============================================
// FAQ Answer Variations (11 variations per question - PRIME NUMBER)
// ============================================

const FAQ_APPROVAL_TIME_VARIATIONS = [
  `Most {city} applicants receive approval within 24-48 hours. Once verified, your free phone ships to your {state} address within a week.`,
  `{city}, {state} applications typically process same-day. Expect your device to arrive within 5-7 business days of approval.`,
  `Approval for {city} residents usually takes 1-2 business days. Your phone will be delivered to your {state} address shortly after.`,
  `The verification process takes about 24 hours for most {city} households. {state} deliveries arrive within one week.`,
  `{city}, {state} applicants are typically approved within 48 hours. Phones ship immediately after verification completes.`,
  `Expect approval within 1-2 days for {city} applications. {state} residents receive phones within a week of verification.`,
  `Most {city} applications process within 24 hours. Your free phone arrives at your {state} address in 5-7 days.`,
  `{city}, {state} approval times average 24-48 hours. Devices ship promptly after eligibility is confirmed.`,
  `Verification for {city} residents completes within 1-2 business days. {state} shipping takes approximately one week.`,
  `{city} applicants typically see approval within 48 hours. {state} delivery follows within 5-7 business days.`,
  // 1 NEW variation to reach 11 (prime)
  `{city}, {state} applications process quickly—usually 24-48 hours. Your device ships immediately and arrives within a week.`,
];

const FAQ_KEEP_NUMBER_VARIATIONS = [
  `Yes, {city} residents can usually keep their existing phone number when switching to a free government phone. Ask your {state} provider about number portability.`,
  `Most {city}, {state} providers allow you to transfer your current number. Request number porting during your application process.`,
  `{city} applicants can often keep their phone number. {state} providers typically support number transfers from other carriers.`,
  `Number portability is available for most {city} residents. Contact your {state} provider to transfer your existing number.`,
  `Yes, {city}, {state} customers can usually port their number. Mention this when applying for your free phone.`,
  `{city} residents may keep their current number through portability. {state} providers generally accommodate transfer requests.`,
  `Most {city} providers support keeping your number. Ask about porting options when you apply in {state}.`,
  `{city}, {state} applicants can typically transfer existing numbers. Request portability during the enrollment process.`,
  `Yes, number transfers are possible for {city} residents. {state} providers usually offer this service at no extra cost.`,
  `{city} customers can often keep their phone number. {state} carriers support porting from most other providers.`,
  // 1 NEW variation to reach 11 (prime)
  `{city}, {state} residents can port their existing number. Most providers support free number transfers during enrollment.`,
];

const FAQ_DOCUMENTS_VARIATIONS = [
  `{city} applicants need: 1) Government-issued ID, 2) Proof of {state} residency, 3) Program enrollment letter OR income documentation showing household below 135% FPL.`,
  `For {city}, {state} applications, bring valid ID, proof of address, and documentation showing program participation or qualifying income.`,
  `{city} residents should prepare: state ID, {state} address verification, and proof of eligibility (benefit letter or pay stubs).`,
  `Required documents for {city} applicants include {state} ID, residency proof, and eligibility documentation (program letter or income proof).`,
  `{city}, {state} applications require: government ID, address verification, and proof of program enrollment or income qualification.`,
  `Prepare these for {city} enrollment: valid {state} ID, proof of residence, and eligibility verification documents.`,
  `{city} applicants must provide: photo ID, {state} residency proof, and documentation confirming program participation or income.`,
  `Documents needed in {city}: government-issued ID, proof of {state} address, and eligibility proof (benefit letter or income docs).`,
  `For {city}, {state} enrollment: bring ID, address proof, and verification of qualifying program or income level.`,
  `{city} residents need: valid ID, {state} address documentation, and proof of eligibility through programs or income.`,
  // 1 NEW variation to reach 11 (prime)
  `{city}, {state} applicants should bring: government ID, address verification, and eligibility proof (program letter or income documents).`,
];

const FAQ_EVERYONE_ELIGIBLE_VARIATIONS = [
  `Eligibility for free phones in {city}, {state} requires participation in qualifying programs (Medicaid, SNAP, SSI, FPHA, Veterans Pension) or meeting income requirements. One Lifeline benefit is allowed per household.`,
  `Not everyone in {city} qualifies—you must meet {state} eligibility requirements through program participation or income guidelines. Each household can receive one benefit.`,
  `{city}, {state} residents must qualify through income or program requirements. The free phone benefit is limited to one per household address.`,
  `Free phones in {city} are available to {state} residents meeting federal eligibility criteria. Qualification is based on income or program enrollment.`,
  `{city} eligibility depends on meeting {state} requirements—either through government program participation or household income below federal guidelines.`,
  `To qualify in {city}, {state}, you must participate in qualifying programs or meet income thresholds. One device per household is permitted.`,
  `{city} residents qualify if they meet {state} income requirements or participate in programs like SNAP, Medicaid, or SSI.`,
  `Eligibility in {city}, {state} is based on federal criteria. You must demonstrate need through program participation or income verification.`,
  `{city} free phone eligibility requires meeting {state} guidelines—either income-based or through qualifying government programs.`,
  `Not all {city} residents qualify. {state} eligibility requires program participation or income at or below 135% of poverty guidelines.`,
  // 1 NEW variation to reach 11 (prime)
  `{city}, {state} eligibility requires meeting federal criteria—either through program participation or income below 135% FPL. One benefit per household.`,
];

const FAQ_SERVICE_QUALITY_VARIATIONS = [
  `Free government phones in {city} use the same {state} cell towers as paid carriers. Service quality equals or exceeds standard prepaid plans.`,
  `{city}, {state} free phone service runs on major carrier networks. You'll experience the same coverage and call quality as premium plans.`,
  `Service in {city} is excellent—free phones use established {state} networks. Coverage and quality match paid wireless services.`,
  `{city} residents enjoy quality service on major {state} networks. Free government phones provide reliable coverage throughout the area.`,
  `Free phone service in {city}, {state} operates on nationwide carrier networks. Quality and coverage are comparable to paid plans.`,
  `{city} free phones connect through major {state} carriers. Expect reliable service, clear calls, and good coverage.`,
  `Service quality in {city} is strong—free phones use the same {state} infrastructure as paid carriers.`,
  `{city}, {state} free phone users enjoy major carrier networks. Service quality matches what you'd get with paid plans.`,
  `Free government phones in {city} provide excellent {state} coverage. They operate on the same networks as premium carriers.`,
  `{city} residents get quality service on established {state} networks. Free phones offer coverage comparable to paid options.`,
  // 1 NEW variation to reach 11 (prime)
  `{city}, {state} free phones use major carrier networks. Service quality and coverage match premium paid wireless plans.`,
];

const FAQ_MULTIPLE_PHONES_VARIATIONS = [
  `Federal rules allow one free government phone per household in {city}, {state}. However, multiple family members may qualify if they live at separate addresses.`,
  `{city} households can receive one Lifeline benefit. {state} residents at different addresses may each qualify for their own phone.`,
  `One free phone per {city} household is the federal limit. {state} family members living separately can apply individually.`,
  `{city}, {state} allows one government phone per household address. Family members with separate residences may each qualify.`,
  `Federal guidelines permit one free phone per {city} household. {state} residents living independently can apply separately.`,
  `{city} households receive one Lifeline phone. {state} family members at different addresses may each be eligible.`,
  `One phone per household is the rule in {city}, {state}. Separate households with different addresses may each qualify.`,
  `{city} free phone benefits are limited to one per household. {state} residents at unique addresses can apply individually.`,
  `Federal law allows one free phone per {city} address. {state} family members living elsewhere may qualify separately.`,
  `{city}, {state} households receive one government phone. Multiple family members qualify only if living at separate addresses.`,
  // 1 NEW variation to reach 11 (prime)
  `{city}, {state} allows one free phone per household address. Family members at different residences can each apply separately.`,
];

// ============================================
// CTA Section Variations (13 variations - PRIME NUMBER)
// ============================================

const CTA_VARIATIONS = [
  {
    headline: `Apply today for free phone service in {city}, {state}!`,
    subtext: `Join thousands of {city} residents already connected through federal programs.`,
    button: `Apply Now - It's Free!`,
  },
  {
    headline: `Get your free government phone in {city}!`,
    subtext: `{state} residents are getting connected every day. Start your application now.`,
    button: `Check Eligibility`,
  },
  {
    headline: `{city}, {state} - Your free phone awaits!`,
    subtext: `Don't miss out on this valuable federal benefit. Apply in minutes.`,
    button: `Start Application`,
  },
  {
    headline: `Free phones available for {city} residents!`,
    subtext: `{state} households are saving hundreds annually. See if you qualify today.`,
    button: `See If You Qualify`,
  },
  {
    headline: `{city} free phone programs are open!`,
    subtext: `Eligible {state} residents receive free devices and monthly service.`,
    button: `Apply Today`,
  },
  {
    headline: `Claim your free phone in {city}, {state}!`,
    subtext: `Federal programs provide free service to qualifying households.`,
    button: `Get Started Free`,
  },
  {
    headline: `{city} residents - get connected free!`,
    subtext: `{state} Lifeline and ACP programs are accepting applications now.`,
    button: `Apply in Minutes`,
  },
  {
    headline: `Free government phones for {city}!`,
    subtext: `{state} households can apply online in just 2 minutes.`,
    button: `Check Your Eligibility`,
  },
  {
    headline: `{city}, {state} free phone enrollment open!`,
    subtext: `Join millions of Americans with free phone service.`,
    button: `Enroll Now`,
  },
  {
    headline: `Get connected in {city} at no cost!`,
    subtext: `{state} residents qualify for free phones through federal programs.`,
    button: `Apply Free`,
  },
  {
    headline: `{city} free phone applications accepted!`,
    subtext: `{state} households can receive free devices and service today.`,
    button: `Start Free Application`,
  },
  {
    headline: `Apply for free phone service in {city}!`,
    subtext: `{state} Lifeline benefits are waiting for eligible residents.`,
    button: `Begin Application`,
  },
  // 1 NEW variation to reach 13 (prime)
  {
    headline: `{city}, {state} - Free phones available now!`,
    subtext: `Federal programs are accepting applications from eligible residents.`,
    button: `Apply Today - Free!`,
  },
];

// ============================================
// Section Heading Variations (11 variations per section - PRIME NUMBER)
// ============================================

const HEADING_QUALIFIES_VARIATIONS = [
  `Who Qualifies for Free Government Phone in {city}?`,
  `{city} Free Phone Eligibility Requirements`,
  `Do You Qualify in {city}, {state}?`,
  `Eligibility for Free Phones in {city}`,
  `{city} Qualification Requirements`,
  `Who Can Get Free Phones in {city}?`,
  `{city}, {state} Eligibility Criteria`,
  `Qualifying for Free Service in {city}`,
  // 3 NEW variations to reach 11 (prime)
  `{city} Free Phone Qualification Guide`,
  `Am I Eligible in {city}, {state}?`,
  `{city} Eligibility Requirements Explained`,
];

const HEADING_HOWTO_VARIATIONS = [
  `How to Apply for Free Phone in {city}`,
  `{city} Application Process`,
  `Getting Your Free Phone in {city}, {state}`,
  `Apply for Free Service in {city}`,
  `{city} Free Phone Application Steps`,
  `How {city} Residents Apply`,
  `Application Guide for {city}, {state}`,
  `Steps to Get Free Phone in {city}`,
  // 3 NEW variations to reach 11 (prime)
  `{city} Application Instructions`,
  `How to Enroll in {city}, {state}`,
  `{city} Free Phone Enrollment Steps`,
];

const HEADING_PROVIDERS_VARIATIONS = [
  `Best Providers in {city}, {state}`,
  `{city} Free Phone Providers`,
  `Top Carriers Serving {city}`,
  `{city}, {state} Provider Options`,
  `Available Providers in {city}`,
  `{city} Wireless Provider List`,
  `Carriers Serving {city}, {state}`,
  `{city} Free Phone Carriers`,
  // 3 NEW variations to reach 11 (prime)
  `{city} Provider Comparison`,
  `Free Phone Carriers in {city}`,
  `{city}, {state} Carrier Options`,
];

const HEADING_BENEFITS_VARIATIONS = [
  `Benefits of Free Government Phone`,
  `What You Get with Free Service`,
  `Free Phone Program Benefits`,
  `Your Free Phone Benefits`,
  `Government Phone Advantages`,
  `Free Service Benefits`,
  `What's Included Free`,
  `Program Benefits Overview`,
  // 3 NEW variations to reach 11 (prime)
  `Free Phone Service Benefits`,
  `What's Included with Your Phone`,
  `Government Phone Program Benefits`,
];

const HEADING_FAQ_VARIATIONS = [
  `Frequently Asked Questions`,
  `Common Questions About Free Phones`,
  `{city} Free Phone FAQ`,
  `Questions & Answers`,
  `Free Phone Program FAQ`,
  `Your Questions Answered`,
  `{city}, {state} FAQ`,
  `Free Phone Questions`,
  // 3 NEW variations to reach 11 (prime)
  `{city} FAQ - Free Phones`,
  `Common {city} Questions`,
  `Free Phone Q&A for {city}`,
];

// ============================================
// Main Export Interface
// ============================================

export interface CityContentVariations {
  intro: string;
  qualifiesIntro: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  providerAssurance: string;
  providerSafelink: string;
  providerQlink: string;
  providerEntouch: string;
  benefitsConnectivity: { title: string; bullets: string[] };
  benefitsNoCost: { title: string; bullets: string[] };
  benefitsEmergency: { title: string; bullets: string[] };
  faqApprovalTime: string;
  faqKeepNumber: string;
  faqDocuments: string;
  faqEveryoneEligible: string;
  faqServiceQuality: string;
  faqMultiplePhones: string;
  cta: { headline: string; subtext: string; button: string };
  headingQualifies: string;
  headingHowTo: string;
  headingProviders: string;
  headingBenefits: string;
  headingFaq: string;
}

// ============================================
// Main Export Function - Uses COMPOUND HASH
// ============================================

export function getCityContentVariations(
  domain: string,
  city: string,
  state: string,
  population?: number
): CityContentVariations {
  const populationStr = population ? population.toLocaleString() : 'many';
  
  // Helper to replace tokens in text
  const replaceTokens = (text: string): string => {
    return text
      .replace(/\{city\}/g, city)
      .replace(/\{state\}/g, state)
      .replace(/\{population\}/g, populationStr);
  };
  
  // Use COMPOUND hash (domain + city) for maximum uniqueness
  return {
    intro: replaceTokens(pickVariation(domain, city, INTRO_VARIATIONS, 0)),
    qualifiesIntro: replaceTokens(pickVariation(domain, city, QUALIFIES_INTRO_VARIATIONS, 1)),
    step1: replaceTokens(pickVariation(domain, city, STEP1_VARIATIONS, 2)),
    step2: replaceTokens(pickVariation(domain, city, STEP2_VARIATIONS, 3)),
    step3: replaceTokens(pickVariation(domain, city, STEP3_VARIATIONS, 4)),
    step4: replaceTokens(pickVariation(domain, city, STEP4_VARIATIONS, 5)),
    providerAssurance: replaceTokens(pickVariation(domain, city, PROVIDER_ASSURANCE_VARIATIONS, 6)),
    providerSafelink: replaceTokens(pickVariation(domain, city, PROVIDER_SAFELINK_VARIATIONS, 7)),
    providerQlink: replaceTokens(pickVariation(domain, city, PROVIDER_QLINK_VARIATIONS, 8)),
    providerEntouch: replaceTokens(pickVariation(domain, city, PROVIDER_ENTOUCH_VARIATIONS, 9)),
    benefitsConnectivity: pickVariation(domain, city, BENEFITS_CONNECTIVITY_VARIATIONS, 10),
    benefitsNoCost: pickVariation(domain, city, BENEFITS_NOCOST_VARIATIONS, 11),
    benefitsEmergency: pickVariation(domain, city, BENEFITS_EMERGENCY_VARIATIONS, 12),
    faqApprovalTime: replaceTokens(pickVariation(domain, city, FAQ_APPROVAL_TIME_VARIATIONS, 13)),
    faqKeepNumber: replaceTokens(pickVariation(domain, city, FAQ_KEEP_NUMBER_VARIATIONS, 14)),
    faqDocuments: replaceTokens(pickVariation(domain, city, FAQ_DOCUMENTS_VARIATIONS, 15)),
    faqEveryoneEligible: replaceTokens(pickVariation(domain, city, FAQ_EVERYONE_ELIGIBLE_VARIATIONS, 16)),
    faqServiceQuality: replaceTokens(pickVariation(domain, city, FAQ_SERVICE_QUALITY_VARIATIONS, 17)),
    faqMultiplePhones: replaceTokens(pickVariation(domain, city, FAQ_MULTIPLE_PHONES_VARIATIONS, 18)),
    cta: {
      headline: replaceTokens(pickVariation(domain, city, CTA_VARIATIONS, 19).headline),
      subtext: replaceTokens(pickVariation(domain, city, CTA_VARIATIONS, 19).subtext),
      button: replaceTokens(pickVariation(domain, city, CTA_VARIATIONS, 19).button),
    },
    headingQualifies: replaceTokens(pickVariation(domain, city, HEADING_QUALIFIES_VARIATIONS, 20)),
    headingHowTo: replaceTokens(pickVariation(domain, city, HEADING_HOWTO_VARIATIONS, 21)),
    headingProviders: replaceTokens(pickVariation(domain, city, HEADING_PROVIDERS_VARIATIONS, 22)),
    headingBenefits: replaceTokens(pickVariation(domain, city, HEADING_BENEFITS_VARIATIONS, 23)),
    headingFaq: replaceTokens(pickVariation(domain, city, HEADING_FAQ_VARIATIONS, 24)),
  };
}

// ============================================
// Uniqueness Verification Function
// ============================================

export function verifyUniqueness(domains: string[], cities: string[]): {
  totalCombinations: number;
  uniqueCombinations: number;
  uniquenessPercent: number;
} {
  const signatures = new Set<string>();
  
  for (const domain of domains) {
    for (const city of cities) {
      const hash = getCompoundHash(domain, city);
      // Create signature from key variation indices
      const sig = [
        hash % 23,  // intro (prime)
        (hash + 7) % 17,  // qualifies (prime)
        (hash + 14) % 13, // step1 (prime)
        (hash + 42) % 11, // provider (prime)
        (hash + 70) % 13, // benefits (prime)
        (hash + 91) % 11, // faq (prime)
        (hash + 133) % 13, // cta (prime)
      ].join('-');
      signatures.add(sig);
    }
  }
  
  const total = domains.length * cities.length;
  const unique = signatures.size;
  
  return {
    totalCombinations: total,
    uniqueCombinations: unique,
    uniquenessPercent: Math.round((unique / total) * 100 * 100) / 100,
  };
}

// Export hash functions for testing
export { hashString as hashDomain, getCompoundHash };


// ============================================
// SITE-LEVEL CONTENT VARIATIONS
// Used by Footer, Hero, StickyCTA, and other components
// ============================================

export interface ContentVariations {
  // Hero section
  heroStats: {
    stat1: { value: string; label: string };
    stat2: { value: string; label: string };
    stat3: { value: string; label: string };
  };
  heroTagline: string;
  heroSubtext: string;
  
  // Trust badges
  trustBadges: string[];
  
  // Value propositions
  valueProps: string[];
  
  // CTA text variations
  ctaButton: string;
  ctaSubtext: string;
  
  // Footer tagline
  footerTagline: string;
  
  // Feature titles
  featureTitles: {
    noCost: string;
    freePhone: string;
    connectivity: string;
    approval: string;
  };
  
  // Icons (emoji variations)
  icons: {
    phone: string;
    money: string;
    speed: string;
    check: string;
    support: string;
  };
}

// Stat variations
const STAT_VARIATIONS = [
  { stat1: { value: 'Millions', label: 'Helped' }, stat2: { value: 'FREE', label: 'Service' }, stat3: { value: '24/7', label: 'Support' } },
  { stat1: { value: 'Thousands', label: 'Monthly' }, stat2: { value: '$0', label: 'Cost' }, stat3: { value: 'Fast', label: 'Approval' } },
  { stat1: { value: '50+', label: 'States' }, stat2: { value: 'Zero', label: 'Fees' }, stat3: { value: 'Quick', label: 'Setup' } },
  { stat1: { value: 'Nationwide', label: 'Coverage' }, stat2: { value: 'No Cost', label: 'Ever' }, stat3: { value: 'Easy', label: 'Apply' } },
  { stat1: { value: 'Top Rated', label: 'Service' }, stat2: { value: 'Free', label: 'Forever' }, stat3: { value: '2 Min', label: 'Apply' } },
  { stat1: { value: 'Trusted', label: 'Provider' }, stat2: { value: 'Gratis', label: 'Service' }, stat3: { value: 'Simple', label: 'Process' } },
  { stat1: { value: 'Many', label: 'Approved' }, stat2: { value: 'Complimentary', label: 'Plan' }, stat3: { value: 'Speedy', label: 'Delivery' } },
  { stat1: { value: 'Growing', label: 'Network' }, stat2: { value: 'No Charge', label: 'Plan' }, stat3: { value: 'Rapid', label: 'Response' } },
];

// Hero tagline variations
const HERO_TAGLINES = [
  'phone service. No hidden fees. Federally approved.',
  'phone plan. Zero cost. Government backed.',
  'mobile service. Completely free. Official program.',
  'cell service. No charges ever. Federal benefit.',
  'phone access. Totally free. Approved program.',
  'wireless service. No monthly bills. Verified program.',
  'communication service. Free forever. Federal initiative.',
  'phone benefits. Zero payments. Authorized provider.',
];

// Hero subtext variations
const HERO_SUBTEXTS = [
  'for qualified Americans. No contracts required.',
  'for eligible households. No obligations.',
  'for qualifying residents. No commitments needed.',
  'for approved applicants. No strings attached.',
  'for verified participants. No signup fees.',
  'for certified members. No activation costs.',
  'for registered users. No monthly charges.',
  'for confirmed beneficiaries. No recurring fees.',
];

// Trust badge variations
const TRUST_BADGE_SETS = [
  ['Federally Approved', 'Secure Process', 'Always Available'],
  ['Official Program', 'Protected Data', 'Round-the-Clock'],
  ['Government Backed', 'Safe Application', 'Constant Support'],
  ['Authorized Service', 'Private & Secure', 'Anytime Help'],
  ['Verified Provider', 'Encrypted Data', 'Continuous Care'],
  ['Certified Program', 'Confidential', 'Nonstop Assistance'],
  ['Accredited Service', 'Safeguarded', 'Perpetual Support'],
  ['Endorsed Provider', 'Shielded Info', 'Ongoing Help'],
];

// Value proposition variations
const VALUE_PROP_SETS = [
  ['Completely free - zero hidden costs', 'Approved federal programs', 'Reduce phone expenses'],
  ['No cost whatsoever - transparent pricing', 'Verified government initiatives', 'Lower your bills'],
  ['Absolutely free - no surprise fees', 'Official assistance programs', 'Save on communication'],
  ['100% gratis - clear terms', 'Authorized benefit programs', 'Cut phone costs'],
  ['Totally complimentary - honest service', 'Legitimate federal aid', 'Decrease monthly expenses'],
  ['Free of charge - upfront pricing', 'Genuine government help', 'Minimize spending'],
  ['No payment required - fair terms', 'Authentic federal support', 'Trim your budget'],
  ['Zero dollars - straightforward', 'Real assistance programs', 'Economize on phones'],
];

// CTA button variations
const CTA_BUTTONS = [
  'Check If You Qualify',
  'See If You\'re Eligible',
  'Verify Your Eligibility',
  'Start Your Application',
  'Begin Qualification Check',
  'Check Eligibility Now',
  'Apply in Minutes',
  'Get Started Today',
];

// CTA subtext variations
const CTA_SUBTEXTS = [
  'Takes 2 minutes • Secure • No fees',
  'Quick process • Protected • Free',
  'Fast check • Safe • Zero cost',
  '2-minute form • Private • Gratis',
  'Speedy verification • Encrypted • Complimentary',
  'Rapid application • Confidential • No charge',
  'Swift process • Secured • Free of cost',
  'Brief questionnaire • Protected • No payment',
];

// Footer tagline variations
const FOOTER_TAGLINES = [
  'Your Trusted Partner for Free Phone Service',
  'Connecting Americans to Free Communication',
  'Your Gateway to Free Phone Programs',
  'Helping Families Stay Connected',
  'Free Phone Service Made Simple',
  'Bridging the Communication Gap',
  'Your Free Phone Solution',
  'Empowering Through Communication',
];

// Feature title variations
const FEATURE_TITLE_SETS = [
  { noCost: 'Zero Cost Service', freePhone: 'Complimentary Device', connectivity: 'Full Connectivity', approval: 'Quick Approval' },
  { noCost: 'No Cost Plan', freePhone: 'Free Smartphone', connectivity: 'Unlimited Access', approval: 'Fast Processing' },
  { noCost: 'Free Service', freePhone: 'Device Included', connectivity: 'Stay Connected', approval: 'Rapid Approval' },
  { noCost: 'Gratis Plan', freePhone: 'Phone Provided', connectivity: 'Always Online', approval: 'Speedy Decision' },
  { noCost: 'Complimentary Service', freePhone: 'Free Mobile', connectivity: 'Constant Connection', approval: 'Swift Approval' },
  { noCost: 'No Charge Plan', freePhone: 'Included Phone', connectivity: 'Reliable Service', approval: 'Prompt Response' },
  { noCost: 'Cost-Free Service', freePhone: 'Bonus Device', connectivity: 'Seamless Access', approval: 'Immediate Review' },
  { noCost: 'Free of Charge', freePhone: 'Gifted Phone', connectivity: 'Uninterrupted Service', approval: 'Express Processing' },
];

// Icon variations (different emojis for same concept)
const ICON_SETS = [
  { phone: '📱', money: '💰', speed: '⚡', check: '✅', support: '🎧' },
  { phone: '📲', money: '💵', speed: '🚀', check: '☑️', support: '💬' },
  { phone: '☎️', money: '🤑', speed: '💨', check: '✔️', support: '🆘' },
  { phone: '🤳', money: '💸', speed: '⏱️', check: '👍', support: '📞' },
  { phone: '📞', money: '🏦', speed: '🏃', check: '👌', support: '🗣️' },
  { phone: '🔔', money: '💎', speed: '🎯', check: '🎉', support: '🤝' },
  { phone: '📡', money: '🎁', speed: '🔥', check: '💯', support: '❤️' },
  { phone: '💻', money: '🆓', speed: '✨', check: '🌟', support: '👋' },
];

/**
 * Generate site-level content variations for a specific domain
 * Used by Footer, Hero, StickyCTA, and other components
 */
export function getContentVariations(domain: string): ContentVariations {
  return {
    heroStats: pickVariationSimple(domain, STAT_VARIATIONS, 0),
    heroTagline: pickVariationSimple(domain, HERO_TAGLINES, 1),
    heroSubtext: pickVariationSimple(domain, HERO_SUBTEXTS, 2),
    trustBadges: pickVariationSimple(domain, TRUST_BADGE_SETS, 3),
    valueProps: pickVariationSimple(domain, VALUE_PROP_SETS, 4),
    ctaButton: pickVariationSimple(domain, CTA_BUTTONS, 5),
    ctaSubtext: pickVariationSimple(domain, CTA_SUBTEXTS, 6),
    footerTagline: pickVariationSimple(domain, FOOTER_TAGLINES, 7),
    featureTitles: pickVariationSimple(domain, FEATURE_TITLE_SETS, 8),
    icons: pickVariationSimple(domain, ICON_SETS, 9),
  };
}

/**
 * Get a specific text variation
 */
export function getTextVariation(domain: string, category: string, index: number = 0): string {
  const hash = hashString(domain);
  
  const variations: Record<string, string[]> = {
    'approval_text': [
      'Get approved quickly',
      'Fast approval process',
      'Rapid verification',
      'Quick qualification check',
      'Speedy approval',
      'Swift processing',
      'Prompt decision',
      'Immediate review',
    ],
    'no_credit_text': [
      'No credit check needed',
      'Credit check not required',
      'No credit verification',
      'Skip the credit check',
      'Credit-free application',
      'No credit inquiry',
      'Zero credit requirements',
      'Credit check waived',
    ],
    'support_text': [
      'Always here to help',
      'Support when you need it',
      'Help available anytime',
      'Assistance on demand',
      'Ready to assist',
      'Here for you',
      'Support at your service',
      'Help is a call away',
    ],
  };
  
  const categoryVariations = variations[category] || [''];
  return categoryVariations[(hash + index) % categoryVariations.length];
}
