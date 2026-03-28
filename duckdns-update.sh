#!/bin/bash
# DuckDNS update script for postpilot.duckdns.org
# Usage: ./duckdns-update.sh <DUCKDNS_TOKEN>
#
# 1. Register at https://www.duckdns.org/ and create domain "postpilot"
# 2. Copy your token
# 3. Run: ./duckdns-update.sh YOUR_TOKEN
# 4. Add to crontab: */5 * * * * /root/postpilot/duckdns-update.sh YOUR_TOKEN >> /var/log/duckdns.log 2>&1

DOMAIN="postpilot"
TOKEN="${1:-YOUR_DUCKDNS_TOKEN}"
IP="139.59.123.146"

echo "$(date): Updating DuckDNS..."
curl -s "https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=${IP}"
echo ""
