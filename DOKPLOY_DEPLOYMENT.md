# Деплой SuperMock в Dokploy

## Переменные окружения для продакшена

При настройке приложения в Dokploy, вам необходимо прописать следующие переменные окружения:

### 1. DATABASE_URL (ОБЯЗАТЕЛЬНО)
Строка подключения к PostgreSQL базе данных.

**Формат:**
```
postgresql://username:password@hostname:5432/database_name
```

**Для Dokploy:**
- Если вы создаете PostgreSQL через Dokploy, он предоставит вам внутренний URL
- Формат обычно: `postgresql://postgres:your_password@postgres:5432/supermock_db`
- Используйте внутренний service name вместо localhost

**Пример:**
```
DATABASE_URL=postgresql://supermock:MySecurePassword123@postgres:5432/supermock_db
```

> [!IMPORTANT]
> Для production используйте безопасный пароль и обязательно добавьте `?sslmode=require` если ваша БД требует SSL.

---

### 2. AUTH_SECRET (ОБЯЗАТЕЛЬНО)
Секретный ключ для шифрования JWT токенов NextAuth.

**Требования:**
- Минимум 32 символа
- Случайная строка
- Никогда не используйте одинаковый секрет для dev и production

**Генерация секрета:**
```bash
openssl rand -base64 32
```

**Пример:**
```
AUTH_SECRET=your-generated-secret-key-here-min-32-chars-long
```

> [!WARNING]
> Храните этот ключ в секрете! Никогда не коммитьте его в Git.

**Альтернатива:**
Вместо `AUTH_SECRET` можно использовать `NEXTAUTH_SECRET` (они взаимозаменяемы):
```
NEXTAUTH_SECRET=your-generated-secret-key-here-min-32-chars-long
```

---

### 3. NODE_ENV (ОБЯЗАТЕЛЬНО)
Режим работы приложения.

**Для продакшена:**
```
NODE_ENV=production
```

> [!NOTE]
> В production режиме отключена автоматическая синхронизация схемы БД (TypeORM synchronize: false), что безопаснее для production.

---

## Полный список переменных для Dokploy

Скопируйте эти переменные в раздел "Environment Variables" вашего приложения в Dokploy:

```env
# Database Connection
DATABASE_URL=postgresql://username:password@postgres:5432/supermock_db

# Authentication
AUTH_SECRET=your-secret-key-min-32-chars

# Node Environment
NODE_ENV=production
```

---

## Настройка PostgreSQL в Dokploy

### Вариант 1: Использование Dokploy PostgreSQL
1. В Dokploy создайте новый PostgreSQL service
2. Запомните имя сервиса (например, `postgres`)
3. Используйте это имя в DATABASE_URL: `postgresql://user:pass@postgres:5432/dbname`

### Вариант 2: Внешняя БД
Если используете внешнюю PostgreSQL (Supabase, Railway, Neon и т.д.):
1. Получите строку подключения от провайдера
2. Убедитесь, что добавлен `?sslmode=require` если требуется
3. Вставьте полный URL в DATABASE_URL

---

## Пошаговая инструкция деплоя в Dokploy

### Шаг 1: Подготовка репозитория
```bash
# Добавьте remote репозиторий (если еще не добавлен)
git remote add origin https://github.com/korobprog/supermockprod.git

# Закоммитьте изменения
git add .
git commit -m "Prepare for Dokploy deployment"

# Отправьте в репозиторий
git push -u origin main
```

### Шаг 2: Создание приложения в Dokploy
1. Войдите в панель Dokploy
2. Создайте новое приложение (Application)
3. Выберите тип: **Git**
4. Укажите репозиторий: `https://github.com/korobprog/supermockprod.git`
5. Выберите ветку: `main`

### Шаг 3: Настройка сборки
1. Build Type: **Dockerfile**
2. Dockerfile Path: `Dockerfile`
3. Port: `3000`

### Шаг 4: Добавление переменных окружения
В разделе Environment Variables добавьте:
```
DATABASE_URL=<ваша_строка_подключения>
AUTH_SECRET=<ваш_секретный_ключ>
NODE_ENV=production
```

### Шаг 5: Настройка базы данных
**Если используете Dokploy PostgreSQL:**
1. Создайте новый PostgreSQL service
2. Настройте:
   - Database Name: `supermock_db`
   - Username: `supermock`
   - Password: (сгенерируйте безопасный пароль)
3. Получите internal connection string
4. Добавьте в DATABASE_URL приложения

### Шаг 6: Деплой
1. Нажмите "Deploy"
2. Дождитесь окончания сборки
3. Проверьте логи на наличие ошибок

### Шаг 7: Миграции базы данных
После первого деплоя TypeORM автоматически создаст таблицы при первом запросе (в dev режиме).
Для production рекомендуется использовать миграции:

```bash
# Локально создайте миграцию
pnpm run migration:generate ./src/migrations/InitialSchema

# Закоммитьте миграции в Git
git add src/migrations
git commit -m "Add database migrations"
git push

# В Dokploy откройте консоль и выполните
pnpm run migration:run
```

---

## Проверка деплоя

После успешного деплоя проверьте:
1. ✅ Приложение доступно по URL
2. ✅ Можно зарегистрироваться
3. ✅ Можно войти в систему
4. ✅ База данных работает корректно

---

## Troubleshooting

### Ошибка подключения к БД
- Проверьте правильность DATABASE_URL
- Убедитесь, что PostgreSQL service запущен
- Проверьте, что используете internal hostname

### Ошибка AUTH_SECRET
- Убедитесь, что секрет минимум 32 символа
- Проверьте, что переменная установлена в Dokploy

### Приложение не запускается
- Проверьте логи сборки в Dokploy
- Убедитесь, что все переменные окружения установлены
- Проверьте, что порт 3000 открыт

---

## Безопасность

> [!CAUTION]
> 1. **Никогда** не коммитьте `.env` файлы в Git
> 2. Используйте **сложные пароли** для БД
> 3. Регулярно **ротируйте** AUTH_SECRET
> 4. Включите **SSL** для подключения к БД в production
> 5. Используйте **разные учетные данные** для dev и production

---

## Дополнительные переменные (опционально)

### NEXTAUTH_URL
URL вашего приложения (обычно Dokploy устанавливает автоматически):
```
NEXTAUTH_URL=https://your-app.dokploy.com
```

### SSL Configuration
Если требуется специальная настройка SSL:
```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```
