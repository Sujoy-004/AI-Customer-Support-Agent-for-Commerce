// src/services/escalationQueueSimulator.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EscalationQueueSimulator } from './escalationQueueSimulator';

describe('EscalationQueueSimulator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return position between 1 and 5', () => {
    const onChange = vi.fn();
    const simulator = new EscalationQueueSimulator(onChange);
    const position = simulator.getPosition();
    expect(position).toBeGreaterThanOrEqual(1);
    expect(position).toBeLessThanOrEqual(5);
    simulator.destroy();
  });

  it('should call onPositionChange with initial position', () => {
    const onChange = vi.fn();
    new EscalationQueueSimulator(onChange);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should return new position on refresh', () => {
    const onChange = vi.fn();
    const simulator = new EscalationQueueSimulator(onChange);
    const position = simulator.refresh();
    expect(position).toBeGreaterThanOrEqual(1);
    expect(position).toBeLessThanOrEqual(5);
    expect(onChange).toHaveBeenCalledTimes(2);
    simulator.destroy();
  });

  it('should start interval and call onPositionChange on tick', () => {
    const onChange = vi.fn();
    const simulator = new EscalationQueueSimulator(onChange, 8000);
    simulator.start();
    vi.advanceTimersByTime(8000);
    expect(onChange).toHaveBeenCalledTimes(2);
    simulator.destroy();
  });

  it('should stop interval on stop', () => {
    const onChange = vi.fn();
    const simulator = new EscalationQueueSimulator(onChange, 8000);
    simulator.start();
    simulator.stop();
    vi.advanceTimersByTime(8000);
    expect(onChange).toHaveBeenCalledTimes(1);
    simulator.destroy();
  });

  it('should destroy and stop interval', () => {
    const onChange = vi.fn();
    const simulator = new EscalationQueueSimulator(onChange, 8000);
    simulator.start();
    simulator.destroy();
    vi.advanceTimersByTime(8000);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});