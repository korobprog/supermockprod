# SuperMock - Платформа для подготовки к IT-собеседованиям

Платформа для взаимной подготовки к IT-собеседованиям, где пользователи помогают друг другу тренироваться.

## Функционал

- Создание карточек собеседований с указанием профессии, стека технологий и даты/времени
- Система откликов с обязательством провести ответное собеседование
- Фидбек система после завершения собеседований
- Система баллов за успешные собеседования
- 3 бесплатных собеседования, затем подписка (100 рублей/неделю)
- Админ панель для управления платежами

## Технологии

- Next.js 15 (App Router)
- TypeScript
- TypeORM
- PostgreSQL
- NextAuth.js
- Tailwind CSS

## Установка и запуск

1. Установите зависимости:
```bash
pnpm install
```

2. Запустите PostgreSQL в Docker:
```bash
docker-compose up -d
```

3. Создайте файл `.env` и добавьте необходимые переменные:
```bash
# Database
DATABASE_URL=postgres://supermock:supermock_password@localhost:5434/supermock_db

# NextAuth
AUTH_SECRET=your-secret-key-here

# Admin Access (опционально - для быстрого доступа к админ панели)
ADMIN_USER=admin@example.com
ADMIN_PASS=admin123

# Node Environment
NODE_ENV=development
```

4. Запустите dev сервер:
```bash
pnpm dev
```

Приложение будет доступно по адресу http://localhost:3000

## Создание админа

### Способ 1: Через переменные окружения (самый быстрый)

Добавьте в файл `.env`:
```env
ADMIN_USER=admin@example.com
ADMIN_PASS=your-secure-password
```

После этого вы сможете войти в админ панель используя эти учетные данные на странице `/login`. Этот способ не требует создания пользователя в базе данных.

**Важно:** Этот способ работает только если обе переменные `ADMIN_USER` и `ADMIN_PASS` установлены в `.env`.

### Способ 2: Использование скрипта (рекомендуется для продакшена)

Создать нового админ пользователя или обновить существующего:
```bash
pnpm create:admin [email] [password] [name]
```

Примеры:
```bash
# Создать админа с параметрами по умолчанию (admin@example.com / admin123)
pnpm create:admin

# Создать админа с кастомными данными
pnpm create:admin myadmin@example.com mypassword123 "Admin Name"

# Обновить существующего пользователя до админа
pnpm create:admin existing@example.com
```

### Способ 3: Через SQL

Если у вас есть доступ к базе данных напрямую:
```sql
UPDATE "users" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Способ 4: Через SQL напрямую

1. Подключитесь к базе данных через psql или другой клиент
2. Найдите пользователя в таблице `users`
3. Измените поле `role` на `ADMIN`:
```sql
UPDATE "users" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Вход в админ панель

После получения роли ADMIN:
1. Войдите в систему через `/login` с вашими учетными данными
2. В навигационном меню появится ссылка "Админ панель"
3. Или перейдите напрямую по адресу `/admin`

## Структура проекта

- `app/` - Next.js App Router страницы и API routes
- `components/` - React компоненты
- `lib/` - Утилиты, TypeORM, аутентификация
- `src/entities/` - TypeORM сущности
- `src/data-source.ts` - TypeORM DataSource конфигурация

