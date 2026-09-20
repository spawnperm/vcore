import {
  MindmapNode,
  MindmapLink,
  DocItem,
  PortalScreen,
  DataFlowNode,
  DataFlowStream,
  HistoryEvent,
  AgentChatMessage,
} from './types';

export const INITIAL_NODES: MindmapNode[] = [
  {
    id: 'root',
    label: 'Портал МИРОВИЗОР',
    category: 'stack',
    status: 'in_progress',
    progress: 68,
    x: 420,
    y: 220,
    description: 'Центральный каркас корпоративного портала ООО «Ромашка»',
  },
  // Backend & Stack Branch
  {
    id: 'stack-root',
    parentId: 'root',
    label: '🧩 Стек сервисов',
    category: 'stack',
    status: 'in_progress',
    progress: 75,
    x: 650,
    y: 120,
    description: 'Микросервисная архитектура backend-платформы',
  },
  {
    id: 'billing-node',
    parentId: 'stack-root',
    label: 'Billing (Сервис платежей)',
    category: 'stack',
    status: 'in_progress',
    progress: 60,
    agent: 'Billing-агент',
    agentRole: 'Генерация Saga-оркестратора',
    isNew: true,
    x: 880,
    y: 80,
    description: 'Управление транзакциями, списаниями и возвратами',
    relatedDocId: 'adr-042',
    relatedScreenId: 'screen-billing',
    relatedFlowId: 'billing-service',
  },
  {
    id: 'saga-pattern',
    parentId: 'billing-node',
    label: '⚙️ Паттерн Saga',
    category: 'stack',
    status: 'in_progress',
    progress: 85,
    agent: 'Billing-агент',
    agentRole: 'Тестирование компенсирующих транзакций',
    isNew: true,
    x: 1080,
    y: 40,
    description: 'Распределённая транзакция: Order -> Payment -> Refund -> Notify',
    relatedDocId: 'adr-042',
    relatedFlowId: 'stream-billing-jetstream',
  },
  {
    id: 'refund-endpoint',
    parentId: 'billing-node',
    label: 'POST /refund',
    category: 'stack',
    status: 'in_progress',
    progress: 70,
    agent: 'API-агент',
    isNew: true,
    x: 1080,
    y: 120,
    description: 'Эндпоинт оформления возврата средств покупателю',
    relatedDocId: 'api-refund',
    relatedScreenId: 'screen-billing',
  },
  {
    id: 'gateway-node',
    parentId: 'stack-root',
    label: 'API Gateway (Envoy)',
    category: 'stack',
    status: 'completed',
    progress: 100,
    x: 880,
    y: 170,
    description: 'Маршрутизация внешних запросов, rate-limiting и TLS offloading',
  },
  {
    id: 'auth-node',
    parentId: 'stack-root',
    label: 'Auth & SSO (Keycloak)',
    category: 'stack',
    status: 'completed',
    progress: 100,
    x: 880,
    y: 250,
    description: 'Единая точка авторизации по протоколам OAuth2/OIDC',
    relatedDocId: 'adr-041',
  },
  // UI & Screens Branch
  {
    id: 'ui-root',
    parentId: 'root',
    label: '🖼️ Интерфейс портала',
    category: 'ui',
    status: 'in_progress',
    progress: 80,
    x: 650,
    y: 340,
    description: 'Модули веб-интерфейса для сотрудников и контрагентов',
  },
  {
    id: 'ui-orders',
    parentId: 'ui-root',
    label: '🏢 Продажи → Заказы',
    category: 'ui',
    status: 'completed',
    progress: 100,
    x: 880,
    y: 330,
    description: 'Реестр заказов с фильтрами, статусами и экспортом',
    relatedScreenId: 'screen-orders',
  },
  {
    id: 'ui-billing-menu',
    parentId: 'ui-root',
    label: '🏢 Меню Billing 🆕',
    category: 'ui',
    status: 'in_progress',
    progress: 60,
    agent: 'UI/UX-агент',
    isNew: true,
    x: 880,
    y: 410,
    description: 'Новый пункт бокового меню и карточка возвратов',
    relatedScreenId: 'screen-billing',
  },
  // Infrastructure Branch
  {
    id: 'infra-root',
    parentId: 'root',
    label: '🏗️ Инфраструктура',
    category: 'infra',
    status: 'completed',
    progress: 95,
    x: 200,
    y: 120,
    description: 'Kubernetes кластер, брокер очередей и СУБД',
  },
  {
    id: 'infra-k8s',
    parentId: 'infra-root',
    label: 'K8s Cluster (Replicas 5)',
    category: 'infra',
    status: 'completed',
    progress: 100,
    agent: 'Инфра-агент',
    x: -30,
    y: 80,
    description: 'Масштабирование подов до 5 реплик в проде',
  },
  {
    id: 'infra-nats',
    parentId: 'infra-root',
    label: '⚡ NATS JetStream (3-Node Raft)',
    category: 'infra',
    status: 'completed',
    progress: 100,
    isNew: true,
    x: -30,
    y: 240,
    description: 'Event Mesh сверхнизкой задержки (P99 1.6мс), Pub/Sub, Key-Value и очереди JetStream',
    relatedDocId: 'adr-043',
    relatedFlowId: 'nats-cluster',
  },
  // Security & Docs
  {
    id: 'sec-root',
    parentId: 'root',
    label: '🔐 Безопасность & CI/CD',
    category: 'security',
    status: 'in_progress',
    progress: 75,
    x: 200,
    y: 340,
    description: 'Маскирование PII, аудит действий и проверки пайплайна',
  },
  {
    id: 'sec-pii',
    parentId: 'sec-root',
    label: 'PII Маскирование карт',
    category: 'security',
    status: 'in_progress',
    progress: 65,
    agent: 'SecOps-агент',
    x: -30,
    y: 340,
    description: 'Шифрование номеров карт и персональных данных в логах',
  },
];

export const INITIAL_LINKS: MindmapLink[] = [
  { id: 'l1', source: 'root', target: 'stack-root', isPulsing: true },
  { id: 'l2', source: 'root', target: 'ui-root' },
  { id: 'l3', source: 'root', target: 'infra-root' },
  { id: 'l4', source: 'root', target: 'sec-root' },
  { id: 'l5', source: 'stack-root', target: 'billing-node', isPulsing: true, isNew: true },
  { id: 'l6', source: 'billing-node', target: 'saga-pattern', isPulsing: true, isNew: true },
  { id: 'l7', source: 'billing-node', target: 'refund-endpoint', isPulsing: true, isNew: true },
  { id: 'l8', source: 'stack-root', target: 'gateway-node' },
  { id: 'l9', source: 'stack-root', target: 'auth-node' },
  { id: 'l10', source: 'ui-root', target: 'ui-orders' },
  { id: 'l11', source: 'ui-root', target: 'ui-billing-menu', isPulsing: true, isNew: true },
  { id: 'l12', source: 'infra-root', target: 'infra-k8s' },
  { id: 'l14', source: 'sec-root', target: 'sec-pii', isPulsing: true },
  // Cross-domain links
  { id: 'l15', source: 'saga-pattern', target: 'infra-nats', label: 'события саги (JetStream)', isPulsing: true },
  { id: 'l16', source: 'billing-node', target: 'ui-billing-menu', label: 'UI интеграция' },
  { id: 'l17', source: 'infra-root', target: 'infra-nats', isPulsing: true, isNew: true },
  { id: 'l18', source: 'billing-node', target: 'infra-nats', label: 'NATS RPC & JetStream', isPulsing: true, isNew: true },
];

export const MOCK_DOCS: DocItem[] = [
  {
    id: 'adr-042',
    title: 'ADR-042: Механизм возврата платежей',
    type: 'adr',
    status: 'draft',
    author: 'агент Billing',
    relatedNodes: ['billing-node', 'saga-pattern', 'refund-endpoint'],
    tags: ['Архитектура', 'Saga', 'Billing', 'Транзакции'],
    lastModified: '2 минуты назад',
    version: '0.4-draft',
    versions: [
      {
        id: 'ver-adr042-1',
        versionNumber: 'v0.1-init',
        createdAt: '18.09.2026 10:15',
        createdBy: 'агент Billing',
        summary: 'Первоначальный проект: синхронный вызов шлюза банка и двухфазный коммит (2PC)',
        status: 'deprecated',
        content: `# ADR-042: Механизм возврата платежей

**Статус:** ⛔ устарело (отклонено)  
**Автор:** агент Billing  
**Связано:** 🧩 Billing, ⚙️ 2PC Sync  
**Утверждающие:** Иван Петров (Tech Lead)  

---

## Контекст
Сервису Billing необходим надёжный автоматизированный механизм возврата платежей.  
Существующий процесс — ручной, требует подтверждения бухгалтерии в 1С и занимает до 3 рабочих дней.

## Требования
1. Атомарность возврата с гарантированной отменой.
2. Синхронное уведомление клиента по Email.
3. Время реакции API < 2000 мс.

## Решение (Отклонено)
Использовать распределённый **Двухфазный коммит (2PC)** между базой данных Billing и шлюзом эквайера:

\`\`\`
[Клиент] ──▶ [Billing Service] ──(2PC Prepare/Commit)──▶ [Bank Acquirer]
\`\`\`

При недоступности банковского шлюза транзакция блокирует строку баланса до таймаута (до 60 секунд).

## Причина отклонения
2PC создаёт критические блокировки таблиц БД в высоконагруженной среде и приводит к каскадным сбоям пула соединений.
`,
      },
      {
        id: 'ver-adr042-2',
        versionNumber: 'v0.3-saga',
        createdAt: '19.09.2026 14:40',
        createdBy: 'Иван Петров (Архитектор)',
        summary: 'Переход на паттерн Saga с оркестратором и компенсирующими транзакциями',
        status: 'approved',
        content: `# ADR-042: Механизм возврата платежей

**Статус:** ✅ утверждён (архивный)  
**Автор:** агент Billing  
**Связано:** 🧩 Billing, ⚙️ Saga Orchestrator  
**Утверждающие:** Иван Петров (Tech Lead), SecOps  

---

## Контекст
Сервису Billing необходим надёжный автоматизированный механизм возврата платежей.  
Существующий процесс — ручной, требует подтверждения бухгалтерии в 1С и занимает до 3 рабочих дней.

## Требования
1. Атомарность возврата с гарантированной отменой при сбоях банковского шлюза.
2. Асинхронное уведомление клиента по SMS/Email через сервис Notify.
3. Время реакции API на инициацию возврата < 500 мс.
4. Полный журнал аудита для службы безопасности.

## Решение
Используем паттерн **Saga с централизованным оркестратором**:

\`\`\`
[Клиент/Менеджер] ──▶ [Billing Service]
                             │
            ┌────────────────┴────────────────┐
            │ 1. Блокировка суммы в БД         │
            │ 2. Запрос в Bank Provider       │
            │ 3. Публикация в очередь событий │
            └─────────────────────────────────┘
\`\`\`

В случае сбоя эквайера запускается компенсирующая транзакция: снятие блокировки в PostgreSQL и перевод статуса заказа в \`REFUND_FAILED\`.
`,
      },
      {
        id: 'ver-adr042-3',
        versionNumber: 'v0.4-draft',
        createdAt: '20.09.2026 12:35',
        createdBy: 'агент Billing',
        summary: 'Внедрение шины NATS 2.10 JetStream (Raft) со сверхнизкой задержкой и аудитом PII',
        status: 'draft',
        content: `# ADR-042: Механизм возврата платежей

**Статус:** 🔄 черновик (генерируется)  
**Автор:** агент Billing  
**Связано:** 🧩 Billing, ⚙️ Saga, 🌿 feature/refund-endpoint  
**Утверждающие:** Иван Петров (Tech Lead), SecOps  

---

## Контекст
Сервису Billing необходим надёжный автоматизированный механизм возврата платежей.  
Существующий процесс — ручной, требует подтверждения бухгалтерии в 1С и занимает до 3 рабочих дней. При сбоях на стороне эквайера возникали расхождения между балансом заказа и статусом транзакции.

## Требования
1. Атомарность возврата с гарантированной отменой при сбоях банковского шлюза.
2. Асинхронное уведомление клиента по SMS/Email через сервис Notify.
3. Время реакции API на инициацию возврата < 250 мс.
4. Полный журнал аудита для службы безопасности (маскирование PAN и CVC).

## Решение
Используем паттерн **Saga с оркестрацией** на базе NATS JetStream и сервиса Billing:

\`\`\`
[Клиент/Менеджер] 
       │ POST /refund
       ▼
[API Gateway] ──(gRPC)──▶ [Billing Service]
                                │
               ┌────────────────┴────────────────┐
               │ 1. Блокировка суммы в БД         │
               │ 2. Запрос в Bank Provider       │
               │ 3. Публикация orders.v1.refund  │
               └────────────────┬────────────────┘
                                │
                   [NATS 2.10 JetStream (Raft)]
                                │
                     [Notification Service]
\`\`\`

В случае сбоя эквайера запускается компенсирующая транзакция: снятие блокировки в PostgreSQL и перевод статуса заказа в \`REFUND_FAILED\` с алертом дежурному инженеру.

## Альтернативы
- **Двухфазный коммит (2PC):** Отклонён из-за блокировок ресурсов и низкой отказоустойчивости в облачной среде.
- **Хореография Saga:** Отклонена из-за сложности отслеживания статуса и аудита инцидентов.
`,
      },
    ],
    content: `# ADR-042: Механизм возврата платежей

**Статус:** 🔄 черновик (генерируется)  
**Автор:** агент Billing  
**Связано:** 🧩 Billing, ⚙️ Saga, 🌿 feature/refund-endpoint  
**Утверждающие:** Иван Петров (Tech Lead), SecOps  

---

## Контекст
Сервису Billing необходим надёжный автоматизированный механизм возврата платежей.  
Существующий процесс — ручной, требует подтверждения бухгалтерии в 1С и занимает до 3 рабочих дней. При сбоях на стороне эквайера возникали расхождения между балансом заказа и статусом транзакции.

## Требования
1. Атомарность возврата с гарантированной отменой при сбоях банковского шлюза.
2. Асинхронное уведомление клиента по SMS/Email через сервис Notify.
3. Время реакции API на инициацию возврата < 250 мс.
4. Полный журнал аудита для службы безопасности (маскирование PAN и CVC).

## Решение
Используем паттерн **Saga с оркестрацией** на базе NATS JetStream и сервиса Billing:

\`\`\`
[Клиент/Менеджер] 
       │ POST /refund
       ▼
[API Gateway] ──(gRPC)──▶ [Billing Service]
                                │
               ┌────────────────┴────────────────┐
               │ 1. Блокировка суммы в БД         │
               │ 2. Запрос в Bank Provider       │
               │ 3. Публикация orders.v1.refund  │
               └────────────────┬────────────────┘
                                │
                   [NATS 2.10 JetStream (Raft)]
                                │
                     [Notification Service]
\`\`\`

В случае сбоя эквайера запускается компенсирующая транзакция: снятие блокировки в PostgreSQL и перевод статуса заказа в \`REFUND_FAILED\` с алертом дежурному инженеру.

## Альтернативы
- **Двухфазный коммит (2PC):** Отклонён из-за блокировок ресурсов и низкой отказоустойчивости в облачной среде.
- **Хореография Saga:** Отклонена из-за сложности отслеживания статуса и аудита инцидентов.
`,
  },
  {
    id: 'adr-041',
    title: 'ADR-041: Аутентификация и SSO на базе Keycloak',
    type: 'adr',
    status: 'approved',
    author: 'SecOps-агент',
    relatedNodes: ['auth-node', 'gateway-node'],
    tags: ['Безопасность', 'OAuth2', 'Keycloak'],
    lastModified: 'Вчера, 11:20',
    version: '1.0-final',
    versions: [
      {
        id: 'ver-adr041-1',
        versionNumber: 'v0.9-draft',
        createdAt: '16.09.2026 15:00',
        createdBy: 'SecOps-агент',
        summary: 'Черновик: использование локального сервиса авторизации с базовыми JWT-токенами',
        status: 'review',
        content: `# ADR-041: Аутентификация и SSO на базе Keycloak

**Статус:** 🔄 на ревью  
**Автор:** SecOps-агент  

## Контекст
Необходима централизация аутентификации пользователей портала.

## Решение (Черновик)
Использовать локальный Auth-сервис на Node.js с генерацией симметричных JWT.
Без взаимного mTLS между внутренними сервисами.
`,
      },
      {
        id: 'ver-adr041-2',
        versionNumber: 'v1.0-final',
        createdAt: '19.09.2026 11:20',
        createdBy: 'SecOps-агент',
        summary: 'Финальное решение: интеграция с кластером Keycloak, PKCE и взаимный mTLS',
        status: 'approved',
        content: `# ADR-041: Аутентификация и SSO на базе Keycloak

**Статус:** ✅ утверждён  
**Автор:** SecOps-агент  
**Утвердил:** Иван Петров  

## Решение
Все микросервисы портала делегируют аутентификацию шлюзу API Gateway с валидацией JWT-токенов, выпущенных корпоративным кластером Keycloak.
Используется PKCE-поток для SPA-клиента и взаимный mTLS между внутренними сервисами.
`,
      },
    ],
    content: `# ADR-041: Аутентификация и SSO на базе Keycloak

**Статус:** ✅ утверждён  
**Автор:** SecOps-агент  
**Утвердил:** Иван Петров  

## Решение
Все микросервисы портала делегируют аутентификацию шлюзу API Gateway с валидацией JWT-токенов, выпущенных корпоративным кластером Keycloak.
Используется PKCE-поток для SPA-клиента и взаимный mTLS между внутренними сервисами.
`,
  },
  {
    id: 'api-refund',
    title: 'POST /refund — Оформление возврата средств',
    type: 'api',
    status: 'draft',
    author: 'API-агент',
    relatedNodes: ['refund-endpoint', 'billing-node'],
    tags: ['OpenAPI', 'REST', 'Billing'],
    lastModified: '5 минут назад',
    version: 'v2.4-preview',
    content: `# OpenAPI 3.0: POST /api/v1/billing/refund

**Статус:** 🔄 черновик (генерируется)  
**Контракт:** \`openapi.yaml\`  

### Запрос
\`\`\`http
POST /api/v1/billing/refund HTTP/1.1
Host: api.mirovizor.internal
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...

{
  "order_id": "ORD-98421",
  "amount": 14200.00,
  "currency": "RUB",
  "reason": "Возврат товара надлежащего качества",
  "initiator_id": "usr-ivan-petrov"
}
\`\`\`

### Ответ (202 Accepted)
\`\`\`json
{
  "saga_id": "saga-ref-77492",
  "status": "PROCESSING",
  "order_id": "ORD-98421",
  "estimated_completion_seconds": 12,
  "created_at": "2026-09-19T09:32:00Z"
}
\`\`\`
`,
  },
  {
    id: 'api-payments',
    title: 'GET /payments — Реестр платежей',
    type: 'api',
    status: 'approved',
    author: 'API-агент',
    relatedNodes: ['billing-node'],
    tags: ['OpenAPI', 'REST'],
    lastModified: '1 день назад',
    content: `# GET /api/v1/billing/payments

Возвращает список проведённых транзакций с пагинацией и фильтрами по статусу (\`SUCCESS\`, \`REFUNDED\`, \`PENDING\`).
`,
  },
  {
    id: 'adr-043',
    title: 'ADR-043: Внедрение NATS JetStream как основы Event Mesh',
    type: 'adr',
    status: 'approved',
    author: 'Архитектурный комитет & Инфра-агент',
    relatedNodes: ['infra-nats', 'billing-node', 'saga-pattern'],
    tags: ['Архитектура', 'NATS', 'JetStream', 'Event Mesh', 'Низкая задержка'],
    lastModified: 'только что',
    version: '1.0-approved',
    content: `# ADR-043: Внедрение NATS JetStream как основы Event Mesh и очереди сверхнизкой задержки

**Статус:** ✅ Утверждено (Approved)  
**Автор:** Архитектурный комитет, Инфра-агент  
**Связано:** ⚡ NATS JetStream, 🧩 Billing, ⚙️ Saga, 🏗️ Инфраструктура  
**Утверждающие:** Иван Петров (Tech Lead), SecOps Lead, SRE Lead  

---

## 1. Контекст и целевая архитектура
Для асинхронного взаимодействия микросервисов корпоративного портала Мировизор развёрнута современная высокопроизводительная шина событий и распределённый Event Mesh.
При росте числа микросервисов и внедрении распределённых транзакций (Saga Orchestration) ключевыми требованиями стали:
1. **Задержка P99:** Требуется сверхнизкая задержка передачи сообщений и коммита (SLA < 5 мс, цель < 2 мс).
2. **Низкие накладные расходы ресурсов:** Минимальное потребление памяти и быстрый cold-start подов в Kubernetes.
3. **Встроенный Request-Reply:** Нативная поддержка легковесного RPC без поднятия отдельных временных очередей ответов.
4. **Хранилище состояний:** Возможность ведения распределённого Key-Value хранилища состояний саг и фиче-флагов без добавления сторонней СУБД.

---

## 2. Сравнительный анализ архитектурных преимуществ NATS JetStream

| Критерий | Legacy брокеры сообщений | NATS 2.10 + JetStream | Архитектурный выигрыш NATS |
| :--- | :--- | :--- | :--- |
| **Задержка P50 / P99** | 2.5 мс / 12 мс | **0.8 мс / 1.6 мс** | **В 7 раз быстрее (SLA соблюдается)** |
| **Потребление RAM** | ~4096 MB на брокер | **~42 MB на брокер** | **В 90 раз компактнее** |
| **Request-Reply RPC** | Эмуляция через очереди | **Нативная поддержка (\_INBOX)** | Встроено из коробки |
| **Key-Value Store** | Внешняя база данных | **Встроенный JetStream KV** | Без дополнительной инфраструктуры |
| **Иерархия Subject** | Плоские топики | **Токены (\`orders.v1.*\` / \`billing.>\`)** | Гибкая маршрутизация доменных событий |
| **Raft консенсус** | Сложный внешний кворум | **Встроенный легковесный Raft** | 3-узловой отказоустойчивый кворум |

---

## 3. Решение
Принято решение развернуть **NATS 2.10 в режиме 3-узлового JetStream кластера**:
- **Event Mesh:** Иерархическая маршрутизация доменных событий (\`portal.events.>\`, \`orders.>\`, \`billing.>\`).
- **JetStream Streams:** Персистентные потоки с репликацией R=3 для событий заказов, шагов саги и журнала аудита.
- **NATS Key-Value:** Использование встроенного хранилища \`saga-state\` и \`system-config\` вместо отдельного Redis.
- **Request-Reply:** Высокоскоростной межсервисный RPC для валидации токенов и лимитов возвратов.

---

## 4. Таксономия субъектов (Subject Hierarchy)
- \`orders.v1.<event>\`: Жизненный цикл заказа (\`orders.v1.created\`, \`orders.v1.cancelled\`).
- \`billing.saga.<sagaId>.<action>\`: Команды и компенсации саги возврата.
- \`audit.<service>.<event>\`: Журнал событий безопасности и PII.
- \`$KV.<bucket>.<key>\`: Реактивные обновления ключ-значение.
`,
  },
  {
    id: 'changelog-240',
    title: 'CHANGELOG v2.4.0 🔄',
    type: 'changelog',
    status: 'draft',
    author: 'Docs-агент',
    relatedNodes: ['billing-node', 'refund-endpoint', 'ui-billing-menu'],
    tags: ['Релиз', 'v2.4'],
    lastModified: '10 минут назад',
    content: `# CHANGELOG v2.4.0 (В разработке)

- 🆕 **Billing:** Запущен сервис возврата платежей через паттерн Saga.
- 🆕 **UI:** Добавлен раздел «Billing» в боковое меню и кнопка быстрого возврата в заказах.
- ⚡ **Инфра:** Масштабирование кластера до 5 подов под пиковые нагрузки.
- 🔐 **Безопасность:** Интеграция с сервисом маскирования PII-данных карт.
`,
  },
];

export const MOCK_SCREENS: PortalScreen[] = [
  {
    id: 'screen-orders',
    title: 'Заказы',
    section: '🏢 Продажи',
    diffSummary: {
      added: ['Кнопка «Оформить возврат» в строке заказа', 'Колонка «Статус возврата»'],
      removed: ['Старый пункт «Ручной запрос в финотдел»'],
      modified: ['Индикатор статуса оплаты теперь поддерживает бейдж «Возврат в обработке»'],
    },
  },
  {
    id: 'screen-funnel',
    title: 'Воронка',
    section: '🏢 Продажи',
  },
  {
    id: 'screen-clients',
    title: 'Клиенты',
    section: '🏢 Продажи',
  },
  {
    id: 'screen-suppliers',
    title: 'Поставщики',
    section: '🏢 Закупки',
  },
  {
    id: 'screen-contracts',
    title: 'Договоры',
    section: '🏢 Закупки',
  },
  {
    id: 'screen-inventory',
    title: 'Остатки',
    section: '🏢 Склад',
  },
  {
    id: 'screen-billing',
    title: 'Billing (Возвраты) 🆕',
    section: '🏢 Billing 🆕',
    isNew: true,
    diffSummary: {
      added: [
        'Новый раздел бокового меню «Billing 🆕»',
        'Таблица активных транзакций возврата',
        'Интерактивный статус Saga-оркестратора в реальном времени',
      ],
      removed: [],
      modified: [],
    },
  },
  {
    id: 'screen-custom-builder',
    title: '🛠️ Конструктор экранов',
    section: '🏢 Пользовательские справочники',
    isNew: true,
    diffSummary: {
      added: [
        'Архитектура @nocobase/database и @nocobase/client/ui-schema',
        'Пользовательский конструктор произвольных таблиц и полей',
        'Интеграция с NATS JetStream шиной событий и KV Store',
      ],
      removed: [],
      modified: [],
    },
  },
  {
    id: 'screen-support-tickets',
    title: 'Тикеты и рекламации',
    section: '🏢 Пользовательские справочники',
    isNew: true,
  },
  {
    id: 'screen-security-audits',
    title: 'Аудит безопасности',
    section: '🏢 Пользовательские справочники',
    isNew: true,
  },
];

export const MOCK_DATAFLOW_NODES: DataFlowNode[] = [
  {
    id: 'user',
    name: 'Пользователь',
    type: 'user',
    status: 'active',
    layer: 'external',
    x: 80,
    y: 180,
    technology: 'Browser / Mobile Client',
    version: 'Client v2.4',
    metrics: {
      rps: 340,
      peakRps: 620,
      cpuPercent: 12,
      memoryMb: 120,
      memoryLimitMb: 512,
      p50LatencyMs: 14,
      p95LatencyMs: 32,
      p99LatencyMs: 58,
      errorRate: 0.01,
      replicas: { current: 1, max: 1 },
      activeConnections: 1420,
      networkInMb: 12.4,
      networkOutMb: 48.6,
      healthScore: 99,
      uptime: '99.99%',
    },
  },
  {
    id: 'web-ui',
    name: 'Web UI (SPA)',
    type: 'service',
    status: 'active',
    layer: 'services',
    x: 230,
    y: 180,
    technology: 'React 19 / Nginx Gateway',
    version: 'v3.12.0',
    metrics: {
      rps: 340,
      peakRps: 580,
      cpuPercent: 28,
      memoryMb: 340,
      memoryLimitMb: 1024,
      p50LatencyMs: 8,
      p95LatencyMs: 24,
      p99LatencyMs: 45,
      errorRate: 0.02,
      replicas: { current: 4, max: 8 },
      activeConnections: 1250,
      networkInMb: 18.2,
      networkOutMb: 52.1,
      healthScore: 98,
      uptime: '99.98%',
    },
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    type: 'service',
    status: 'active',
    layer: 'services',
    x: 410,
    y: 180,
    technology: 'Envoy / Go Proxy',
    version: 'v1.28.2',
    metrics: {
      rps: 650,
      peakRps: 1200,
      cpuPercent: 44,
      memoryMb: 512,
      memoryLimitMb: 2048,
      p50LatencyMs: 4,
      p95LatencyMs: 12,
      p99LatencyMs: 28,
      errorRate: 0.03,
      replicas: { current: 5, max: 10 },
      activeConnections: 3100,
      networkInMb: 42.5,
      networkOutMb: 85.0,
      healthScore: 97,
      uptime: '99.99%',
    },
  },
  {
    id: 'auth-svc',
    name: 'Auth (Keycloak)',
    type: 'service',
    status: 'active',
    layer: 'services',
    x: 410,
    y: 320,
    piiData: true,
    technology: 'Keycloak 24 / OAuth2 OIDC',
    version: 'v24.0.1',
    metrics: {
      rps: 310,
      peakRps: 550,
      cpuPercent: 36,
      memoryMb: 768,
      memoryLimitMb: 2048,
      p50LatencyMs: 3,
      p95LatencyMs: 9,
      p99LatencyMs: 18,
      errorRate: 0.01,
      replicas: { current: 3, max: 6 },
      activeConnections: 980,
      networkInMb: 14.1,
      networkOutMb: 22.8,
      healthScore: 99,
      uptime: '99.99%',
    },
  },
  {
    id: 'billing-svc',
    name: 'Billing Service',
    type: 'service',
    status: 'active',
    layer: 'services',
    x: 620,
    y: 120,
    isNew: true,
    technology: 'Kotlin / Spring Boot 3 (Saga Orchestrator)',
    version: 'v2.1.0-rc3',
    metrics: {
      rps: 142,
      peakRps: 380,
      cpuPercent: 64,
      memoryMb: 1180,
      memoryLimitMb: 2048,
      p50LatencyMs: 16,
      p95LatencyMs: 48,
      p99LatencyMs: 92,
      errorRate: 0.12,
      replicas: { current: 3, max: 6 },
      activeConnections: 450,
      networkInMb: 8.5,
      networkOutMb: 16.2,
      healthScore: 94,
      uptime: '99.95%',
    },
  },
  {
    id: 'orders-svc',
    name: 'Orders Service',
    type: 'service',
    status: 'active',
    layer: 'services',
    x: 620,
    y: 240,
    technology: 'Go 1.22 / gRPC Microservice',
    version: 'v1.18.4',
    metrics: {
      rps: 210,
      peakRps: 450,
      cpuPercent: 32,
      memoryMb: 420,
      memoryLimitMb: 1024,
      p50LatencyMs: 6,
      p95LatencyMs: 18,
      p99LatencyMs: 35,
      errorRate: 0.02,
      replicas: { current: 4, max: 8 },
      activeConnections: 620,
      networkInMb: 12.0,
      networkOutMb: 24.5,
      healthScore: 98,
      uptime: '99.98%',
    },
  },
  {
    id: 'nats-cluster',
    name: 'NATS JetStream Cluster',
    type: 'queue',
    status: 'active',
    layer: 'queues',
    x: 830,
    y: 240,
    isNew: true,
    technology: 'NATS 2.10 / JetStream 3-Node Raft',
    version: 'v2.10.12',
    metrics: {
      rps: 12450,
      peakRps: 28000,
      cpuPercent: 18,
      memoryMb: 122,
      memoryLimitMb: 1024,
      p50LatencyMs: 0.8,
      p95LatencyMs: 1.6,
      p99LatencyMs: 2.8,
      errorRate: 0.0,
      replicas: { current: 3, max: 3 },
      queueLag: 0,
      activeConnections: 840,
      networkInMb: 121.8,
      networkOutMb: 365.4,
      healthScore: 100,
      uptime: '99.999%',
    },
  },
  {
    id: 'notify-svc',
    name: 'Notify Service',
    type: 'service',
    status: 'active',
    layer: 'services',
    x: 1010,
    y: 120,
    technology: 'Node.js / BullMQ / Push Gateway',
    version: 'v1.9.0',
    metrics: {
      rps: 95,
      peakRps: 280,
      cpuPercent: 22,
      memoryMb: 310,
      memoryLimitMb: 1024,
      p50LatencyMs: 12,
      p95LatencyMs: 38,
      p99LatencyMs: 74,
      errorRate: 0.04,
      replicas: { current: 2, max: 4 },
      activeConnections: 210,
      networkInMb: 4.8,
      networkOutMb: 11.2,
      healthScore: 96,
      uptime: '99.96%',
    },
  },
  {
    id: 'billing-db',
    name: 'PostgreSQL Billing',
    type: 'db',
    status: 'active',
    layer: 'db',
    x: 620,
    y: 10,
    piiData: true,
    technology: 'PostgreSQL 16 High-Availability',
    version: 'v16.2',
    metrics: {
      rps: 285,
      peakRps: 720,
      cpuPercent: 48,
      memoryMb: 3620,
      memoryLimitMb: 8192,
      p50LatencyMs: 1.8,
      p95LatencyMs: 4.2,
      p99LatencyMs: 14.5,
      errorRate: 0.0,
      replicas: { current: 2, max: 3 },
      activeConnections: 78,
      networkInMb: 24.2,
      networkOutMb: 41.5,
      healthScore: 98,
      uptime: '99.99%',
    },
  },
  {
    id: 'bank-gateway',
    name: 'Банковский эквайер',
    type: 'external',
    status: 'warning',
    layer: 'external',
    x: 620,
    y: -90,
    piiData: true,
    technology: 'External Acquirer REST API / ISO 8583',
    version: 'API v2',
    metrics: {
      rps: 18,
      peakRps: 45,
      cpuPercent: 82,
      memoryMb: 640,
      memoryLimitMb: 1024,
      p50LatencyMs: 240,
      p95LatencyMs: 380,
      p99LatencyMs: 780,
      errorRate: 3.8,
      replicas: { current: 1, max: 1 },
      activeConnections: 24,
      networkInMb: 1.2,
      networkOutMb: 2.1,
      healthScore: 68,
      uptime: '99.4%',
    },
  },
];

export const MOCK_DATAFLOW_STREAMS: DataFlowStream[] = [
  {
    id: 'stream-user-ui',
    source: 'user',
    target: 'web-ui',
    protocol: 'HTTP',
    state: 'active',
    throughput: '340 req/s',
    latency: '14 ms',
    owner: 'Frontend Команда',
    schemaSample: 'HTTPS / TLS 1.3 · Bearer Token',
  },
  {
    id: 'stream-ui-gw',
    source: 'web-ui',
    target: 'api-gateway',
    protocol: 'HTTP',
    state: 'active',
    throughput: '340 req/s',
    latency: '18 ms',
    owner: 'API Gateway Team',
    schemaSample: 'JSON REST Payload with Authorization header',
  },
  {
    id: 'stream-gw-auth',
    source: 'api-gateway',
    target: 'auth-svc',
    protocol: 'gRPC',
    state: 'active',
    throughput: '310 req/s',
    latency: '3 ms',
    owner: 'SecOps Team',
    piiSensitive: true,
    schemaSample: 'ValidateTokenRequest { token: string, scope: ["billing.refund"] }',
  },
  {
    id: 'stream-gw-billing',
    source: 'api-gateway',
    target: 'billing-svc',
    protocol: 'gRPC',
    state: 'modified',
    isNew: true,
    throughput: '42 req/s',
    latency: '22 ms',
    owner: 'Billing Агент & Команда',
    schemaSample: 'POST /refund { order_id, amount, reason }',
  },
  {
    id: 'stream-billing-db',
    source: 'billing-svc',
    target: 'billing-db',
    protocol: 'SQL',
    state: 'active',
    throughput: '85 qps',
    latency: '2.4 ms',
    owner: 'DBA / Data Team',
    piiSensitive: true,
    schemaSample: 'UPDATE orders SET refund_status = \'LOCKED\' WHERE id = $1',
  },
  {
    id: 'stream-billing-bank',
    source: 'billing-svc',
    target: 'bank-gateway',
    protocol: 'HTTP',
    state: 'problem',
    throughput: '12 req/s',
    latency: '380 ms',
    owner: 'Интеграции Финтех',
    issueDescription: 'Периодический таймаут шлюза эквайера (380мс > 250мс SLA). Срабатывает Saga-компенсация.',
    piiSensitive: true,
    schemaSample: 'POST /v2/acquirer/refund { pan_masked: "4276********1102", amount: 14200 }',
  },
  {
    id: 'stream-billing-jetstream',
    source: 'billing-svc',
    target: 'nats-cluster',
    protocol: 'JetStream',
    state: 'active',
    isNew: true,
    throughput: '420 msg/s',
    latency: '0.8 ms',
    owner: 'Billing Saga Orchestrator',
    schemaSample: 'Subject: orders.v1.refund { saga_id: "77492", order_id: "ORD-98421", amount: 14200 }',
  },
  {
    id: 'stream-jetstream-notify',
    source: 'nats-cluster',
    target: 'notify-svc',
    protocol: 'JetStream',
    state: 'active',
    isNew: true,
    throughput: '420 msg/s',
    latency: '1.1 ms',
    owner: 'Communications Team',
    schemaSample: 'Consumer: notify-dispatcher on orders.v1.refund -> SMS/Push gateway',
  },
  {
    id: 'stream-orders-nats',
    source: 'orders-svc',
    target: 'nats-cluster',
    protocol: 'NATS',
    state: 'active',
    isNew: true,
    throughput: '210 msg/s',
    latency: '0.9 ms',
    owner: 'Orders Team & Event Mesh',
    schemaSample: 'Subject: orders.v1.created { order_id, client_id, amount: 32000 }',
  },
  {
    id: 'stream-nats-billing',
    source: 'nats-cluster',
    target: 'billing-svc',
    protocol: 'JetStream',
    state: 'active',
    isNew: true,
    throughput: '142 msg/s',
    latency: '1.1 ms',
    owner: 'Billing Saga Orchestrator',
    schemaSample: 'Subject: billing.saga.refund.execute { saga_id: "77492", amount: 14200 }',
  },
  {
    id: 'stream-billing-nats-audit',
    source: 'billing-svc',
    target: 'nats-cluster',
    protocol: 'NATS',
    state: 'active',
    isNew: true,
    throughput: '85 msg/s',
    latency: '0.7 ms',
    owner: 'SecOps Audit Stream',
    piiSensitive: true,
    schemaSample: 'Subject: audit.billing.refunds { action: "INIT_REFUND", pan_masked: "4276***1102" }',
  },
];

export const MOCK_HISTORY: HistoryEvent[] = [
  {
    id: 'hist-1',
    time: '14:32',
    type: 'commit',
    title: '📦 Коммит feature/refund-endpoint',
    author: 'Иван Петров',
    agents: ['Billing', 'API', 'Docs'],
    prNumber: '#4822',
    servicesAffected: ['Billing', 'API Gateway', 'NATS JetStream'],
    docsAffected: ['ADR-042', 'POST /refund'],
    details: 'Сгенерирована структура оркестратора саги, тесты компенсации и OpenAPI спецификация.',
    canRollback: true,
    status: 'merged',
    relatedNodeId: 'billing-node',
  },
  {
    id: 'hist-2',
    time: '13:10',
    type: 'deploy',
    title: '🔄 Изменение Prod: replicas 3 → 5',
    author: 'Иван Петров',
    agents: ['Инфра → Prod'],
    details: 'Увеличение пула реплик billing-service в связи с нагрузочным тестированием саги.',
    canRollback: true,
    status: 'resolved',
    relatedNodeId: 'infra-k8s',
  },
  {
    id: 'hist-3',
    time: '12:45',
    type: 'incident',
    title: '⚠️ Инцидент INC-1247: Migrate-db timeout',
    author: 'Автоматический мониторинг',
    agents: ['DBA-агент', 'Инфра'],
    details: 'Таймаут миграции схемы PostgreSQL из-за долгой блокировки таблицы транзакций. Закрыт за 27 мин.',
    canRollback: false,
    status: 'resolved',
    relatedNodeId: 'billing-node',
  },
  {
    id: 'hist-4',
    time: '11:20',
    type: 'decision',
    title: '📄 ADR-042 утверждён',
    author: 'Иван Петров',
    agents: ['Архитектор'],
    details: 'Архитектурное решение об использовании оркестрации Saga вместо 2PC утверждено.',
    canRollback: false,
    status: 'approved',
    relatedNodeId: 'saga-pattern',
  },
  {
    id: 'hist-5',
    time: '10:05',
    type: 'node_added',
    title: '🆕 Добавлен узел Billing в дерево',
    author: 'Иван Петров',
    agents: ['Orchestrator'],
    details: 'Новый микросервис Billing зарегистрирован в конфигурации портала и назначен агент разработки.',
    canRollback: true,
    status: 'approved',
    relatedNodeId: 'billing-node',
  },
  {
    id: 'hist-6',
    time: '09:00',
    type: 'start',
    title: '▶️ Старт плана «refund»',
    author: 'Иван Петров',
    agents: ['All-Agents-Squad'],
    details: 'Инициализирован рабочий поток реализации возврата платежей в спринте 42.',
    canRollback: false,
    status: 'active',
    relatedNodeId: 'root',
  },
];

export const MOCK_AGENT_CHAT: AgentChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'agent',
    agentName: 'Billing-агент',
    avatar: '🤖',
    text: 'Приветствую! Анализирую требования к возврату платежей. Есть два пути реализации: паттерн Saga с оркестрацией или двухфазный коммит (2PC). Что выберем?',
    timestamp: '14:20',
    suggestedActions: ['Выбери Saga', 'Используй 2PC', 'Сравни задержки'],
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: 'Выбери Saga, так как в распределённой среде 2PC блокирует ресурсы.',
    timestamp: '14:22',
  },
  {
    id: 'msg-3',
    sender: 'agent',
    agentName: 'Billing-агент',
    avatar: '🤖',
    text: 'Принято! Генерирую файл saga.py с компенсирующими транзакциями, subject orders.v1.refund в NATS JetStream и черновик ADR-043. Текущий прогресс по ветке: 100%.',
    timestamp: '14:25',
    suggestedActions: ['Показать diff кода', 'Запустить юнит-тесты', 'Обновить ADR-042'],
  },
];

export const INITIAL_MINDMAP_NODES = INITIAL_NODES;
export const INITIAL_MINDMAP_LINKS = INITIAL_LINKS;
export const INITIAL_CHAT_MESSAGES = MOCK_AGENT_CHAT;
