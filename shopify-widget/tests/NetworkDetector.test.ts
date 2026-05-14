
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NetworkDetector } from '../src/core/NetworkDetector';

describe('NetworkDetector', () => {
  let detector: NetworkDetector;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCallback = vi.fn();
    // Default to online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Instantiates with current navigator.onLine status', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    detector = new NetworkDetector(mockCallback);
    expect(detector.getIsOnline()).toBe(false);
  });

  it('Fires callback with false when window offline event occurs', () => {
    detector = new NetworkDetector(mockCallback);
    window.dispatchEvent(new Event('offline'));
    expect(mockCallback).toHaveBeenCalledWith(false);
    expect(detector.getIsOnline()).toBe(false);
  });

  it('Fires callback with true when window online event occurs', () => {
    detector = new NetworkDetector(mockCallback);
    window.dispatchEvent(new Event('online'));
    expect(mockCallback).toHaveBeenCalledWith(true);
    expect(detector.getIsOnline()).toBe(true);
  });
});

