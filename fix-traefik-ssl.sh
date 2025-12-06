#!/bin/bash
# Скрипт для исправления конфигурации Traefik для SSL сертификатов
# Исправляет проблему с редиректом, блокирующим ACME challenge

CONFIG_FILE="/etc/dokploy/traefik/dynamic/supermock-nextjs-a1uugu.yml"
BACKUP_FILE="${CONFIG_FILE}.backup"

echo "Проверка конфигурации Traefik для supermock.ru..."

# Проверяем, существует ли файл
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Ошибка: Файл конфигурации не найден: $CONFIG_FILE"
    exit 1
fi

# Проверяем, нужно ли исправление
if grep -q "!PathPrefix(\`/.well-known/acme-challenge\`)" "$CONFIG_FILE"; then
    echo "Конфигурация уже исправлена. Выход."
    exit 0
fi

echo "Создание резервной копии..."
cp "$CONFIG_FILE" "$BACKUP_FILE"

echo "Применение исправления..."
# Исправляем правило роутера, добавляя исключение для ACME challenge
sed -i 's/rule: Host(`supermock.ru`)/rule: Host(`supermock.ru`) \&\& !PathPrefix(`\/.well-known\/acme-challenge`)/' "$CONFIG_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация успешно обновлена!"
    echo "Перезапуск Traefik для применения изменений..."
    docker restart dokploy-traefik
    echo "Готово! Traefik перезапущен."
else
    echo "❌ Ошибка при обновлении конфигурации. Восстановление из резервной копии..."
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    exit 1
fi

