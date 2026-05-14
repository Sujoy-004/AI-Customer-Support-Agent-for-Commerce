export class NetworkDetector {
  constructor() {
    this._listeners = new Set();
    this._handleChange = this._handleChange.bind(this);
    window.addEventListener('online', this._handleChange);
    window.addEventListener('offline', this._handleChange);
  }

  get isOnline() {
    return navigator.onLine;
  }

  onChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _handleChange() {
    this._listeners.forEach(cb => cb(this.isOnline));
  }

  destroy() {
    window.removeEventListener('online', this._handleChange);
    window.removeEventListener('offline', this._handleChange);
    this._listeners.clear();
  }
}