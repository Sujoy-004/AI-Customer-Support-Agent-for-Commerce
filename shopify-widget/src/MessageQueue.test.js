import { describe, it, expect, vi } from 'vitest';
import { MessageQueue } from './MessageQueue.js';

describe('MessageQueue', () => {
  it('processes messages in order', async () => {
    const queue = new MessageQueue();
    const results = [];
    queue._send = async (msg) => { results.push(msg.text); };
    queue.enqueue({ text: 'first' });
    queue.enqueue({ text: 'second' });
    await new Promise(r => setTimeout(r, 100));
    expect(results).toEqual(['first', 'second']);
  });

  it('returns queue length', () => {
    const queue = new MessageQueue();
    expect(queue.length).toBe(0);
  });

  it('handles send errors gracefully', async () => {
    const queue = new MessageQueue();
    let errored = false;
    queue._send = async () => { throw new Error('fail'); };
    queue.onUpdate = (msg) => { if (msg.status === 'error') errored = true; };
    queue.enqueue({ text: 'test' });
    await new Promise(r => setTimeout(r, 100));
    expect(errored).toBe(true);
  });
});