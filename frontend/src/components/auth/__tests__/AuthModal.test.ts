// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { AuthModal } from '../AuthModal';
import { useAppStore } from '../../../features/useAppStore';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('AuthModal Redesign Integration', () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock Element.prototype.animate in happy-dom to avoid AbortError: The animation was canceled
    if (typeof Element !== 'undefined') {
      Element.prototype.animate = vi.fn().mockImplementation(() => {
        return {
          cancel: () => {},
          finish: () => {},
          pause: () => {},
          play: () => {},
          reverse: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          finished: Promise.resolve(),
          currentTime: 0,
          playbackRate: 1,
          playState: 'finished',
          startTime: 0,
        } as any;
      });
    }

    container = document.createElement('div');
    document.body.appendChild(container);
    useAppStore.setState({
      isAuthModalOpen: false,
      authModalTab: 'login',
      language: 'en',
      currentUser: null,
    });
  });

  afterEach(async () => {
    const currentRoot = root;
    if (currentRoot) {
      await act(async () => {
        currentRoot.unmount();
      });
      root = null;
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const renderModal = async () => {
    const newRoot = createRoot(container);
    root = newRoot;
    await act(async () => {
      newRoot.render(
        React.createElement(
          MotionConfig,
          { reducedMotion: 'always', transition: { duration: 0 } },
          React.createElement(AuthModal)
        )
      );
    });
  };

  it('does not render when isAuthModalOpen is false', async () => {
    await renderModal();
    expect(container.textContent).toBe('');
  });

  it('renders login modal with landing page aesthetic in English by default', async () => {
    useAppStore.setState({ isAuthModalOpen: true, authModalTab: 'login' });
    await renderModal();

    const text = container.textContent || '';
    expect(text).toContain('GuzoMate Access');
    expect(text).toContain('Welcome');
    expect(text).toContain('back.');
    expect(text).toContain('Sign in to access your saved places');
    expect(text).toContain('Log in');
    expect(text).toContain('Sign up');
    expect(text).toContain('Email address');
    expect(text).toContain('Password');
    expect(text).toContain('Verified travel intelligence');

    // Name and phone fields should not be present in login tab
    expect(text).not.toContain('Full Name');
  });

  it('renders sign up tab with landing page aesthetic and additional fields', async () => {
    useAppStore.setState({ isAuthModalOpen: true, authModalTab: 'signup' });
    await renderModal();

    const text = container.textContent || '';
    expect(text).toContain('Begin your');
    expect(text).toContain('journey.');
    expect(text).toContain('Full Name');
    expect(text).toContain('Email address');
    expect(text).toContain('Password');
    expect(text).toContain('Phone Number');
    expect(text).toContain('Create Account');
  });

  it('switches modal copy reactively to Amharic (am)', async () => {
    useAppStore.setState({ 
      isAuthModalOpen: true, 
      authModalTab: 'login',
      language: 'am' 
    });
    await renderModal();

    const text = container.textContent || '';
    expect(text).toContain('የጉዞሜት መግቢያ');
    expect(text).toContain('እንኳን');
    expect(text).toContain('ደህና መጡ።');
    expect(text).toContain('ይግቡ');
    expect(text).toContain('ይመዝገቡ');
    expect(text).toContain('ኢሜይል አድራሻ');
    expect(text).toContain('የይለፍ ቃል');
    expect(text).toContain('የተረጋገጠ የጉዞ መረጃ');
  });

  it('switches modal copy reactively to Afaan Oromoo (om)', async () => {
    useAppStore.setState({ 
      isAuthModalOpen: true, 
      authModalTab: 'signup',
      language: 'om' 
    });
    await renderModal();

    const text = container.textContent || '';
    expect(text).toContain('Seensa GuzoMate');
    expect(text).toContain('Imala keessan');
    expect(text).toContain('eegalaa.');
    expect(text).toContain('Seenaa');
    expect(text).toContain("Galmaa'aa");
    expect(text).toContain('Maqaa Guutuu');
    expect(text).toContain('Teessoo Imeelii');
    expect(text).toContain('Akkaawuntii Uumaa');
  });

  it('closes modal when close button is clicked', async () => {
    useAppStore.setState({ isAuthModalOpen: true, authModalTab: 'login' });
    await renderModal();

    const closeBtn = container.querySelector('button[aria-label="Close authentication modal"]') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();

    await act(async () => {
      closeBtn.click();
    });

    expect(useAppStore.getState().isAuthModalOpen).toBe(false);
  });

  it('shows validation error for invalid email', async () => {
    useAppStore.setState({ isAuthModalOpen: true, authModalTab: 'login' });
    await renderModal();

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();

    await act(async () => {
      submitBtn.click();
    });

    expect(container.textContent).toContain('Please enter a valid email address.');
  });
});
