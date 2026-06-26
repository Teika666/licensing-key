# Production Deployment

# Requisite
## 1. OpenSSL

## 1. MongoDB (Atlas)
Create a free cluster at https://cloud.mongodb.com
- Network access: whitelist your server IP only
- Database user: create with readWrite on `license-db`
- Connection string: `mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/license-db`

## 2. Generate signing keys
```bash
node -e "
const c = require('crypto');
const { privateKey, publicKey } = c.generateKeyPairSync('ed25519');
console.log('PRIVATE (base64):', privateKey.export({type:'pkcs8',format:'pem'}).toString('base64'));
console.log('PUBLIC (base64):', publicKey.export({type:'spki',format:'pem'}).toString('base64'));
"
```
Put the base64 strings in `.env`.

## 3. Deploy with Docker
```bash
# Clone on server, then:
docker compose up -d --build
```

## 4. Without Docker
```bash
npm install -g pm2
pm2 start src/index.ts --interpreter ts-node --name license-api
pm2 save
pm2 startup   # auto-start on reboot
```

## 5. Reverse proxy (recommended)
Put behind Nginx/Caddy for TLS termination:

```nginx
server {
    listen 443 ssl;
    server_name license.example.com;

    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://127.0.0.1:443;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

## 6. Security checklist
- [ ] `MONGO_URI` with readWrite user (not atlas admin)
- [ ] Signing keys unique per deployment — never reuse dev keys
- [ ] Firewall: only port 443 open
- [ ] Rate limit tuned: `windowMs: 900000, max: 20` in `src/index.ts`
- [ ] Audit logs monitored for anomalies
- [ ] Offline grace period set in client (3 days recommended)
- [ ] Client public key hardcoded in app binary (not fetched)
