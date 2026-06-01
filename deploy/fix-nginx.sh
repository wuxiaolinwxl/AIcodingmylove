#!/bin/bash
# Fix nginx /uploads/ to proxy through backend for signature verification
python3 -c "
with open('/etc/nginx/conf.d/memory-space.conf', 'r') as f:
    content = f.read()

old = '''    # Serve uploaded files
    location ^~ /uploads/ {
        alias /root/AIcoding/uploads/;
        expires 30d;
        add_header Cache-Control \"public, no-transform\";
    }'''

new = '''    # Uploaded files - proxy to backend for signature verification
    location ^~ /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }'''

content = content.replace(old, new)
with open('/etc/nginx/conf.d/memory-space.conf', 'w') as f:
    f.write(content)
print('Config updated')
"
nginx -t && nginx -s reload && echo "Nginx reloaded successfully"
