#!/bin/bash

echo "🚀 Deploying frontend fix to VPS..."

# Create tarball of dist folder
tar -czf dist.tar.gz dist/

echo "✅ Tarball created: dist.tar.gz"
echo ""
echo "📋 Next steps to run on VPS:"
echo ""
echo "# 1. Upload dist.tar.gz to VPS (use scp or upload manually)"
echo "# 2. On VPS, run:"
echo ""
echo "cd /var/www/govchat"
echo "rm -rf dist.old"
echo "mv dist dist.old  # Backup old version"
echo "tar -xzf dist.tar.gz"
echo "echo '✅ Frontend updated!'"
echo ""
echo "# 3. Clear browser cache and reload"
