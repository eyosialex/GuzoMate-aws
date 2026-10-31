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
    vi.spyOn(weatherService, 'getArrivalAdvice').mockResolvedValue(null as any);
    container = document.createElement('div');
    document.body.appendChild(container);
    useAppStore.setState({
      language: 'en',
      currentUser: null,
      pageView: 'landing',
    });
  });

  it('renders landing page with GuzoMate branding and English copy by default', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(LandingPage));
    });

    const text = container.textContent || '';
    expect(text).toContain('GuzoMate');
    expect(text).toContain('A map shows you where.');
    expect(text).toContain('We help you know what to expect.');

    // Four-chapter storytelling in English
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

  it('switches full page copy reactively to Amharic (am)', async () => {
    useAppStore.setState({ language: 'am' });

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(LandingPage));
    });

    const text = container.textContent || '';
    // Header tagline & actions
    expect(text).toContain('ካርታ የት መሄድ እንዳለብዎት ያሳያል።');
    expect(text).toContain('ምን እንደሚጠብቅዎት እንድያውቁ እናግዛለን።');
    expect(text).toContain('ይግቡ');
    expect(text).toContain('ይመዝገቡ');
    expect(text).toContain('ያስሱ');

    // Stage & Map points
    expect(text).toContain('የጉዞ መረጃ / ጉዞ በአራት ምዕራፎች');
    expect(text).toContain('ቢሾፍቱ');
    expect(text).toContain('አዲስ አበባ');
    expect(text).toContain('የሚደረስበት ሰዓት');

    // Four-chapter storytelling
    expect(text).toContain('ካርታው ይዘረጋል');
    expect(text).toContain('በሁሉም ቋንቋ አቀባበል');
    expect(text).toContain('መንገዱ የራሱ ታሪክ አለው');
    expect(text).toContain('አብሮዎት የሚጓዝ የአየር ሁኔታ');

    // Features
    expect(text).toContain('የAI የጉዞ ረዳት');
    expect(text).toContain('የመድረሻ ሰዓት የአየር ሁኔታ');
    expect(text).toContain('የማህበረሰብ የመንገድ ሪፖርቶች');

    // Closing CTA
    expect(text).toContain('ጉዞው ይቀጥላል');
    expect(text).toContain('ከመድረስ ባለፈ');

    // Footer
    expect(text).toContain('ስለ እኛ');
    expect(text).toContain('ያግኙን');
    expect(text).toContain('መልክዓ ምድር መሰረቱ ነው።');
  });

  it('switches full page copy reactively to Afaan Oromoo (om)', async () => {
    useAppStore.setState({ language: 'om' });

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(LandingPage));
    });

    const text = container.textContent || '';
    // Header tagline & actions
    expect(text).toContain('Kaartaan eessa akka deemtan isinitti agarsiisa.');
    expect(text).toContain('Maal akka isin eeggatu akka beektan isin gargaarra.');
    expect(text).toContain('Seenaa');
    expect(text).toContain("Galmaa'aa");
    expect(text).toContain('Daawwadhaa');

    // Stage & Map points
    expect(text).toContain('Odeeffannoo imalaa / imala boqonnaalee afuriin');
    expect(text).toContain('Bishooftuu');
    expect(text).toContain('Finfinnee');
    expect(text).toContain('Yeroo itti ga’amu');

    // Four-chapter storytelling
    expect(text).toContain('Kaartaan ni diriira');
    expect(text).toContain('Afaan hundumaan simannaa');
    expect(text).toContain('Daandiin seenaa qaba');
    expect(text).toContain('Qilleensa isin faana deemu');

    // Features
    expect(text).toContain('Gargaaraa Imalaa AI');
    expect(text).toContain("Haala qilleensa yeroo ga'umsaa");
    expect(text).toContain('Gabaasaalee daandii hawaasaa');

    // Closing CTA
    expect(text).toContain('Imalli ni fufa');
    expect(text).toContain("Ga'uu qofa osoo hin taane");

    // Footer
    expect(text).toContain('Waa’ee Keenya');
    expect(text).toContain('Nu Qunnamaa');
    expect(text).toContain('Ji’oogiraafiin bu’uura.');
  });

  it('updates page text dynamically when language is changed via setLanguage', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(LandingPage));
    });

    expect(container.textContent).toContain('A map shows you where.');

    // Switch to Amharic
    await act(async () => {
      useAppStore.getState().setLanguage('am');
    });

    expect(container.textContent).toContain('ካርታ የት መሄድ እንዳለብዎት ያሳያል።');
    expect(container.textContent).toContain('ይግቡ');

    // Switch to Afaan Oromoo
    await act(async () => {
      useAppStore.getState().setLanguage('om');
    });

    expect(container.textContent).toContain('Kaartaan eessa akka deemtan isinitti agarsiisa.');
    expect(container.textContent).toContain('Seenaa');
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
