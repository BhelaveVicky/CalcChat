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
    // Absolute maximum safety timeout: Never allow splash screen to stay stuck spinning
    const forceDismissTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => setShowSplash(false), 400);
    }, 2500);

    if (!authReady) {
      return () => clearTimeout(forceDismissTimer);
    }

    setIsFadingOut(false);

    let fadeTimer: NodeJS.Timeout;
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      fadeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 400);
    }, 800);

    return () => {
      clearTimeout(forceDismissTimer);
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

  // If user profile onboarding (username or password creation) is incomplete, force onboarding step
  if (needsUsername) {
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
