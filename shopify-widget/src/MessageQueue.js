export class MessageQueue {
  constructor() {
    this._queue = [];
    this._processing = false;
    this.onUpdate = null;
  }

  enqueue(message) {
    this._queue.push(message);
    this._processNext();
  }

  async _processNext() {
    if (this._processing || this._queue.length === 0) return;
    this._processing = true;
    const msg = this._queue.shift();
    try {
      msg.status = 'sending';
      if (this.onUpdate) this.onUpdate(msg);
      await this._send(msg);
      msg.status = 'delivered';
    } catch (err) {
      msg.status = 'error';
    }
    if (this.onUpdate) this.onUpdate(msg);
    this._processing = false;
    this._processNext();
  }

  async _send(msg) {
    // Stub — overridden by ChatWidget in Phase 3+
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  get length() {
    return this._queue.length;
  }

  get isProcessing() {
    return this._processing;
  }
}