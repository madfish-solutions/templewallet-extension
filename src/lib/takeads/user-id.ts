import browser from 'webextension-polyfill';

class UserId {
  private generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15);
  }

  private getUserIdCb(callback: (userId: string) => void) {
    browser.storage.local.get(['user_id']).then(result => {
      let userId = result.user_id;

      if (!userId) {
        userId = this.generateUserId();
        browser.storage.local.set({ user_id: userId });
      }

      callback(userId);
    });
  }

  async getUserId(): Promise<string> {
    return new Promise(resolve => {
      this.getUserIdCb(userId => {
        resolve(userId);
      });
    });
  }
}

export const userIdService = new UserId();
