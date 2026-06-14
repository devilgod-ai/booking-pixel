# Deployment Guide

## Prerequisites (VPS)

- Ubuntu 22.04+ (recommended)
- Node.js 20+ 
- PostgreSQL 16+ (or Docker)
- Nginx (reverse proxy)
- Git

---

## Step 1: Install Dependencies on VPS

```bash
# SSH into VPS
ssh user@your-vps-ip

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Docker + Docker Compose
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker

# Git
sudo apt install -y git

# Nginx
sudo apt install -y nginx
```

---

## Step 2: Clone Project to VPS

Option A — Push to GitHub first, then clone from VPS:

```bash
# On your local machine (Windows)
cd D:\AI\Booking_pixel
git remote add origin https://github.com/your-username/booking-pixel.git
git push -u origin master
```

```bash
# On VPS
git clone https://github.com/your-username/booking-pixel.git /opt/booking
cd /opt/booking
```

Option B — Direct SCP (no Git server):

```bash
# On your local machine (PowerShell)
scp -r D:\AI\Booking_pixel\* user@your-vps-ip:/opt/booking/
```

---

## Step 3: Configure Environment

```bash
# On VPS
cd /opt/booking
cp .env.example .env
nano .env
```

Fill in:
```env
DATABASE_URL=postgresql://booking:booking@localhost:5432/booking
AUTH_SECRET=<generate with: openssl rand -hex 32>
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>
```

To generate AUTH_SECRET: `openssl rand -hex 32`

---

## Step 4: Start Database

```bash
cd /opt/booking
docker compose up -d
```

---

## Step 5: Build & Run

```bash
cd /opt/booking
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run build
```

**Run via PM2 (recommended):**
```bash
sudo npm install -g pm2
pm2 start npm --name "booking" -- start
pm2 save
pm2 startup  # auto-start on reboot
```

---

## Step 6: Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/booking
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 7: SSL (optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Quick Update (after code changes)

```bash
cd /opt/booking
git pull
npm install        # if deps changed
npx prisma generate
npx prisma db push # if schema changed
npm run build
pm2 restart booking
```

---

## File Uploads

Uploads go to `public/uploads/`. Ensure this directory is writable:
```bash
mkdir -p /opt/booking/public/uploads
chmod 755 /opt/booking/public/uploads
```

For production, consider storing uploads on S3-compatible storage instead of local disk.
