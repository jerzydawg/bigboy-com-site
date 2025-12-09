#!/bin/bash

# Modern Ping Script for 2025
# Most old ping services are DEAD - this uses what actually works

SITE_URL="https://government-phone.co"
SITEMAP_URL="https://government-phone.co/sitemap.xml"
INDEXNOW_KEY="governmentphoneco2025"

echo "🚀 Modern Ping Script for $SITE_URL"
echo "================================================"
echo ""

# ================================
# 1. PINGOMATIC - Still works! Aggregates to multiple services
# ================================
echo "📡 1. Pingomatic (aggregates to 10+ services)..."
response=$(curl -s -X POST -H "Content-Type: text/xml" \
    -d "<?xml version=\"1.0\"?>
<methodCall>
  <methodName>weblogUpdates.extendedPing</methodName>
  <params>
    <param><value>Government Phone</value></param>
    <param><value>$SITE_URL</value></param>
    <param><value>$SITE_URL</value></param>
    <param><value>$SITEMAP_URL</value></param>
  </params>
</methodCall>" \
    "http://rpc.pingomatic.com/" 2>/dev/null)

if echo "$response" | grep -q "Thanks"; then
    echo "   ✅ Pingomatic - Success!"
else
    echo "   ⚠️  Pingomatic - Sent (check response)"
fi

# ================================
# 2. INDEXNOW - The modern standard (Bing, Yandex, Seznam, Naver)
# ================================
echo ""
echo "📡 2. IndexNow Protocol (Bing, Yandex, Seznam, Naver)..."

# Key pages to submit
PAGES=(
    "https://government-phone.co/"
    "https://government-phone.co/free-government-phones"
    "https://government-phone.co/lifeline-program"
    "https://government-phone.co/acp-program"
    "https://government-phone.co/how-to-apply"
    "https://government-phone.co/eligibility"
    "https://government-phone.co/providers"
    "https://government-phone.co/blog"
)

# Submit to IndexNow via Bing (shares with all IndexNow partners)
indexnow_payload=$(cat <<EOF
{
    "host": "government-phone.co",
    "key": "$INDEXNOW_KEY",
    "keyLocation": "https://government-phone.co/$INDEXNOW_KEY.txt",
    "urlList": [
        "${PAGES[0]}",
        "${PAGES[1]}",
        "${PAGES[2]}",
        "${PAGES[3]}",
        "${PAGES[4]}",
        "${PAGES[5]}",
        "${PAGES[6]}",
        "${PAGES[7]}"
    ]
}
EOF
)

indexnow_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$indexnow_payload" \
    "https://api.indexnow.org/indexnow" 2>/dev/null)

if [ "$indexnow_response" = "200" ] || [ "$indexnow_response" = "202" ]; then
    echo "   ✅ IndexNow API - Success! ($indexnow_response)"
else
    echo "   ⚠️  IndexNow API - Response: $indexnow_response"
    echo "   💡 Need to add key file to site (see below)"
fi

# ================================
# 3. WEBMENTION / PINGBACK (if applicable)
# ================================
echo ""
echo "📡 3. Additional Working Services..."

# Twingly (European blog search, still active)
twingly=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    "https://rpc.twingly.com/" -X POST -H "Content-Type: text/xml" \
    -d "<?xml version=\"1.0\"?><methodCall><methodName>weblogUpdates.ping</methodName><params><param><value>Government Phone</value></param><param><value>$SITE_URL</value></param></params></methodCall>" 2>/dev/null)
echo "   Twingly: $twingly"

# Weblogs.com (owned by Google, may still work)
weblogs=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    "http://rpc.weblogs.com/RPC2" -X POST -H "Content-Type: text/xml" \
    -d "<?xml version=\"1.0\"?><methodCall><methodName>weblogUpdates.ping</methodName><params><param><value>Government Phone</value></param><param><value>$SITE_URL</value></param></params></methodCall>" 2>/dev/null)
echo "   Weblogs.com: $weblogs"

echo ""
echo "================================================"
echo "📋 WHAT ACTUALLY WORKS IN 2025:"
echo "================================================"
echo ""
echo "1. ✅ Google Search Console - Submit sitemap manually"
echo "2. ✅ Bing Webmaster Tools - Submit sitemap manually"
echo "3. ✅ IndexNow - Instant indexing (requires key file)"
echo "4. ✅ Pingomatic - Aggregates to working services"
echo "5. ✅ Social sharing - Creates backlinks & signals"
echo ""
echo "❌ DEAD SERVICES (don't waste time):"
echo "   - Google Ping API (deprecated 2019)"
echo "   - Bing Ping API (deprecated, use IndexNow)"
echo "   - Most XML-RPC ping services (2010-2018)"
echo "   - FeedBurner ping (deprecated)"
echo "   - Technorati (dead)"
echo ""
echo "================================================"
echo "🔑 TO ENABLE INDEXNOW (recommended):"
echo "================================================"
echo ""
echo "Add this file to your public folder:"
echo "  File: public/$INDEXNOW_KEY.txt"
echo "  Contents: $INDEXNOW_KEY"
echo ""
echo "Then IndexNow will instantly notify:"
echo "  - Bing"
echo "  - Yandex"
echo "  - Seznam.cz"
echo "  - Naver"
echo ""
echo "Done! $(date)"

