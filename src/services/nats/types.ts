export type NatsProtocol = 'NATS' | 'JetStream' | 'KV';

export interface NatsMessage<T = any> {
  id: string;
  subject: string;
  data: T;
  reply?: string;
  timestamp: string;
  seq?: number;
  stream?: string;
  headers?: Record<string, string>;
}

export interface NatsSubscription {
  sid: string;
  subject: string;
  queueGroup?: string;
  callback: (msg: NatsMessage) => void;
  active: boolean;
  receivedCount: number;
}

export interface JetStreamStreamConfig {
  name: string;
  description?: string;
  subjects: string[];
  retention: 'limits' | 'interest' | 'workqueue';
  maxMsgs: number;
  maxBytes: number;
  storage: 'file' | 'memory';
  replicas: number;
  maxAgeMs?: number;
}

export interface JetStreamStreamState {
  name: string;
  messages: number;
  bytes: number;
  firstSeq: number;
  lastSeq: number;
  consumerCount: number;
  created: string;
}

export interface JetStreamConsumerConfig {
  name: string;
  stream: string;
  durableName?: string;
  deliverSubject?: string;
  ackPolicy: 'explicit' | 'none' | 'all';
  maxDeliver: number;
  filterSubject?: string;
}

export interface NatsKvEntry<T = any> {
  bucket: string;
  key: string;
  value: T;
  revision: number;
  created: string;
  operation: 'PUT' | 'DEL';
}

export interface NatsClusterNode {
  id: string;
  name: string;
  host: string;
  port: number;
  isLeader: boolean;
  rttMs: number;
  version: string;
  activeConnections: number;
  inMsgs: number;
  outMsgs: number;
  bytesIn: string;
  bytesOut: string;
  cpuPercent: number;
  memoryMb: number;
}

export interface NatsServerStats {
  connected: boolean;
  clusterName: string;
  leaderId: string;
  nodes: NatsClusterNode[];
  totalMessages: number;
  totalBytes: string;
  msgRateSec: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
  activeSubscriptions: number;
  streamCount: number;
  kvBucketCount: number;
}
