// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { HomePage } from '../HomePage';
import { useAppStore } from '../../../features/useAppStore';
import { weatherService } from '../../../services/weatherService';
import { incidentsService } from '../../../services/incidentsService';
import { placesService } from '../../../services/placesService';

describe('HomePage Redesign Integration', () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock weatherService
    vi.spyOn(weatherService, 'getFullWeather').mockResolvedValue({
      location: { lat: 9.005401, lon: 38.763611 },
      current: {
        temperatureC: 21,
        condition: 'Scattered clouds',
        precipitationMm: 0,
        windKph: 14,
        humidity: 52,
      },
      forecast: [
        {
          date: '2026-10-31',
          hourly: [
            { time: '12:00', temperatureC: 21, condition: 'Fair', precipitationProbability: 10 },
            { time: '14:00', temperatureC: 22, condition: 'Partly cloudy', precipitationProbability: 25 },
          ],
        },
      ],
      arrivalAdvice: null,
      provider: 'open-meteo',
      retrievedAt: new Date().toISOString(),
      cached: false,
    });

    vi.spyOn(weatherService, 'getArrivalAdvice').mockResolvedValue({
      location: { lat: 9.03, lon: 38.74 },
      arrivalTime: '4:30 PM',
      forecastAtArrival: { temperatureC: 20, condition: 'Clear', precipitationProbability: 15 },
      suggestions: [
        {
          type: 'clothing',
          text: 'Pleasant afternoon expected. Light clothing and sunglasses recommended.',
          reason: 'Fair weather',
        },
      ],
    });

    // Mock incidentsService (default: clear / empty)
    vi.spyOn(incidentsService, 'getNearby').mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    // Mock placesService
    vi.spyOn(placesService, 'getSavedPlaces').mockResolvedValue({
      items: [],
      total: 0,
    });

    // Setup DOM container
    container = document.createElement('div');
    document.body.appendChild(container);

    useAppStore.setState({
      pageView: 'home',
      language: 'en',
      currentUser: null,
      savedPlaceIds: [],
    });
  });

  afterEach(async () => {
    const activeRoot = root;
    root = null;
    if (activeRoot) {
      await act(async () => {
        activeRoot.unmount();
      });
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const renderHome = async () => {
    const newRoot = createRoot(container);
    root = newRoot;
    await act(async () => {
      newRoot.render(React.createElement(HomePage));
    });
  };

  it('renders home page hero, navigation, and ask assistant trigger', async () => {
    await renderHome();

    const text = container.textContent || '';
    expect(text).toContain('GuzoMate');
    expect(text).toContain('Go somewhere new.');
    expect(text).toContain('Feel a little more at home.');
    expect(text).toContain('Ask GuzoMate');
    expect(text).toContain('Saved Places');
    expect(text).toContain('Weather');
    expect(text).toContain('Incidents');
  });

  it('Change 1: renders Saved Places section with list layout and empty state', async () => {
    await renderHome();

    const text = container.textContent || '';
    expect(text).toContain('Saved places');
    expect(text).toContain('No saved places yet');
    expect(text).toContain('Explore Map to Save');
  });

  it('Change 1: renders populated saved places when available', async () => {
    vi.spyOn(placesService, 'getSavedPlaces').mockResolvedValue({
      items: [
        {
          id: 'place-1',
          name: 'Tomoca Coffee Piazza',
          category: 'cafe',
          address: 'Wavel St, Piazza, Addis Ababa',
          latitude: 9.0345,
          longitude: 38.7512,
          tags: {},
          createdAt: new Date().toISOString(),
        } as any,
      ],
      total: 1,
    });
    localStorage.setItem('guzomate_token', 'mock-token');

    await renderHome();

    const text = container.textContent || '';
    expect(text).toContain('Tomoca Coffee Piazza');
    expect(text).toContain('cafe');
    expect(text).toContain('Wavel St, Piazza, Addis Ababa');
    expect(text).toContain('View');
  });

  it('Change 2: renders "Less guesswork. More going." with real fetched weather', async () => {
    await renderHome();

    const text = container.textContent || '';
    // Must keep exact title
    expect(text).toContain('Less guesswork.');
    expect(text).toContain('More going.');

    // Real weather data from mock
    expect(text).toContain('21°C');
    expect(text).toContain('Scattered clouds');
    expect(text).toContain('Feels like');
    expect(text).toContain('Precipitation');
    expect(text).toContain('Wind');
    expect(text).toContain('Humidity');
    expect(text).toContain('Pleasant afternoon expected');
  });

  it('Change 3: renders "A little heads-up. A lot less uncertainty." and happily tells user when no incidents exist', async () => {
    // Empty incidents
    vi.spyOn(incidentsService, 'getNearby').mockResolvedValue({ items: [] });

    await renderHome();

    const text = container.textContent || '';
    // Must keep title and copy
    expect(text).toContain('A little heads-up.');
    expect(text).toContain('A lot less uncertainty.');
    expect(text).toContain('Real journeys have unexpected moments.');
    expect(text).toContain('Report an incident');

    // Happily tell user that there is no incident!
    expect(text).toContain('All Clear on the Road!');
    expect(text).toContain('No incidents or road hazards reported');
    expect(text).toContain('Great news! Fellow travelers report clear roads and smooth sailing across your route.');
  });

  it('Change 3: renders real fetched road incidents when active incidents exist', async () => {
    vi.spyOn(incidentsService, 'getNearby').mockResolvedValue({
      items: [
        {
          id: 'inc-1',
          type: 'ROAD_CLOSURE',
          description: 'Piazza road closed due to marathon event.',
          locationName: 'Piazza Square',
          location: { lat: 9.035, lon: 38.752 },
          status: 'ACTIVE',
          verification: 'COMMUNITY_CONFIRMED',
          occurredAt: new Date(Date.now() - 15 * 60000).toISOString(),
          createdAt: new Date().toISOString(),
        } as any,
      ],
    });

    await renderHome();

    const text = container.textContent || '';
    expect(text).toContain('A little heads-up.');
    expect(text).toContain('ROAD CLOSURE');
    expect(text).toContain('Piazza Square');
    expect(text).toContain('Piazza road closed due to marathon event.');
    expect(text).toContain('15 min ago');
    expect(text).toContain('Active');
  });
});
