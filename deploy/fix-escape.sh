#!/bin/bash
# Fix escaped dollar signs in nginx config
sed -i 's/\\\$/$/g' /etc/nginx/conf.d/memory-space.conf
nginx -t && nginx -s reload && echo "Fixed and reloaded"
