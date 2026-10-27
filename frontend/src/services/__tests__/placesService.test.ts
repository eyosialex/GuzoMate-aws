// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { placesService } from '../placesService';
import { Place, PlacesNearbyResponse } from '../../types';
import { SavedPlacesResponse, SavePlaceResponse } from '../../types/places';

describe('Places & Saved Places Module Integration (Phase 7)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('guzomate_token', 'mock_jwt_token_for_phase7');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockPlace: Place = {
    id: '10492812',
    name: 'Tomoca Coffee',
    category: 'cafe',
    location: {
      lat: 9.0315,
      lon: 38.7521,
    },
    distanceMeters: 350.2,
    address: 'Wereda 01, Kirkos Subcity, Addis Ababa',
    tags: {
      amenity: 'cafe',
      cuisine: 'coffee_shop',
    },
    source: 'openstreetmap',
    osm: {
      type: 'node',
      id: '10492812',
    },
    isSaved: false,
  };

  it('1. should discover nearby places via PostGIS spatial query (GET /places/nearby)', async () => {
    const mockNearbyResponse: PlacesNearbyResponse = {
      items: [mockPlace],
      nextCursor: null,
      attribution: '© OpenStreetMap contributors',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify(mockNearbyResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await placesService.getNearby({
      lat: 9.03,
      lon: 38.75,
      radiusMeters: 5000,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/places/nearby?lat=9.03&lon=38.75&radiusMeters=5000');
    expect(result.items.length).toBe(1);
    expect(result.items[0].name).toBe('Tomoca Coffee');
    expect(result.attribution).toContain('OpenStreetMap');
  });

  it('2. should pass category and query parameters when filtering places', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [mockPlace],
          nextCursor: null,
          attribution: '© OpenStreetMap contributors',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await placesService.getNearby({
      lat: 9.03,
      lon: 38.75,
      category: 'cafe',
      query: 'Tomoca',
      limit: 10,
    });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('category=cafe');
    expect(url).toContain('query=Tomoca');
    expect(url).toContain('limit=10');
  });

  it('3. should retrieve single place details by ID (GET /places/:id)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify(mockPlace),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await placesService.getPlaceById('10492812');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/places/10492812');
    expect(result.name).toBe('Tomoca Coffee');
    expect(result.location.lat).toBe(9.0315);
  });

  it('4. should list traveler saved places bookmarks (GET /saved-places)', async () => {
    const mockSavedResponse: SavedPlacesResponse = {
      items: [
        {
          id: '10492812',
          savedId: '58c89bdf-28eb-4cfd-bfa2-378342894101',
          name: 'Tomoca Coffee',
          category: 'cafe',
          address: 'Kirkos Subcity, Addis Ababa',
          latitude: 9.0315,
          longitude: 38.7521,
          createdAt: '2026-10-27T08:00:00.000Z',
        },
      ],
      total: 1,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify(mockSavedResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await placesService.getSavedPlaces();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/saved-places');
    expect(result.items.length).toBe(1);
    expect(result.items[0].name).toBe('Tomoca Coffee');
    expect(result.total).toBe(1);
  });

  it('5. should bookmark a place (POST /saved-places with { placeId })', async () => {
    const mockSaveResponse: SavePlaceResponse = {
      placeId: '10492812',
      saved: true,
      createdAt: '2026-10-27T10:48:00.000Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify(mockSaveResponse),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await placesService.savePlace('10492812');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/saved-places');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ placeId: '10492812' });
    expect(result.saved).toBe(true);
  });

  it('6. should remove a saved place bookmark (DELETE /saved-places/:placeId)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 })
    );

    const result = await placesService.deleteSavedPlace('10492812');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/saved-places/10492812');
    expect(init?.method).toBe('DELETE');
    expect(result).toBe(true);
  });

  it('7. should toggle bookmark state between save and delete', async () => {
    const saveSpy = vi.spyOn(placesService, 'savePlace').mockResolvedValueOnce({
      placeId: '10492812',
      saved: true,
      createdAt: '2026-10-27T10:48:00.000Z',
    });
    const deleteSpy = vi.spyOn(placesService, 'deleteSavedPlace').mockResolvedValueOnce(true);

    // Save
    const res1 = await placesService.toggleSave('10492812', true);
    expect(saveSpy).toHaveBeenCalledWith('10492812');
    expect(res1).toBe(true);

    // Delete
    const res2 = await placesService.toggleSave('10492812', false);
    expect(deleteSpy).toHaveBeenCalledWith('10492812');
    expect(res2).toBe(true);
  });
});
