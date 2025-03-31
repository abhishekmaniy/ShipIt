#!/bin/bash

CONFIG_FILE="/etc/nginx/conf.d/nextjs-app.conf"

# Fetch all mappings from Redis
MAPPINGS=$(redis-cli --raw hgetall container_ports)

# Start writing a new NGINX config
echo "server {" > $CONFIG_FILE
echo "    listen 80;" >> $CONFIG_FILE

while read -r ID; do
    read -r PORT
    echo "    location /$ID/ {" >> $CONFIG_FILE
    echo "        proxy_pass http://localhost:$PORT/;" >> $CONFIG_FILE
    echo "        proxy_set_header Host \$host;" >> $CONFIG_FILE
    echo "    }" >> $CONFIG_FILE
done <<< "$MAPPINGS"

echo "}" >> $CONFIG_FILE

# Reload NGINX
nginx -s reload
