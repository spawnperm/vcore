import React, { useState } from 'react';
import { PortalScreen } from '../../../types';
import { ViewMode, PortalTopBar } from './shell/PortalTopBar';
import { PortalTreeNav } from './shell/PortalTreeNav';
import { PortalDiffSummaryBar } from './shell/PortalDiffSummaryBar';
import { PortalBrowserFrame } from './shell/PortalBrowserFrame';
import { UxReviewOverlay } from './review/UxReviewOverlay';

// Bounded Context Module Views
import { OrdersModuleView } from './modules/orders/OrdersModuleView';
import { BillingModuleView } from './modules/billing/BillingModuleView';
import { RefundSagaModal } from './modules/billing/RefundSagaModal';
import { FunnelModuleView } from './modules/sales/FunnelModuleView';
import { ClientsModuleView } from './modules/sales/ClientsModuleView';
import { SuppliersModuleView } from './modules/procurement/SuppliersModuleView';
import { ContractsModuleView } from './modules/procurement/ContractsModuleView';
import { InventoryModuleView } from './modules/procurement/InventoryModuleView';

// DDD Application Hooks
import { useOrdersContext } from '../application/useOrdersContext';
import { useBillingSagaContext } from '../application/useBillingSagaContext';
import { useSalesContext } from '../application/useSalesContext';
import { useProcurementContext } from '../application/useProcurementContext';
import { useUxReviewContext } from '../application/useUxReviewContext';
import { Order } from '../domain/orders/model';

export interface PortalContainerProps {
  screens: PortalScreen[];
  selectedScreenId: string;
  onSelectScreen: (screenId: string) => void;
  onDiscussWithAgent: (context: string) => void;
}

export const PortalContainer: React.FC<PortalContainerProps> = ({
  screens,
  selectedScreenId,
  onSelectScreen,
  onDiscussWithAgent,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('after');
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | undefined>(undefined);

  // Application Contexts (DDD)
  const { orders } = useOrdersContext();
  const {
    sagas,
    activeSaga,
    setActiveSagaId,
    isModalOpen: isSagaModalOpen,
    setIsModalOpen: setIsSagaModalOpen,
    isExecuting: isSagaExecuting,
    executeNewSaga,
  } = useBillingSagaContext();

  const { deals, clients } = useSalesContext();
  const { suppliers, contracts, inventory } = useProcurementContext();

  const {
    isReviewMode,
    setIsReviewMode,
    currentScreenPins,
    pendingPinPos,
    setPendingPinPos,
    newPinText,
    setNewPinText,
    addPin,
  } = useUxReviewContext(selectedScreenId);

  const currentScreen = screens.find((s) => s.id === selectedScreenId) || screens[0];

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isReviewMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPinPos({ x, y });
  };

  const handleOpenRefundForOrder = (order: Order) => {
    setSelectedOrderForRefund(order);
    setIsSagaModalOpen(true);
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* 1. Left Area: Domain Bounded Contexts Navigation */}
      <PortalTreeNav
        screens={screens}
        selectedScreenId={selectedScreenId}
        onSelectScreen={onSelectScreen}
      />

      {/* 2. Center & Right Area: Shell, Viewport, and Domain Modules */}
      <div className="flex-1 flex flex-col min-w-0">
        <PortalTopBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isReviewMode={isReviewMode}
          onToggleReviewMode={() => setIsReviewMode(!isReviewMode)}
          onOpenExternal={() => window.open(window.location.href, '_blank')}
        />

        {viewMode === 'diff' && <PortalDiffSummaryBar currentScreen={currentScreen} />}

        <UxReviewOverlay
          isReviewMode={isReviewMode}
          pins={currentScreenPins}
          pendingPinPos={pendingPinPos}
          newPinText={newPinText}
          onNewPinTextChange={setNewPinText}
          onSavePin={addPin}
          onCancelPendingPin={() => setPendingPinPos(null)}
          onDiscussWithAgent={onDiscussWithAgent}
          onCanvasClick={handleCanvasClick}
        >
          <PortalBrowserFrame
            selectedScreenId={selectedScreenId}
            viewMode={viewMode}
            onSelectScreen={onSelectScreen}
          >
            {/* Render Bounded Context Module View */}
            {selectedScreenId === 'screen-orders' && (
              <OrdersModuleView
                orders={orders}
                viewMode={viewMode}
                onOpenRefundModal={handleOpenRefundForOrder}
              />
            )}

            {selectedScreenId === 'screen-billing' && (
              <BillingModuleView
                viewMode={viewMode}
                sagas={sagas}
                activeSaga={activeSaga}
                onSelectSaga={setActiveSagaId}
                onOpenNewSagaModal={() => {
                  setSelectedOrderForRefund(undefined);
                  setIsSagaModalOpen(true);
                }}
              />
            )}

            {selectedScreenId === 'screen-funnel' && <FunnelModuleView deals={deals} />}

            {selectedScreenId === 'screen-clients' && <ClientsModuleView clients={clients} />}

            {selectedScreenId === 'screen-suppliers' && <SuppliersModuleView suppliers={suppliers} />}

            {selectedScreenId === 'screen-contracts' && <ContractsModuleView contracts={contracts} />}

            {selectedScreenId === 'screen-inventory' && <InventoryModuleView inventory={inventory} />}
          </PortalBrowserFrame>
        </UxReviewOverlay>
      </div>

      {/* Distributed Saga Execution Modal */}
      <RefundSagaModal
        isOpen={isSagaModalOpen}
        onClose={() => setIsSagaModalOpen(false)}
        order={selectedOrderForRefund}
        onConfirm={(orderId, orderNumber, amount, reason) => {
          executeNewSaga(orderId, orderNumber, amount, reason);
        }}
        isExecuting={isSagaExecuting}
      />
    </div>
  );
};
