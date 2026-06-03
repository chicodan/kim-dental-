#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/usr/sbin:/bin:/sbin"
YARN="/usr/local/lib/node_modules/corepack/shims/yarn"
PROJECT="/Users/dannykim/Downloads/kim-dental-main"
cd "$PROJECT"
clear
echo "🦷 Starting Financial Suite..."

# Kill anything on port 4321
/usr/sbin/lsof -ti:4321 | xargs kill -9 2>/dev/null
sleep 1

# Start dev server using full yarn path
"$YARN" dev &

# Wait until server responds (up to 90s)
for i in $(seq 1 90); do
  if /usr/bin/curl -sf http://localhost:4321/finance.html > /dev/null 2>&1; then
    echo "✅ Ready! Opening in browser..."
    open http://localhost:4321/finance.html
    echo ""
    echo "Keep this window open while using the app."
    echo "Press Ctrl+C to stop the server."
    wait
    exit 0
  fi
  echo "   Starting... ($i/90)"
  sleep 1
done

echo "❌ Server failed to start after 90s."
