#!/bin/bash

# ===========================================
# Скрипт деплоя Task-Delegate на VPS
# Запускается локально, выполняет команды на сервере
# ===========================================

# Настройки сервера
SERVER_USER="tasks"
SERVER_HOST="tasks.magday.ru"
SERVER_PORT="50222"
REMOTE_PATH="/var/www/tasks/data/www/tasks.magday.ru"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Task-Delegate Deploy ===${NC}"
echo -e "Сервер: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PORT}"
echo -e "Путь: ${REMOTE_PATH}"
echo ""

# Выполняем команды на сервере
echo -e "${GREEN}Подключение к серверу...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /var/www/tasks/data/www/tasks.magday.ru

    echo ">>> git pull"
    git pull

    echo ">>> npm run db:push"
    npm run db:push

    echo ">>> npm run add-companies"
    npm run add-companies

    echo ">>> npm run build"
    npm run build

    echo ">>> pm2 restart 0"
    pm2 restart 0

    echo ""
    echo ">>> pm2 status"
    pm2 status
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=== Деплой завершён! ===${NC}"
    echo -e "Сайт: https://${SERVER_HOST}"
else
    echo ""
    echo -e "${RED}=== Ошибка деплоя! ===${NC}"
    exit 1
fi
