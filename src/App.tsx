/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { SettingsProvider } from './context/SettingsContext';
import { AndroidFrame } from './components/AndroidFrame';
import { VaultContainer } from './components/VaultContainer';
import LoginPage from './components/LoginPage';

const AppContent: React.FC = () => {
  const { authUser, authReady } = useVault();

  if (!authReady) {
    return (
      <div className="h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#091540]"></div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage />;
  }

  return (
    <AndroidFrame>
      <VaultContainer />
    </AndroidFrame>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </SettingsProvider>
  );
}
