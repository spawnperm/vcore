import React from 'react';
import { PortalScreen } from '../../types';
import { PortalContainer } from '../../modules/portal';

export interface PortalViewTabProps {
  screens: PortalScreen[];
  selectedScreenId: string;
  onSelectScreen: (screenId: string) => void;
  onDiscussWithAgent: (context: string) => void;
}

/**
 * PortalViewTab (Domain-Driven Design Architecture)
 * High-level tab container delegating to domain-bounded context modules in /src/modules/portal.
 */
export const PortalViewTab: React.FC<PortalViewTabProps> = (props) => {
  return <PortalContainer {...props} />;
};

export default PortalViewTab;
