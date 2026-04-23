export const StorageService = {
  isSupported(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },
  setItem(key: string, value: any): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Ошибка сохранения ${key}:`, error);
      return false;
    }
  },
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error(`Ошибка чтения ${key}:`, error);
      return defaultValue || null;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Ошибка удаления ${key}:`, error);
    }
  },
  clearAppData(): void {
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('budget_app_')
    );

    keysToRemove.forEach(key => {
      this.removeItem(key);
    });
  },
  getStorageSize(): string {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    if (total < 1024) {
      return `${total} B`;
    } else if (total < 1024 * 1024) {
      return `${(total / 1024).toFixed(2)} KB`;
    } else {
      return `${(total / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
};
