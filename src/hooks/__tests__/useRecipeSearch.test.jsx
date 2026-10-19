import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecipeSearch } from '../useRecipeSearch';
import * as quotaUtils from '../../utils/quota';
import * as cacheUtils from '../../utils/cache';

vi.mock('../../utils/quota');
vi.mock('../../utils/cache');

describe('useRecipeSearch Hook', () => {
  const mockFetchApiFn = vi.fn();
  const mockFilterCacheFn = vi.fn();

  const mockRecipes = [
    { id: 1, title: 'Pasta al Pomodoro' },
    { id: 2, title: 'Insalata Greca' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Silence console.error logs for expected test error scenarios
    vi.spyOn(console, 'error').mockImplementation(() => {});

    quotaUtils.canMakeApiCall.mockReturnValue(true);
    quotaUtils.getQuotaStatus.mockReturnValue({ used: 1, max: 10, isExceeded: false });
    cacheUtils.getCachedRecipes.mockReturnValue(mockRecipes);

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('dovrebbe inizializzare lo stato correttamente quando online e con quota disponibile', () => {
    const { result } = renderHook(() =>
      useRecipeSearch('search', mockFetchApiFn, mockFilterCacheFn)
    );

    expect(result.current.recipes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.searched).toBe(false);
    expect(result.current.isQuotaExceeded).toBe(false);
    expect(result.current.isOffline).toBe(false);
  });

  it('dovrebbe caricare automaticamente i dati in cache se avviato offline o con quota superata', () => {
    quotaUtils.canMakeApiCall.mockReturnValue(false);

    const { result } = renderHook(() =>
      useRecipeSearch('search', mockFetchApiFn, mockFilterCacheFn)
    );

    expect(result.current.isQuotaExceeded).toBe(true);
    expect(result.current.recipes).toEqual(mockRecipes);
    expect(result.current.searched).toBe(true);
  });

  it('dovrebbe eseguire una ricerca API live con successo e incrementare la quota', async () => {
    mockFetchApiFn.mockResolvedValueOnce(mockRecipes);
    const onSuccessCb = vi.fn();

    const { result } = renderHook(() =>
      useRecipeSearch('search', mockFetchApiFn, mockFilterCacheFn)
    );

    act(() => {
      result.current.executeSearch('tomato', onSuccessCb);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(mockFetchApiFn).toHaveBeenCalledWith('tomato');
    expect(cacheUtils.cacheRecipes).toHaveBeenCalledWith(mockRecipes);
    expect(quotaUtils.incrementQuota).toHaveBeenCalledWith('search');
    expect(onSuccessCb).toHaveBeenCalledWith(mockRecipes);
    expect(result.current.recipes).toEqual(mockRecipes);
    expect(result.current.loading).toBe(false);
  });

  it('dovrebbe gestire gli errori di quota HTTP 402 impostando isQuotaExceeded a true', async () => {
    const error402 = { response: { status: 402 } };
    mockFetchApiFn.mockRejectedValueOnce(error402);
    mockFilterCacheFn.mockReturnValue([]);

    const { result } = renderHook(() =>
      useRecipeSearch('search', mockFetchApiFn, mockFilterCacheFn)
    );

    act(() => {
      result.current.executeSearch('pasta');
    });

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(quotaUtils.setQuotaExceeded).toHaveBeenCalledWith('search');
    expect(result.current.isQuotaExceeded).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('dovrebbe ricadere sulla cache locale se la ricerca API fallisce per errore di rete', async () => {
    mockFetchApiFn.mockRejectedValueOnce(new Error('Network Error'));
    mockFilterCacheFn.mockReturnValueOnce([mockRecipes[0]]);

    const { result } = renderHook(() =>
      useRecipeSearch('search', mockFetchApiFn, mockFilterCacheFn)
    );

    act(() => {
      result.current.executeSearch('pasta');
    });

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(result.current.isOffline).toBe(true);
    expect(mockFilterCacheFn).toHaveBeenCalled();
    expect(result.current.recipes).toEqual([mockRecipes[0]]);
  });

  it('dovrebbe ripristinare i ricette ai valori di cache predefiniti quando si chiama resetToDefaultCache', () => {
    const { result } = renderHook(() =>
      useRecipeSearch('search', mockFetchApiFn, mockFilterCacheFn)
    );

    act(() => {
      result.current.resetToDefaultCache();
    });

    expect(cacheUtils.getCachedRecipes).toHaveBeenCalled();
    expect(result.current.recipes).toEqual(mockRecipes);
    expect(result.current.searched).toBe(true);
  });
});