# 🌐 МИРОВИЗОР (VCORE) — Архитектурная платформа и единый пульт управления корпоративным порталом

[![CI/CD Pipeline](https://github.com/spawnperm/vcore/actions/workflows/ci.yml/badge.svg)](https://github.com/spawnperm/vcore/actions/workflows/ci.yml)
[![Docker Build & Push](https://github.com/spawnperm/vcore/actions/workflows/docker.yml/badge.svg)](https://github.com/spawnperm/vcore/actions/workflows/docker.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%207.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**МИРОВИЗОР (vcore)** — это сквозная среда разработки и оркестрации распределённой микросервисной системы для корпоративного портала ООО «Ромашка». Платформа объединяет граф архитектурного планирования (DAG/Mindmap с подсветкой критического пути), техническую документацию (ADR, OpenAPI, C4), живое зеркало портала с поддержкой предметно-ориентированного проектирования (DDD), мониторинг потоков данных и событий NATS JetStream Event Mesh, а также интеграцию с автономным шлюзом **DeepSeek-Harness (DSH)** и голосовым управлением **Gemini Live API**.

---

## 📑 Содержание

- [Ключевые возможности](#-ключевые-возможности)
- [Архитектурный обзор (DDD & C4)](#-архитектурный-обзор-ddd--c4)
- [Модули портала](#-модули-портала)
- [Технологический стек](#-технологический-стек)
- [Быстрый старт и запуск](#-быстрый-старт-и-запуск)
- [Команды npm](#-команды-npm)
- [CI/CD Пайплайн](#-cicd-пайплайн)
- [Конфигурация окружения (.env)](#-конфигурация-окружения-env)
- [Docker & Развёртывание](#-docker--развёртывание)
- [Документация и спецификации](#-документация-и-спецификации)
- [Лицензия](#-лицензия)

---

## 🚀 Ключевые возможности

1. **Интерактивный граф плана с критическим путём**:
   - Построение графа зависимостей архитектурных задач (DAG).
   - Автоматический расчет цепочки блокирующих задач (Upstream Blockers).
   - Визуальное выделение критических рёбер неоновым янтарно-красным градиентом с бейджами `⚠️ БЛОКИРУЕТ` и `🔥 ПРЕДШЕСТВЕННИК`.
   - Интерактивный HUD-баннер с быстрым переходом к узлам-блокерам в один клик.

2. **Модульная архитектура DDD (Domain-Driven Design)**:
   - Изолированные Bounded Contexts: `Billing (Платёжная сага)`, `Orders (Управление заказами)`, `Procurement (Закупки, поставщики, склад)`, `Sales (Клиенты, воронка)`, `UX Review (Аудит и ревью)`.
   - Встроенная шина доменных событий (`DomainEventBus`).

3. **Распределённая платёжная сага (Refund Saga) на NATS JetStream**:
   - Пошаговое выполнение распределённых транзакций (`VALIDATE_REQUEST` → `ACQUIRER_CALL` → `LEDGER_ADJUSTMENT` → `JETSTREAM_EVENT` → `CLIENT_NOTIFICATION`).
   - Субмиллисекундная передача сообщений, публикация в subject `orders.v1.refund` через NATS JetStream Event Mesh.

4. **DeepSeek-Harness (DSH) Gateway & Gemini Live API**:
   - Двунаправленное потоковое взаимодействие с моделями семейства Gemini (3.8 Flash, Live API).
   - Поддержка мультимодального аудиопотока 16kHz PCM / 24kHz PCM через WebSocket.
   - Генерация AST-патчей и автоматическое выполнение тестов через `/api/dsh/stream` и `/api/dsh/status`.

5. **Мониторинг потоков данных (DataFlows) & NATS Консоль**:
   - Визуализация сервисов, кластера NATS 2.10 JetStream (3-Node Raft), баз данных PostgreSQL и внешних систем.
   - Встроенная интерактивная консоль NATS JetStream (streams, consumers, Key-Value store, Pub/Sub subjects).
   - Маркировка конфиденциальных персональных данных (PII) и отслеживание задержек/проблем.

---

## 🏛 Архитектурный обзор (DDD & C4)

```
[Пользователь / Браузер]
         │  HTTP / WS (Port 3000)
         ▼
┌──────────────────────────────────────────────────────────┐
│                   МИРОВИЗОР (Express + Vite)              │
│                                                          │
│  ┌───────────────────────┐   ┌────────────────────────┐  │
│  │   React 19 Frontend   │   │  Express Backend API   │  │
│  │  - PlanTab (DAG / CP) │   │  - /api/health         │  │
│  │  - DocsTab (ADR/API)  │   │  - /api/dsh/status     │  │
│  │  - PortalViewTab (DDD)│   │  - /api/dsh/stream     │  │
│  │  - DataFlowsTab       │   │  - /api/live/ws (PCM)  │  │
│  │  - HistoryTab         │   └───────────┬────────────┘  │
│  └───────────────────────┘               │               │
└──────────────────────────────────────────┼───────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
             [Gemini 3.8 Flash API]          [NATS 2.10 JetStream Event Mesh]
```

### Структура каталогов Bounded Contexts:
```
src/modules/portal/
├── domain/                  # Сущности, Value Objects, Доменные события
│   ├── common/              # Money, DomainEvent, AggregateRoot
│   ├── billing/             # RefundSaga, SagaStepDetail, транзакции
│   ├── orders/              # Order, OrderItem, статусы
│   ├── procurement/         # Supplier, Contract, InventoryItem
│   ├── sales/               # Client, SalesDeal, воронка продаж
│   └── review/              # UxComment, ScreenAnnotation
├── infrastructure/          # Репозитории и внутренняя шина событий
│   ├── eventBus.ts          # Реализация DomainEventBus
│   └── repositories/        # Хранилища данных в оперативной памяти
├── application/             # React контексты и Use Cases
└── ui/                      # Модульные представления экранов портала
```

---

## 🛠 Технологический стек

- **Ядро**: Node.js 20+, TypeScript 5.x / 7.x, Express 4.x
- **Клиент**: React 19, Vite 6+, Tailwind CSS v4, Motion (Framer Motion)
- **Иконки & Стили**: Lucide React, Tailwind CSS Plugins
- **AI & Realtime**: `@google/genai` (Gemini 3.8 Flash, Live API), `ws` (WebSocket)
- **Контейнеризация**: Docker, Multi-stage alpine build
- **CI/CD**: GitHub Actions (Lint, Typecheck, Test, Build, Docker Build)

---

## ⚡ Быстрый старт и запуск

### Требования:
- Node.js `>= 20.0.0`
- npm `>= 10.0.0` (или bun)

### Установка:
```bash
# 1. Клонирование репозитория
git clone https://github.com/spawnperm/vcore.git
cd vcore

# 2. Установка зависимостей
npm install

# 3. Настройка переменных окружения
cp .env.example .env
```

### Запуск в режиме разработки:
```bash
npm run dev
```
Сервер будет доступен по адресу: `http://localhost:3000`.

### Сборка для production:
```bash
npm run build
npm start
```

---

## 📜 Команды npm

| Команда | Назначение |
| :--- | :--- |
| `npm run dev` | Запуск приложения в режиме разработки (Express + Vite HMR) |
| `npm run build` | Сборка клиентской статики Vite и компиляция backend bundle `dist/server.cjs` |
| `npm run start` | Запуск собранного production-сервера |
| `npm run lint` | Проверка типов TypeScript (`tsc --noEmit`) |
| `npm run test` | Запуск набора модульных тестов и проверок доменной логики |
| `npm run clean` | Очистка скомпилированных артефактов |

---

## 🔄 CI/CD Пайплайн

В проекте настроен автоматический CI/CD процесс на базе **GitHub Actions**:

### 1. `ci.yml` — Непрерывная интеграция (CI)
Запускается при каждом `push` и `pull_request` в ветку `main`.
- **Lint & TypeCheck**: Валидация строгости типов TypeScript для фронтенда и бэкенда.
- **Unit Tests**: Выполнение тестов доменных моделей (Saga, EventBus, Repositories).
- **Production Build**: Проверка корректности сборки бандла через `npm run build`.
- **Health Check Verification**: Проверка эндпоинта `/api/health` на скомпилированном артефакте.

### 2. `docker.yml` — Сборка и доставка контейнера (CD)
- Автоматическая сборка оптимизированного Multi-stage Docker-образа.
- Сканирование уязвимостей и публикация в GitHub Container Registry (`ghcr.io`).

---

## ⚙️ Конфигурация окружения (.env)

| Переменная | Обязательная | Назначение |
| :--- | :---: | :--- |
| `PORT` | Нет | Порт сервера (по умолчанию `3000`) |
| `NODE_ENV` | Нет | Режим работы (`development` или `production`) |
| `GEMINI_API_KEY` | Да (для Live/AI) | Ключ Google AI Studio для работы шлюза DSH и Gemini Live API |
| `APP_URL` | Нет | Публичный URL приложения (для Webhook / OAuth) |

---

## 🐳 Docker & Развёртывание

Сборка локального Docker-образа:
```bash
docker build -t vcore:latest .
```

Запуск контейнера:
```bash
docker run -d -p 3000:3000 \
  -e GEMINI_API_KEY="your_api_key_here" \
  --name mirovisor vcore:latest
```

Проверка здоровья контейнера:
```bash
curl http://localhost:3000/api/health
```

---

## 📚 Документация и спецификации

- [ADR-042: Механизм возврата платежей (Saga Orchestration)](docs/adr/ADR-042-refund-saga.md)
- [C4 Model: Архитектурные диаграммы системы](docs/architecture/c4-model.md)
- [API Reference: Спецификация эндпоинтов шлюза DSH](docs/api/dsh-gateway.md)
- [CI/CD Workflow: Руководство по пайплайнам](docs/ci-cd.md)

---

## 📄 Лицензия

Проект распространяется под лицензией [MIT](LICENSE).
Автор: Александр Смирнов ([@spawnperm](https://github.com/spawnperm)).
