/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { VaultProvider, useVault } from './context/VaultContext';
import { SettingsProvider } from './context/SettingsContext';
import { AndroidFrame } from './components/AndroidFrame';
import { VaultContainer } from './components/VaultContainer';
import LoginPage from './components/LoginPage';
import { UsernameModal } from './components/UsernameModal';
import { ChatPasswordModal } from './components/ChatPasswordModal';
import { SplashScreen } from './components/SplashScreen';
import { BannedAccountModal } from './components/BannedAccountModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const { authUser, authReady, needsUsername, onboardingStep, completeUsernameSetup, completeChatPasswordSetup, isUnlocked } = useVault();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const prevAuthUserUid = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // If auth is not ready yet, keep splash screen visible
    if (!authReady) {
      setShowSplash(true);
      setIsFadingOut(false);
      return;
    }

    // Trigger splash screen fade sequence once auth is ready
    setShowSplash(true);
    setIsFadingOut(false);

    let fadeTimer: NodeJS.Timeout;
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      fadeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 500); // 500ms fade out transition
    }, 1200); // 1.2s display time

    return () => {
      clearTimeout(timer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [authReady, authUser?.uid]);

  // Mandatory Splash Screen overlay during launch, reload, login, or session initialization
  if (showSplash) {
    return <SplashScreen isFadingOut={isFadingOut} />;
  }

  // Unauthenticated user -> Login Screen
  if (!authUser) {
    return <LoginPage />;
  }

  // If vault is already unlocked (passcode entered in calculator), skip onboarding gate
  // and go straight to the main app for ALL users
  if (!isUnlocked && needsUsername) {
    if (onboardingStep === 'password') {
      return (
        <ChatPasswordModal
          isOpen={true}
          onComplete={async (passcode) => {
            await completeChatPasswordSetup(passcode);
          }}
        />
      );
    }

    return (
      <UsernameModal
        isOpen={true}
        defaultDisplayName={authUser.displayName || ''}
        onComplete={async (username, displayName) => {
          await completeUsernameSetup(username, displayName);
        }}
      />
    );
  }

  // Existing user with completed profile -> Main Application
  return (
    <>
      <BannedAccountModal />
      <AndroidFrame>
        <VaultContainer />
      </AndroidFrame>
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <VaultProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </VaultProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
