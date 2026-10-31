// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { AuthModal, LoginModal, SignupModal, OtpModal } from '../index';
import { useAppStore } from '../../../features/useAppStore';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('AuthModal Redesign Integration', () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock Element.prototype.animate in happy-dom to avoid AbortError
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
      otpPhoneNumber: '',
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

  const renderComponent = async (element: React.ReactElement) => {
    const newRoot = createRoot(container);
    root = newRoot;
    await act(async () => {
      newRoot.render(
        React.createElement(
          MotionConfig,
          { reducedMotion: 'always', transition: { duration: 0 } },
          element
        )
      );
    });
  };

  const renderModal = async () => {
    await renderComponent(React.createElement(AuthModal));
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
    expect(text).toContain('Continue with Google');

    // Name field should not be present in login tab
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
    expect(text).toContain('Continue with Google');
  });

  it('renders OTP verification step when authModalTab is otp', async () => {
    useAppStore.setState({ 
      isAuthModalOpen: true, 
      authModalTab: 'otp', 
      otpPhoneNumber: '+251911234567' 
    });
    await renderModal();

    const text = container.textContent || '';
    expect(text).toContain('SMS Verification');
    expect(text).toContain('Verify your');
    expect(text).toContain('phone.');
    expect(text).toContain('Enter 6-digit verification code');
    expect(text).toContain('+251 91 123 4567');
    expect(text).toContain('AfroMessage SMS');

    // Should have 6 digit input boxes
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBe(6);
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
    expect(text).toContain('በGoogle ይቀጥሉ');
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
    expect(text).toContain("Google'n itti fufaa");
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

  it('shows validation error for invalid email or phone', async () => {
    useAppStore.setState({ isAuthModalOpen: true, authModalTab: 'login' });
    await renderModal();

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();

    await act(async () => {
      submitBtn.click();
    });

    expect(container.textContent).toContain('Please enter a valid email address.');
  });

  it('renders standalone LoginModal component with Ethiopian phone field and Google sign-in', async () => {
    const handleClose = vi.fn();
    const handleSwitch = vi.fn();

    await renderComponent(
      React.createElement(LoginModal, {
        isOpen: true,
        onClose: handleClose,
        onSwitchToSignup: handleSwitch,
      })
    );

    const text = container.textContent || '';
    expect(text).toContain('Phone Number');
    const phoneInput = container.querySelector('input[type="tel"]') as HTMLInputElement;
    expect(phoneInput).toBeTruthy();
    expect(phoneInput.placeholder).toContain('0911 234 567');
    expect(text).toContain('Continue with Google');
    expect(text).toContain("Don't have an account?");
  });

  it('renders standalone SignupModal component with validation and language options', async () => {
    const handleClose = vi.fn();
    const handleSwitch = vi.fn();

    await renderComponent(
      React.createElement(SignupModal, {
        isOpen: true,
        onClose: handleClose,
        onSwitchToLogin: handleSwitch,
      })
    );

    const text = container.textContent || '';
    expect(text).toContain('Full Name');
    expect(text).toContain('Phone Number');
    expect(text).toContain('Password');
    expect(text).toContain('Confirm Password');
    expect(text).toContain('Preferred Language');
    expect(text).toContain('English');
    expect(text).toContain('አማርኛ');
    expect(text).toContain('Afaan Oromoo');
    expect(text).toContain('Continue with Google');
  });

  it('renders standalone OtpModal component with 6 digit inputs and countdown timer', async () => {
    const handleClose = vi.fn();

    await renderComponent(
      React.createElement(OtpModal, {
        isOpen: true,
        phoneNumber: '0912345678',
        onClose: handleClose,
      })
    );

    const text = container.textContent || '';
    expect(text).toContain('Verify your');
    expect(text).toContain('+251 91 234 5678');
    expect(text).toContain('Enter 6-digit verification code');
    expect(text).toContain('Resend code in 60s');
    expect(text).toContain('Verify & Sign In');
  });
});
