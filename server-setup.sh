#!/bin/bash

# ===========================================
# Первоначальная настройка VPS для Task-Delegate
# Node.js + Nginx + PM2
# Запустите этот скрипт ОДИН РАЗ на сервере
# ===========================================

DOMAIN="tasks.magday.ru"
APP_PORT="5000"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Настройка сервера для Task-Delegate ===${NC}"

# 1. Обновление системы
echo -e "${GREEN}[1/6] Обновление системы...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Установка Node.js 20
echo -e "${GREEN}[2/6] Установка Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js уже установлен: $(node -v)"
fi

# 3. Установка PM2
echo -e "${GREEN}[3/6] Установка PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 уже установлен"
fi

# 4. Установка Nginx
echo -e "${GREEN}[4/6] Установка Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
else
    echo "Nginx уже установлен"
fi

# 5. Создание директории проекта
echo -e "${GREEN}[5/6] Создание директории...${NC}"
sudo mkdir -p /var/www/task-delegate/uploads
sudo chown -R $USER:$USER /var/www/task-delegate

# 6. Настройка Nginx
echo -e "${GREEN}[6/6] Настройка Nginx...${NC}"
sudo tee /etc/nginx/sites-available/task-delegate > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    # API и WebSocket запросы -> Node.js
    location /api {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Загруженные файлы -> Node.js
    location /uploads {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Всё остальное (статика) -> Node.js
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Активация сайта
sudo ln -sf /etc/nginx/sites-available/task-delegate /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка и перезапуск Nginx
sudo nginx -t && sudo systemctl restart nginx

# Настройка PM2 автозапуска
pm2 startup | tail -1 | bash 2>/dev/null || true

echo ""
echo -e "${GREEN}=== Настройка завершена! ===${NC}"
echo ""
echo "Nginx настроен для домена: $DOMAIN"
echo "Приложение будет работать на порту: $APP_PORT"
echo ""
echo "Теперь на ЛОКАЛЬНОМ компьютере запустите:"
echo "  bash deploy.sh"
echo ""
echo "После деплоя сайт будет доступен: http://$DOMAIN"
