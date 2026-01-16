#!/bin/bash

# ===========================================
# Скрипт деплоя Task-Delegate на VPS
# ===========================================

# Настройки - ИЗМЕНИТЕ ПОД СЕБЯ
SERVER_USER="tasks"
SERVER_HOST="tasks.magday.ru"
SERVER_PORT="50222"
REMOTE_PATH="/var/www/task-delegate"
APP_NAME="task-delegate"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Task-Delegate Deploy Script ===${NC}"

# 1. Сборка проекта
echo -e "${GREEN}[1/4] Сборка проекта...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка сборки!${NC}"
    exit 1
fi

# 2. Создание временной папки для деплоя
echo -e "${GREEN}[2/4] Подготовка файлов...${NC}"
DEPLOY_DIR="deploy_temp"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Копируем нужные файлы
cp -r dist $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp .env $DEPLOY_DIR/

# 3. Загрузка на сервер
echo -e "${GREEN}[3/4] Загрузка на сервер...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "mkdir -p $REMOTE_PATH"

rsync -avz --delete -e "ssh -p $SERVER_PORT" \
    $DEPLOY_DIR/ \
    $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка загрузки на сервер!${NC}"
    rm -rf $DEPLOY_DIR
    exit 1
fi

# 4. Установка зависимостей и перезапуск на сервере
echo -e "${GREEN}[4/4] Установка и перезапуск на сервере...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
    cd $REMOTE_PATH
    npm install --production

    # Проверяем, запущен ли PM2 процесс
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 restart $APP_NAME
    else
        pm2 start dist/index.cjs --name $APP_NAME
        pm2 save
    fi

    echo "Статус приложения:"
    pm2 status $APP_NAME
EOF

# Очистка
rm -rf $DEPLOY_DIR

echo -e "${GREEN}=== Деплой завершён! ===${NC}"
echo -e "Сайт: https://$SERVER_HOST"
