# Спецификация API шлюза DSH (DeepSeek-Harness) и Backend

Все эндпоинты работают на порту `3000`.

---

## 1. Проверка состояния системы (Health Check)

- **Метод**: `GET`
- **Путь**: `/api/health`
- **Описание**: Возвращает базовый статус сервиса и готовность Gemini API.
- **Пример ответа**:
```json
{
  "status": "ok",
  "geminiKeyConfigured": true,
  "dshGateway": "active",
  "model": "gemini-3.8-flash"
}
```

---

## 2. Статус шлюза DSH (Gateway Status)

- **Метод**: `GET`
- **Путь**: `/api/dsh/status`
- **Описание**: Детальные метаданные возможностей автономного шлюза, аудио-кодеков и поддерживаемых операций.
- **Пример ответа**:
```json
{
  "gateway": "deepseek-harness",
  "version": "1.8.4",
  "connectedLlm": "gemini-3.8-flash",
  "status": "operational",
  "liveApi": {
    "status": "ready",
    "model": "gemini-3.8-live",
    "audioInput": "16kHz PCM",
    "audioOutput": "24kHz PCM"
  },
  "capabilities": [
    "ast_patching",
    "test_runner",
    "portal_sync",
    "event_stream",
    "bidirectional_live"
  ]
}
```

---

## 3. Потоковый вызов архитектурного ассистента (DSH Stream)

- **Метод**: `POST`
- **Путь**: `/api/dsh/stream`
- **Content-Type**: `application/json`
- **Формат ответа**: Server-Sent Events (`text/event-stream`)
- **Тело запроса**:
```json
{
  "prompt": "Добавь кнопку выгрузки отчёта в модуль биллинга",
  "rawAudio": "<base64_pcm_data_optional>",
  "audioMimeType": "audio/pcm;rate=16000",
  "context": {
    "nodeId": "billing-refund-saga",
    "label": "Сага возврата средств"
  },
  "portalState": {
    "activeTab": "portal"
  }
}
```

---

## 4. WebSocket Live API (двунаправленный аудиостриминг)

- **Протокол**: `WebSocket`
- **Путь**: `ws://localhost:3000/api/live/ws`
- **Формат аудио**: Вход: 16,000 Гц, 16-бит моно PCM (Base64). Выход: 24,000 Гц PCM аудио.
- **События**:
  - `audio`: передача бинарных квантов голоса пользователя.
  - `text`: текстовое сообщение или системная команда.
  - `response.audio`: ответная озвучка ассистента.
  - `response.text`: транскрипция и архитектурный вывод.
