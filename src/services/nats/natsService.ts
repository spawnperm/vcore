import {
  NatsMessage,
  NatsSubscription,
  JetStreamStreamConfig,
  JetStreamStreamState,
  JetStreamConsumerConfig,
  NatsKvEntry,
  NatsClusterNode,
  NatsServerStats,
} from './types';

/**
 * Match a concrete subject against a NATS subject filter with wildcards.
 * - '*' matches any single token between dots.
 * - '>' matches one or more trailing tokens.
 * Example: 'orders.*.created' matches 'orders.v1.created'
 * Example: 'billing.>' matches 'billing.saga.refund.step1'
 */
export function matchSubject(filter: string, subject: string): boolean {
  if (filter === '>' || filter === subject) return true;

  const fTokens = filter.split('.');
  const sTokens = subject.split('.');

  for (let i = 0; i < fTokens.length; i++) {
    const fToken = fTokens[i];

    if (fToken === '>') {
      return i <= sTokens.length - 1;
    }

    if (i >= sTokens.length) {
      return false;
    }

    const sToken = sTokens[i];
    if (fToken !== '*' && fToken !== sToken) {
      return false;
    }
  }

  return fTokens.length === sTokens.length;
}

export class NatsService {
  private subscriptions: Map<string, NatsSubscription> = new Map();
  private subCounter = 0;
  private messageLog: NatsMessage[] = [];
  private maxLogSize = 200;

  // JetStream Streams
  private streams: Map<string, { config: JetStreamStreamConfig; state: JetStreamStreamState; messages: NatsMessage[] }> =
    new Map();

  // JetStream Consumers
  private consumers: Map<string, JetStreamConsumerConfig[]> = new Map();

  // KV Buckets: bucketName -> (key -> NatsKvEntry[])
  private kvBuckets: Map<string, Map<string, NatsKvEntry[]>> = new Map();

  // Simulated Cluster Nodes
  private clusterNodes: NatsClusterNode[] = [
    {
      id: 'nats-node-01',
      name: 'nats-core-1',
      host: '10.244.1.14',
      port: 4222,
      isLeader: true,
      rttMs: 0.6,
      version: 'v2.10.12',
      activeConnections: 340,
      inMsgs: 1245000,
      outMsgs: 3735000,
      bytesIn: '48.2 MB',
      bytesOut: '144.6 MB',
      cpuPercent: 18,
      memoryMb: 42,
    },
    {
      id: 'nats-node-02',
      name: 'nats-core-2',
      host: '10.244.2.28',
      port: 4222,
      isLeader: false,
      rttMs: 0.8,
      version: 'v2.10.12',
      activeConnections: 260,
      inMsgs: 980000,
      outMsgs: 2940000,
      bytesIn: '38.0 MB',
      bytesOut: '114.0 MB',
      cpuPercent: 14,
      memoryMb: 39,
    },
    {
      id: 'nats-node-03',
      name: 'nats-core-3',
      host: '10.244.3.45',
      port: 4222,
      isLeader: false,
      rttMs: 0.7,
      version: 'v2.10.12',
      activeConnections: 240,
      inMsgs: 920000,
      outMsgs: 2760000,
      bytesIn: '35.6 MB',
      bytesOut: '106.8 MB',
      cpuPercent: 15,
      memoryMb: 41,
    },
  ];

  constructor() {
    this.initDefaultStreams();
    this.initDefaultKvStore();
    this.seedInitialMessages();
  }

  // --- CORE PUB / SUB ---

  public subscribe(
    subject: string,
    callback: (msg: NatsMessage) => void,
    queueGroup?: string
  ): NatsSubscription {
    this.subCounter += 1;
    const sid = `sub-${this.subCounter}`;
    const sub: NatsSubscription = {
      sid,
      subject,
      queueGroup,
      callback,
      active: true,
      receivedCount: 0,
    };
    this.subscriptions.set(sid, sub);
    return sub;
  }

  public unsubscribe(sid: string): boolean {
    return this.subscriptions.delete(sid);
  }

  public publish<T = any>(
    subject: string,
    data: T,
    reply?: string,
    headers?: Record<string, string>
  ): NatsMessage<T> {
    const msg: NatsMessage<T> = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      subject,
      data,
      reply,
      headers,
      timestamp: new Date().toISOString(),
    };

    // Store in live buffer
    this.messageLog.unshift(msg);
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog.pop();
    }

    // Match subscribers
    this.subscriptions.forEach((sub) => {
      if (sub.active && matchSubject(sub.subject, subject)) {
        sub.receivedCount += 1;
        try {
          sub.callback(msg);
        } catch (err) {
          console.error(`Error in NATS subscriber callback for [${subject}]:`, err);
        }
      }
    });

    // Check if subject maps to any JetStream stream
    this.streams.forEach((streamData, streamName) => {
      const matchesStream = streamData.config.subjects.some((pattern) =>
        matchSubject(pattern, subject)
      );
      if (matchesStream) {
        streamData.state.messages += 1;
        streamData.state.lastSeq += 1;
        msg.seq = streamData.state.lastSeq;
        msg.stream = streamName;
        streamData.messages.unshift(msg);
        if (streamData.messages.length > streamData.config.maxMsgs) {
          streamData.messages.pop();
        }
      }
    });

    return msg;
  }

  /**
   * Request-Reply pattern: sends a request and awaits a reply on an inbox subject.
   */
  public async request<T = any, R = any>(
    subject: string,
    data: T,
    timeoutMs = 2000
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const inbox = `_INBOX.${Math.random().toString(36).substring(2, 9)}`;
      let timer: any;

      const sub = this.subscribe(inbox, (replyMsg) => {
        clearTimeout(timer);
        this.unsubscribe(sub.sid);
        resolve(replyMsg.data as R);
      });

      timer = setTimeout(() => {
        this.unsubscribe(sub.sid);
        reject(new Error(`NATS Request to [${subject}] timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Check for built-in RPC mocks for demo purposes
      this.handleBuiltInRpc(subject, data, inbox);

      this.publish(subject, data, inbox);
    });
  }

  // --- JETSTREAM API ---

  public getStreams(): JetStreamStreamState[] {
    return Array.from(this.streams.values()).map((s) => s.state);
  }

  public getStream(name: string): { config: JetStreamStreamConfig; state: JetStreamStreamState; messages: NatsMessage[] } | undefined {
    return this.streams.get(name);
  }

  public addStream(config: JetStreamStreamConfig): JetStreamStreamState {
    const state: JetStreamStreamState = {
      name: config.name,
      messages: 0,
      bytes: 0,
      firstSeq: 1,
      lastSeq: 0,
      consumerCount: 0,
      created: new Date().toISOString(),
    };
    this.streams.set(config.name, {
      config,
      state,
      messages: [],
    });
    return state;
  }

  public getStreamMessages(name: string, limit = 50): NatsMessage[] {
    const s = this.streams.get(name);
    if (!s) return [];
    return s.messages.slice(0, limit);
  }

  // --- KEY-VALUE (KV) STORE ---

  public kvPut<T = any>(bucket: string, key: string, value: T): NatsKvEntry<T> {
    if (!this.kvBuckets.has(bucket)) {
      this.kvBuckets.set(bucket, new Map());
    }
    const bucketMap = this.kvBuckets.get(bucket)!;
    const history = bucketMap.get(key) || [];
    const revision = history.length + 1;

    const entry: NatsKvEntry<T> = {
      bucket,
      key,
      value,
      revision,
      created: new Date().toISOString(),
      operation: 'PUT',
    };

    history.unshift(entry);
    bucketMap.set(key, history);

    // Also publish event on $KV.<bucket>.<key>
    this.publish(`$KV.${bucket}.${key}`, entry);

    return entry;
  }

  public kvGet<T = any>(bucket: string, key: string): NatsKvEntry<T> | null {
    const bucketMap = this.kvBuckets.get(bucket);
    if (!bucketMap) return null;
    const history = bucketMap.get(key);
    return history && history.length > 0 ? history[0] : null;
  }

  public kvListKeys(bucket: string): string[] {
    const bucketMap = this.kvBuckets.get(bucket);
    if (!bucketMap) return [];
    return Array.from(bucketMap.keys());
  }

  public kvGetHistory(bucket: string, key: string): NatsKvEntry[] {
    const bucketMap = this.kvBuckets.get(bucket);
    if (!bucketMap) return [];
    return bucketMap.get(key) || [];
  }

  public getKvBuckets(): string[] {
    return Array.from(this.kvBuckets.keys());
  }

  // --- TELEMETRY & STATS ---

  public getStats(): NatsServerStats {
    let totalMsgs = 0;
    this.streams.forEach((s) => {
      totalMsgs += s.state.messages;
    });

    return {
      connected: true,
      clusterName: 'nats-corp-mesh',
      leaderId: 'nats-node-01',
      nodes: this.clusterNodes,
      totalMessages: totalMsgs + 3145000,
      totalBytes: '228.4 MB',
      msgRateSec: 12450,
      p50LatencyMs: 0.8,
      p99LatencyMs: 1.6,
      activeSubscriptions: this.subscriptions.size + 48,
      streamCount: this.streams.size,
      kvBucketCount: this.kvBuckets.size,
    };
  }

  public getMessageLog(limit = 100): NatsMessage[] {
    return this.messageLog.slice(0, limit);
  }

  public clearMessageLog(): void {
    this.messageLog = [];
  }

  // --- PRIVATE INITIALIZERS & HELPERS ---

  private initDefaultStreams(): void {
    // 1. ORDERS Stream
    this.addStream({
      name: 'ORDERS',
      description: 'Журнал событий заказов и транзакций клиентов',
      subjects: ['orders.>'],
      retention: 'limits',
      maxMsgs: 100000,
      maxBytes: 1024 * 1024 * 100, // 100 MB
      storage: 'file',
      replicas: 3,
    });

    // 2. BILLING_SAGAS Stream
    this.addStream({
      name: 'BILLING_SAGAS',
      description: 'Оркестрация распределённых саг возвратов и платежей',
      subjects: ['billing.saga.>', 'billing.refund.>'],
      retention: 'workqueue',
      maxMsgs: 50000,
      maxBytes: 1024 * 1024 * 50,
      storage: 'file',
      replicas: 3,
    });

    // 3. AUDIT_LOGS Stream
    this.addStream({
      name: 'AUDIT_LOGS',
      description: 'Спецификация безопасности и аудита для регуляторов',
      subjects: ['audit.>'],
      retention: 'limits',
      maxMsgs: 500000,
      maxBytes: 1024 * 1024 * 500,
      storage: 'file',
      replicas: 3,
    });

    // 4. PORTAL_EVENTS Stream
    this.addStream({
      name: 'PORTAL_EVENTS',
      description: 'Внутренняя шина событий доменной модели портала Мировизор',
      subjects: ['portal.>'],
      retention: 'limits',
      maxMsgs: 50000,
      maxBytes: 1024 * 1024 * 25,
      storage: 'memory',
      replicas: 1,
    });
  }

  private initDefaultKvStore(): void {
    // Bucket: saga-state
    this.kvPut('saga-state', 'saga-77492', {
      sagaId: 'saga-77492',
      orderId: 'ORD-98421',
      status: 'PROCESSING',
      step: 'CARD_PAYMENT_REFUND',
      amount: 14200,
      currency: 'RUB',
      retries: 1,
    });

    this.kvPut('saga-state', 'saga-77491', {
      sagaId: 'saga-77491',
      orderId: 'ORD-98419',
      status: 'COMPLETED',
      step: 'NOTIFY_USER',
      amount: 4500,
      currency: 'RUB',
      retries: 0,
    });

    // Bucket: system-config
    this.kvPut('system-config', 'acquirer.timeout.ms', 250);
    this.kvPut('system-config', 'feature.nats_mesh_enabled', true);
    this.kvPut('system-config', 'feature.pii_masking_level', 'STRICT');
    this.kvPut('system-config', 'saga.max_retries', 3);
  }

  private seedInitialMessages(): void {
    this.publish('orders.v1.created', {
      orderId: 'ORD-98425',
      clientId: 'cli-004',
      amount: 32000,
      items: 3,
    });

    this.publish('billing.saga.refund.validate', {
      sagaId: 'saga-77492',
      orderId: 'ORD-98421',
      amount: 14200,
      reason: 'Дефект товара при доставке',
    });

    this.publish('audit.billing.refunds', {
      action: 'INIT_REFUND',
      operator: 'Иван Петров',
      panMasked: '4276********1102',
      ip: '10.244.0.12',
    });
  }

  private handleBuiltInRpc(subject: string, data: any, replyInbox: string): void {
    if (subject === 'billing.refund.validate') {
      setTimeout(() => {
        this.publish(replyInbox, {
          approved: true,
          reason: 'OK',
          maxRefundAmount: 14200,
          validatedAt: new Date().toISOString(),
        });
      }, 35);
    } else if (subject === 'auth.token.verify') {
      setTimeout(() => {
        this.publish(replyInbox, {
          valid: true,
          scopes: ['billing.read', 'billing.write', 'admin.portal'],
        });
      }, 15);
    }
  }
}

export const nats = new NatsService();
export const natsService = nats;
export default nats;
