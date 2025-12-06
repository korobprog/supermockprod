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
- Prisma ORM
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

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Сгенерируйте Prisma Client:
```bash
pnpm prisma generate
```

5. Примените миграции:
```bash
pnpm prisma db push
```

6. Запустите dev сервер:
```bash
pnpm dev
```

Приложение будет доступно по адресу http://localhost:3000

## Создание админа

Для создания администратора используйте Prisma Studio:
```bash
pnpm prisma studio
```

Или через SQL:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Структура проекта

- `app/` - Next.js App Router страницы и API routes
- `components/` - React компоненты
- `lib/` - Утилиты, Prisma client, аутентификация
- `prisma/` - Prisma схема и миграции

