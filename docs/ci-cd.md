# Архитектура CI/CD пайплайнов МИРОВИЗОР

Платформа использует современный стек непрерывной интеграции и доставки на базе **GitHub Actions** и **Docker**.

---

## 1. Пайплайн валидации и сборки (`.github/workflows/ci.yml`)

### Триггеры:
- `push` в ветку `main`
- `pull_request` в ветку `main`

### Матрица тестирования:
- Node.js `20.x` (LTS)
- Node.js `22.x` (Current)

### Стадии (Jobs):
1. **Checkout**: Загрузка исходного кода через `actions/checkout@v4`.
2. **Setup Node.js**: Настройка среды с кэшированием `npm cache`.
3. **Install**: Чистая установка зависимостей (`npm ci`).
4. **Lint & TypeCheck**: Статический анализ типов TypeScript (`npm run lint` -> `tsc --noEmit`).
5. **Unit Tests**: Запуск набора тестов (`npm test` -> `tsx src/test/suite.ts`).
   - Проверка жизненного цикла агрегата `RefundSaga` и переходов состояний.
   - Тестирование шины доменных событий `DomainEventBus`.
   - Проверка репозиториев (`orderRepository`, `billingRepository`, `procurementRepository`, `salesRepository`).
6. **Production Build**: Сборка фронтенда Vite и компиляция серверного бандла (`npm run build`).
7. **Smoke Test**: Фоновый запуск скомпилированного `dist/server.cjs` и проверка ответов `/api/health` и `/api/dsh/status`.

---

## 2. Пайплайн сборки контейнеров (`.github/workflows/docker.yml`)

### Триггеры:
- `push` в ветку `main`
- Создание релизного тега `v*.*.*`

### Особенности Docker-сборки:
- Multi-stage Dockerfile (`node:20-alpine`).
- Первый этап (`builder`): сборка и тестирование.
- Второй этап (`runner`): минимальный runtime без dev-зависимостей (`npm ci --omit=dev`), запуск от `node dist/server.cjs`.
- Публикация в GitHub Container Registry (`ghcr.io/spawnperm/vcore:latest`).
- Поддержка встроенного Healthcheck (`HEALTHCHECK` с проверкой `/api/health`).
