# Варианты базы данных

На 7 мая 2026 года backend Budget Planner уже рассчитан на PostgreSQL:

- используется пакет `pg`;
- схема создается при старте сервера;
- пользовательские данные хранятся в таблицах `users`, `auth_sessions`, `budget_snapshots`;
- активный бюджет и архив сохраняются как JSONB snapshot, чтобы не переписывать текущий frontend-state и autosave.

## Что выбрать первым

Рекомендованный первый вариант: **Neon Postgres**.

Почему:

- текущий backend подключается без переписывания кода;
- есть free plan без банковской карты;
- connection string уже содержит `sslmode=require`;
- хорошо подходит для pet-project и портфолио, где нагрузка небольшая и приложение может простаивать.

Минимальные переменные окружения:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
DATABASE_SSL=true
DATABASE_POOL_MAX=5
```

## Сравнение

| Вариант | Совместимость с текущим backend | Бесплатно / дешево | Комментарий |
| --- | --- | --- | --- |
| Neon | Да, PostgreSQL | Free, далее usage-based | Лучший первый выбор: минимум изменений, serverless Postgres, scale-to-zero. |
| Supabase | Да, PostgreSQL | Free, Pro от платного тарифа | Хороший вариант, если позже захочется использовать Supabase Auth/Storage. Для текущего backend нужен только connection string. |
| Render Postgres | Да, PostgreSQL | Free есть, но временный | Уже описан в `render.yaml`, но free database истекает через 30 дней, поэтому не подходит для долгого хранения портфолио-данных. |
| Railway | Да, PostgreSQL | Есть trial и небольшой free credit | Удобно, но менее предсказуемо как полностью бесплатное долгосрочное хранилище. |
| Wispbyte | Не напрямую | Бесплатный/дешевый app hosting, MySQL в некоторых платных планах | Можно рассматривать для хостинга Node-приложения, но текущий backend использует PostgreSQL JSONB. Если брать Wispbyte MySQL, нужен отдельный MySQL-адаптер и изменение SQL. |
| MongoDB Atlas | Нет | M0 free | Можно хранить бюджеты документами, но это будет новая ветка реализации вместо продолжения текущего Postgres-подхода. |
| Firebase Firestore | Нет | Free quota | Хорошо для frontend-first приложений, но потребует другой data layer и другую модель авторизации. |

## План подключения Neon

1. Создать проект Neon и скопировать pooled или обычный connection string.
2. В Render добавить переменные:

```env
DATABASE_URL=<neon connection string>
DATABASE_SSL=true
DATABASE_POOL_MAX=5
```

3. Если используется внешний Neon вместо Render Postgres, убрать или не создавать встроенную базу Render.
4. Задеплоить backend.
5. Проверить `/health`: `database.status` должен стать `ok`, `database.provider` должен стать `neon`.
6. После подключения SMS проверить сценарий login -> archive -> autosave.

## Почему не MySQL сейчас

Wispbyte интересен как дешевый hosting, но текущий код уже опирается на PostgreSQL:

- `JSONB`;
- `TIMESTAMPTZ`;
- `$1`, `$2` placeholders из `pg`;
- `ON CONFLICT`;
- managed connection pool через `pg.Pool`.

Перевод на MySQL возможен, но это отдельная задача: нужно добавить драйвер, адаптер запросов, другую схему JSON и миграцию. Для первого backend-storage шага это даст больше риска, чем пользы.
