
export class NetworkDetector {
  private isOnline: boolean = navigator.onLine;

  constructor(private onStatusChange: (status: boolean) => void) {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.updateStatus(true);
  };

  private handleOffline = () => {
    this.updateStatus(false);
  };

  private updateStatus(status: boolean) {
    this.isOnline = status;
    this.onStatusChange(status);
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }
}

