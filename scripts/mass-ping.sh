#!/bin/bash

# Mass Ping Script for government-phone.co
# Pings all major search engines, aggregators, and ping services

SITE_URL="https://government-phone.co"
SITE_NAME="Government Phone"
SITEMAP_URL="https://government-phone.co/sitemap.xml"
RSS_URL="https://government-phone.co/rss.xml"

echo "🚀 Starting Mass Ping for $SITE_URL"
echo "================================================"
echo ""

# Function to ping XML-RPC services
ping_xmlrpc() {
    local service_url=$1
    local service_name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: text/xml" \
        -d "<?xml version=\"1.0\"?>
<methodCall>
  <methodName>weblogUpdates.ping</methodName>
  <params>
    <param><value>$SITE_NAME</value></param>
    <param><value>$SITE_URL</value></param>
  </params>
</methodCall>" \
        --max-time 10 \
        "$service_url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "✅ $service_name - OK"
    else
        echo "❌ $service_name - Failed ($response)"
    fi
}

# Function to ping REST/GET services
ping_get() {
    local url=$1
    local service_name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        echo "✅ $service_name - OK"
    else
        echo "❌ $service_name - Failed ($response)"
    fi
}

echo "📡 Pinging Search Engines..."
echo "----------------------------"

# Google
ping_get "https://www.google.com/ping?sitemap=$SITEMAP_URL" "Google Sitemap Ping"

# Bing/IndexNow
ping_get "https://www.bing.com/ping?sitemap=$SITEMAP_URL" "Bing Sitemap Ping"

# Yandex
ping_get "https://blogs.yandex.ru/pings/?status=success&url=$SITE_URL" "Yandex"

echo ""
echo "📡 Pinging Blog Directories & Aggregators..."
echo "---------------------------------------------"

# XML-RPC Ping Services (Traditional Blog Ping)
ping_xmlrpc "http://rpc.pingomatic.com/" "Pingomatic"
ping_xmlrpc "http://blogsearch.google.com/ping/RPC2" "Google Blog Search"
ping_xmlrpc "http://rpc.technorati.com/rpc/ping" "Technorati"
ping_xmlrpc "http://ping.blo.gs/" "Blo.gs"
ping_xmlrpc "http://rpc.weblogs.com/RPC2" "Weblogs.com"
ping_xmlrpc "http://ping.feedburner.com" "FeedBurner"
ping_xmlrpc "http://rpc.blogrolling.com/pinger/" "BlogRolling"
ping_xmlrpc "http://api.feedster.com/ping" "Feedster"
ping_xmlrpc "http://api.moreover.com/RPC2" "Moreover"
ping_xmlrpc "http://bblog.com/ping.php" "bBlog"
ping_xmlrpc "http://ping.bloggers.jp/rpc/" "Bloggers JP"
ping_xmlrpc "http://ping.cocolog-nifty.com/xmlrpc" "Cocolog"
ping_xmlrpc "http://ping.exblog.jp/xmlrpc" "Exblog"
ping_xmlrpc "http://ping.weblogalot.com/rpc.php" "Weblogalot"
ping_xmlrpc "http://rpc.bloggerei.de/ping/" "Bloggerei"
ping_xmlrpc "http://www.blogpeople.net/servlet/weblogUpdates" "BlogPeople"
ping_xmlrpc "http://xping.pubsub.com/ping/" "PubSub"
ping_xmlrpc "http://www.blogshares.com/rpc.php" "BlogShares"
ping_xmlrpc "http://www.blogsnow.com/ping" "BlogsNow"
ping_xmlrpc "http://www.blogstreet.com/xrbin/xmlrpc.cgi" "BlogStreet"
ping_xmlrpc "http://bulkfeeds.net/rpc" "BulkFeeds"
ping_xmlrpc "http://www.newsisfree.com/RPCCloud" "NewsIsFree"
ping_xmlrpc "http://www.popdex.com/addsite.php" "Popdex"
ping_xmlrpc "http://www.snipsnap.org/RPC2" "SnipSnap"
ping_xmlrpc "http://www.weblogues.com/RPC/" "Weblogues"
ping_xmlrpc "http://xmlrpc.blogg.de" "Blogg.de"
ping_xmlrpc "http://rpc.copygator.com/ping/" "CopyGator"
ping_xmlrpc "http://rpc.icerocket.com:10080/" "IceRocket"
ping_xmlrpc "http://ping.fc2.com/" "FC2"
ping_xmlrpc "http://ping.rss.drecom.jp/" "Drecom"
ping_xmlrpc "http://www.mod-pubsub.org/kn_apps/blogchatt" "Mod-PubSub"
ping_xmlrpc "http://www.a2b.cc/setloc/bp.a2b" "A2B"
ping_xmlrpc "http://www.bitacoles.net/ping.php" "Bitacoles"
ping_xmlrpc "http://ping.bitacoras.com" "Bitacoras"
ping_xmlrpc "http://www.blogdigger.com/RPC2" "BlogDigger"
ping_xmlrpc "http://www.blogoole.com/ping/" "Blogoole"
ping_xmlrpc "http://www.blogoon.net/ping/" "Blogoon"
ping_xmlrpc "http://www.blogpinds.com/ping" "BlogPinds"
ping_xmlrpc "http://www.blogshares.com/rpc.php" "BlogShares"
ping_xmlrpc "http://coreblog.org/ping/" "CoreBlog"
ping_xmlrpc "http://www.lasermemory.com/lsrpc/" "LaserMemory"
ping_xmlrpc "http://www.newsgator.com/ngs/xmlrpcping.aspx" "NewsGator"
ping_xmlrpc "http://www.newsisfree.com/xmlrpctest.php" "NewsIsFree Test"
ping_xmlrpc "http://www.syncone.net/xmlrpc/ping" "SyncOne"
ping_xmlrpc "http://www.xianguo.com/xmlrpc/ping.php" "Xianguo"
ping_xmlrpc "http://ping.blogs.yandex.ru/RPC2" "Yandex Blogs"

echo ""
echo "📡 Pinging IndexNow Services..."
echo "--------------------------------"

# IndexNow pings (newer protocol supported by Bing, Yandex, etc.)
# Note: IndexNow requires an API key file, but we can still try basic pings
ping_get "https://www.bing.com/indexnow?url=$SITE_URL&key=governmentphoneco" "Bing IndexNow"
ping_get "https://yandex.com/indexnow?url=$SITE_URL&key=governmentphoneco" "Yandex IndexNow"
ping_get "https://search.seznam.cz/indexnow?url=$SITE_URL&key=governmentphoneco" "Seznam IndexNow"
ping_get "https://searchadvisor.naver.com/indexnow?url=$SITE_URL&key=governmentphoneco" "Naver IndexNow"

echo ""
echo "📡 Pinging Additional Services..."
echo "----------------------------------"

# Direct URL pings
ping_get "http://www.pingler.com/?action=ping&blogurl=$SITE_URL" "Pingler"
ping_get "http://www.pingmyblog.com/ping/?url=$SITE_URL" "PingMyBlog"
ping_get "http://www.ping.in/ping.php?url=$SITE_URL" "Ping.in"
ping_get "http://www.totalping.com/ping.php?url=$SITE_URL" "TotalPing"
ping_get "http://www.autopinger.com/?action=ping&url=$SITE_URL" "AutoPinger"
ping_get "http://www.feedshark.brainbliss.com/?url=$SITE_URL" "FeedShark"
ping_get "http://www.twingly.com/ping?url=$SITE_URL" "Twingly"
ping_get "http://www.weblogalot.com/ping?url=$SITE_URL" "WeblogAlot"
ping_get "http://www.geourl.org/ping/?p=$SITE_URL" "GeoURL"

echo ""
echo "📡 Pinging Social & Web 2.0..."
echo "------------------------------"

ping_get "http://pingoat.com/goat/RPC2" "PingGoat"
ping_get "http://www.weblogs.com/ping" "Weblogs.com Direct"

echo ""
echo "================================================"
echo "🏁 Mass Ping Complete!"
echo ""
echo "Summary:"
echo "- Site: $SITE_URL"
echo "- Sitemap: $SITEMAP_URL"
echo "- Time: $(date)"
echo ""
echo "💡 Tips:"
echo "- Run this script again in 24-48 hours"
echo "- Check Google Search Console for indexing status"
echo "- Monitor site:government-phone.co in Google"
echo "================================================"

