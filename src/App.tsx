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

const AppContent: React.FC = () => {
  const { authUser, authReady, needsUsername, onboardingStep, completeUsernameSetup, completeChatPasswordSetup } = useVault();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const prevAuthUserUid = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Determine if auth state or session changed
    const currentUid = authUser ? authUser.uid : null;
    
    // Always trigger splash screen on initial load, reload, session restore, or login/logout state change
    if (!authReady) {
      setShowSplash(true);
      setIsFadingOut(false);
      return;
    }

    // Trigger splash screen
    setShowSplash(true);
    setIsFadingOut(false);

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const fadeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 500); // 500ms fade out transition

      return () => clearTimeout(fadeTimer);
    }, 1500); // minimum 1.5s display for smooth premium feel

    prevAuthUserUid.current = currentUid;

    return () => clearTimeout(timer);
  }, [authReady, authUser?.uid]);

  // Mandatory Splash Screen overlay during launch, reload, login, or session initialization
  if (showSplash) {
    return <SplashScreen isFadingOut={isFadingOut} />;
  }

  // Unauthenticated user -> Login Screen
  if (!authUser) {
    return <LoginPage />;
  }

  // First time authenticated user -> Onboarding Flow
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
    <AndroidFrame>
      <VaultContainer />
    </AndroidFrame>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <VaultProvider>
          <AppContent />
        </VaultProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
