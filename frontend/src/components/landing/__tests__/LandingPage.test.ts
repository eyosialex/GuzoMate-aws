// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { LandingPage } from '../LandingPage';
import { useAppStore } from '../../../features/useAppStore';
import { incidentsService } from '../../../services/incidentsService';
import { weatherService } from '../../../services/weatherService';

describe('LandingPage Redesign Integration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(incidentsService, 'getNearby').mockResolvedValue({ items: [], total: 0 } as any);
    vi.spyOn(weatherService, 'getArrivalAdvice').mockResolvedValue(null);
    container = document.createElement('div');
    document.body.appendChild(container);
    useAppStore.setState({
      language: 'en',
      currentUser: null,
      pageView: 'landing',
    });
  });

  it('renders landing page with GuzoMate branding and structure', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(LandingPage));
    });

    const text = container.textContent || '';
    expect(text).toContain('GuzoMate');
    expect(text).toContain('A map shows you where.');
    expect(text).toContain('We help you know what to expect.');

    // Four-chapter storytelling
    expect(text).toContain('The map unfolds');
    expect(text).toContain('A welcome in every language');
    expect(text).toContain('The road has a story');
    expect(text).toContain('Weather that follows you');

    // Multilingual greetings
    expect(text).toContain('Welcome');
    expect(text).toContain('እንኳን ደህና መጡ');
    expect(text).toContain('Baga nagaan dhuftan');

    // Destinations and waypoints
    expect(text).toContain('Bishoftu');
    expect(text).toContain('Addis Ababa');

    // Features section
    expect(text).toContain('AI travel assistant');
    expect(text).toContain('Arrival-time weather');
    expect(text).toContain('Community road reports');

    // Final actions
    expect(text).toContain('Go beyond');
    expect(text).toContain('Sign up');
    expect(text).toContain('Log in');
  });

  it('displays user state when authenticated', async () => {
    useAppStore.setState({
      currentUser: {
        id: 'usr-1',
        email: 'traveler@guzomate.et',
        name: 'Abebe Bikila',
        role: 'USER',
        status: 'ACTIVE',
        preferredLanguage: 'am',
        createdAt: '2026-10-27T07:45:00.000Z',
        updatedAt: '2026-10-27T07:45:00.000Z',
      },
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(LandingPage));
    });

    const text = container.textContent || '';
    expect(text).toContain('Open App');
    expect(text).toContain('Sign Out');
    expect(text).toContain('Open GuzoMate');
    expect(text).toContain('Explore Map');
    expect(text).toContain('Signed in as Abebe Bikila');
  });
});

