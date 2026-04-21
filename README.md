# Budget Planner

Небольшое приложение для планирования личного бюджета.
Пользователь задает период, добавляет доходы и расходы, получает стартовый план и дальше редактирует его на главной странице.

## Что есть в проекте

- стартовая страница, форма, главная страница, архив и вход
- редактирование бюджета с автосохранением
- drag and drop, приоритеты, цвета секций и undo/redo
- сохранение данных в localStorage
- генерация стартового плана через backend

## Стек

- React + TypeScript
- SCSS Modules
- MUI Date Pickers
- Node.js backend

## Локальный запуск

### Frontend

```bash
cd frontend
npm install
npm start
```

Приложение откроется на `http://localhost:3000`.

### Backend

```bash
cp backend/.env.example backend/.env
cd backend
npm start
```

Для генерации плана нужно добавить ключ в `backend/.env`.
Backend запускается на `http://localhost:8787`.

Для входа по SMS и серверного хранения данных нужны:

- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
