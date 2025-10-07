# Rus Medical Backend

Backend API для сайту лікаря Руслани Москаленко - торакального хірурга-онколога.

## 🚀 Технології

- **Node.js** + **TypeScript**
- **Express.js** - веб-фреймворк
- **Prisma** - ORM для роботи з базою даних
- **PostgreSQL** - база даних
- **JWT** - аутентифікація
- **Multer** - завантаження файлів
- **Sharp** - обробка зображень
- **Railway** - хостинг

## 📁 Структура проекту

```
backend/
├── src/
│   ├── middleware/          # Middleware функції
│   │   ├── auth.ts         # Аутентифікація
│   │   └── upload.ts       # Завантаження файлів
│   ├── routes/             # API маршрути
│   │   ├── auth.ts         # Аутентифікація
│   │   ├── articles.ts     # Статті
│   │   ├── gallery.ts      # Галерея
│   │   ├── contact.ts      # Контактні повідомлення
│   │   └── upload.ts       # Завантаження файлів
│   └── server.ts           # Головний сервер
├── prisma/
│   └── schema.prisma       # Схема бази даних
├── scripts/
│   └── seed.ts            # Наповнення БД тестовими даними
├── uploads/               # Завантажені файли
├── package.json
├── tsconfig.json
└── railway.json          # Конфігурація Railway
```

## 🛠 Встановлення

### Локальна розробка

1. **Встановіть залежності:**
```bash
cd backend
npm install
```

2. **Налаштуйте змінні середовища:**
```bash
cp env.example .env
```

3. **Налаштуйте базу даних:**
```bash
# Генеруйте Prisma клієнт
npm run generate

# Запустіть міграції
npm run migrate

# Наповніть БД тестовими даними
npx ts-node scripts/seed.ts
```

4. **Запустіть сервер:**
```bash
# Розробка
npm run dev

# Продакшн
npm run build
npm start
```

### Railway Deployment

1. **Підключіть PostgreSQL:**
   - Додайте PostgreSQL плагін в Railway
   - Скопіюйте `DATABASE_URL` в змінні середовища

2. **Налаштуйте змінні середовища:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend.railway.app
RAILWAY_STATIC_URL=https://your-backend.railway.app
```

3. **Деплой:**
   - Railway автоматично збудує та запустить проект
   - Міграції запустяться автоматично

## 📚 API Endpoints

### Аутентифікація
- `POST /api/auth/login` - Вхід
- `POST /api/auth/register` - Реєстрація (тільки адмін)
- `GET /api/auth/me` - Поточний користувач
- `PUT /api/auth/change-password` - Зміна пароля

### Статті
- `GET /api/articles` - Список статей
- `GET /api/articles/:id` - Одна стаття
- `POST /api/articles` - Створити статтю (адмін)
- `PUT /api/articles/:id` - Оновити статтю (адмін)
- `DELETE /api/articles/:id` - Видалити статтю (адмін)
- `PATCH /api/articles/:id/publish` - Опублікувати/приховати (адмін)

### Галерея
- `GET /api/gallery` - Список зображень
- `GET /api/gallery/:id` - Одне зображення
- `POST /api/gallery` - Додати зображення (адмін)
- `PUT /api/gallery/:id` - Оновити зображення (адмін)
- `DELETE /api/gallery/:id` - Видалити зображення (адмін)
- `PATCH /api/gallery/reorder` - Змінити порядок (адмін)

### Завантаження файлів
- `POST /api/upload/single` - Завантажити один файл (адмін)
- `POST /api/upload/multiple` - Завантажити кілька файлів (адмін)
- `DELETE /api/upload/:filename` - Видалити файл (адмін)
- `GET /api/upload` - Список файлів (адмін)

### Контакти
- `POST /api/contact` - Відправити повідомлення
- `GET /api/contact` - Список повідомлень (адмін)
- `GET /api/contact/:id` - Одне повідомлення (адмін)
- `PATCH /api/contact/:id/read` - Позначити як прочитане (адмін)
- `DELETE /api/contact/:id` - Видалити повідомлення (адмін)

## 🔐 Безпека

- **JWT токени** для аутентифікації
- **bcrypt** для хешування паролів
- **Rate limiting** для захисту від DDoS
- **Helmet** для безпеки заголовків
- **CORS** налаштований для фронтенду
- **Валідація файлів** при завантаженні

## 📁 Завантаження файлів

### Підтримувані формати:
- **Зображення:** JPEG, PNG, WebP
- **Відео:** MP4, WebM, QuickTime

### Обробка зображень:
- Автоматичне зменшення до 1200x800px
- Оптимізація якості (85%)
- Конвертація в JPEG

### Зберігання:
- Локально: `./uploads/`
- Railway: автоматичне зберігання

## 🗄 База даних

### Моделі:
- **User** - користувачі (адміни)
- **Article** - статті
- **GalleryImage** - зображення галереї
- **ContactMessage** - контактні повідомлення

### Міграції:
```bash
npm run migrate    # Запустити міграції
npm run generate   # Генерувати клієнт
```

## 🚀 Railway Deployment

1. **Підключіть репозиторій** до Railway
2. **Додайте PostgreSQL** плагін
3. **Налаштуйте змінні середовища**
4. **Деплой** - Railway автоматично:
   - Встановить залежності
   - Збудує проект
   - Запустить міграції
   - Запустить сервер

## 📊 Моніторинг

- **Health check:** `/health`
- **Логи:** Railway Dashboard
- **Метрики:** Railway Analytics

## 🔧 Розробка

### Команди:
```bash
npm run dev        # Розробка з hot reload
npm run build      # Збірка для продакшну
npm start          # Запуск продакшн версії
npm run migrate    # Міграції БД
npm run generate   # Генерація Prisma клієнта
npm run studio     # Prisma Studio
```

### Тестові дані:
```bash
npx ts-node scripts/seed.ts
```

**Тестовий адмін:**
- Email: `admin@rus-medical.com`
- Password: `admin123`

## 📝 Ліцензія

Приватний проект для медичного сайту.
