# Исправление ошибки 500 на странице /admin

## Проблема
Ошибка: `No metadata for "Payment" was found.`
Причина: TypeORM не мог найти метаданные для сущности Payment из-за использования строк вместо классов в `getRepository()`.

## Исправления

### 1. Исправлен lib/db.ts
Заменены строковые имена на классы в `getRepository()`:
- `getRepository("Payment")` → `getRepository(Payment)`
- Аналогично для всех других сущностей

### 2. Создан скрипт инициализации БД
`scripts/init-production-db.ts` - для создания таблиц в production

## Деплой исправлений

1. **Закоммитьте изменения:**
```bash
git add lib/db.ts scripts/init-production-db.ts
git commit -m "Fix: Use entity classes instead of strings in getRepository()"
git push
```

2. **После деплоя в Dokploy, инициализируйте базу данных:**
   - Откройте консоль приложения в Dokploy
   - Выполните:
   ```bash
   npx tsx scripts/init-production-db.ts
   ```

   Или через SSH на сервере:
   ```bash
   ssh root@168.222.255.226
   docker exec -it supermock-nextjs-a1uugu.1.7kg98w2ur4yxnrdifsm3brvf1 sh
   npx tsx scripts/init-production-db.ts
   ```

3. **Проверьте работу:**
   - Откройте https://supermock.ru/admin
   - Должна загрузиться админ панель без ошибок

## Альтернатива: временное включение synchronize

Если скрипт не работает, можно временно включить `synchronize: true` в `lib/db.ts`:

```typescript
synchronize: true, // Временно для создания таблиц
```

⚠️ **ВАЖНО**: После создания таблиц верните обратно:
```typescript
synchronize: process.env.NODE_ENV !== "production",
```

И перезапустите приложение.

---
Дата исправления: 2025-12-06

