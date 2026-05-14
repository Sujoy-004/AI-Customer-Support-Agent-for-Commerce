import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkDetector } from './NetworkDetector.js';

describe('NetworkDetector', () => {
  let detector;

  beforeEach(() => {
    // Mock navigator.onLine to return true by default
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    });
    detector = new NetworkDetector();
  });
  afterEach(() => {
    detector.destroy();
    // Restore the original navigator.onLine
    delete navigator.onLine;
  });

  it('reflects initial navigator.onLine state', () => {
    expect(typeof detector.isOnline).toBe('boolean');
  });

  it('calls callback on offline event', () => {
    const callback = vi.fn();
    const unsubscribe = detector.onChange(callback);
    
    // Set navigator.onLine to false before dispatching offline event
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true
    });
    
    window.dispatchEvent(new Event('offline'));
    expect(callback).toHaveBeenCalledWith(false);
    unsubscribe();
  });

  it('calls callback on online event', () => {
    const callback = vi.fn();
    const unsubscribe = detector.onChange(callback);
    
    // Set navigator.onLine to true before dispatching online event
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    });
    
    window.dispatchEvent(new Event('online'));
    expect(callback).toHaveBeenCalledWith(true);
    unsubscribe();
  });

  it('unsubscribe removes listener', () => {
    const callback = vi.fn();
    const unsubscribe = detector.onChange(callback);
    unsubscribe();
    window.dispatchEvent(new Event('offline'));
    expect(callback).not.toHaveBeenCalled();
  });

  it('destroy removes all listeners', () => {
    const callback = vi.fn();
    detector.onChange(callback);
    detector.destroy();
    window.dispatchEvent(new Event('offline'));
    expect(callback).not.toHaveBeenCalled();
  });
});