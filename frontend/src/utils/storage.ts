// Утилиты для работы с localStorage
export const StorageService = {
  // Проверяем поддержку localStorage
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

  // Сохраняем данные с обработкой ошибок
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

  // Получаем данные с обработкой ошибок
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error(`Ошибка чтения ${key}:`, error);
      return defaultValue || null;
    }
  },

  // Удаляем данные
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Ошибка удаления ${key}:`, error);
    }
  },

  // Очищаем все данные приложения
  clearAppData(): void {
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('budget_app_')
    );
    
    keysToRemove.forEach(key => {
      this.removeItem(key);
    });
    
    console.log(`Удалено ${keysToRemove.length} записей`);
  },

  // Получаем размер хранилища
  getStorageSize(): string {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2; // *2 для UTF-16
      }
    }
    
    // Конвертируем в КБ/МБ
    if (total < 1024) {
      return `${total} B`;
    } else if (total < 1024 * 1024) {
      return `${(total / 1024).toFixed(2)} KB`;
    } else {
      return `${(total / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
};