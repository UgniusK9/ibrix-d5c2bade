type SyncStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const createMemoryStorage = (): SyncStorage => {
  const store = new Map<string, string>();

  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: (name) => {
      store.delete(name);
    },
  };
};

const memoryLocalStorage = createMemoryStorage();
const memorySessionStorage = createMemoryStorage();

const getValidatedStorage = (type: "local" | "session"): SyncStorage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = type === "local" ? window.localStorage : window.sessionStorage;
    const testKey = `__ibrix_${type}_storage_test__`;
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
};

export const getLocalStateStorage = (): SyncStorage => getValidatedStorage("local") ?? memoryLocalStorage;

export const getSessionStateStorage = (): SyncStorage => getValidatedStorage("session") ?? memorySessionStorage;

export const safeLocalStorageGetItem = (key: string): string | null => getLocalStateStorage().getItem(key);

export const safeSessionStorageGetItem = (key: string): string | null => getSessionStateStorage().getItem(key);

export const safeSessionStorageSetItem = (key: string, value: string): void => {
  getSessionStateStorage().setItem(key, value);
};

export const safeSessionStorageRemoveItem = (key: string): void => {
  getSessionStateStorage().removeItem(key);
};