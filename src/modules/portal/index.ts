// Public API of the Portal Module (DDD Architecture)

// Domain Models & Value Objects
export * from './domain/common/types';
export * from './domain/orders/model';
export * from './domain/billing/model';
export * from './domain/sales/model';
export * from './domain/procurement/model';
export * from './domain/review/model';

// Infrastructure
export * from './infrastructure/eventBus';
export * from './infrastructure/repositories/orderRepository';
export * from './infrastructure/repositories/billingRepository';
export * from './infrastructure/repositories/salesRepository';
export * from './infrastructure/repositories/procurementRepository';
export * from './infrastructure/repositories/reviewRepository';

// Application Hooks
export * from './application/useOrdersContext';
export * from './application/useBillingSagaContext';
export * from './application/useSalesContext';
export * from './application/useProcurementContext';
export * from './application/useUxReviewContext';

// UI Components
export * from './ui/PortalContainer';
