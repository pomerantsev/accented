#!/bin/sh
set -e  # Exit immediately if any command fails

# Extract URLs from sitemap and check them with lychee
echo "Checking URLs from sitemap with lychee:"
urls=$(grep -o '<loc>[^<]*</loc>' ./packages/website/dist/sitemap-0.xml | sed 's/<loc>//g' | sed 's/<\/loc>//g' | sed 's/https:\/\/accented\.dev/http:\/\/localhost:4321/g' | tr '\n' ' ')

# Sanity check: ensure we have multiple URLs
url_count=$(echo "$urls" | wc -w)
if [ "$url_count" -le 1 ]; then
  echo "Error: Multiple URLs expected in the sitemap, but found $url_count"
  exit 1
fi

lychee --exclude '/sitemap-index\.xml$' $urls -v

# Some of the fragment URLs are dynamic (as is the case with Github and Deque),
# so we'll just be checking local fragment URLs (hence the "https" exclusion).
# And yes, some links are checked twice.
# I couldn't find a way to avoid this, and I think it's fine.
lychee --exclude '/sitemap-index\.xml$' --exclude '^https' --include-fragments $urls -v
