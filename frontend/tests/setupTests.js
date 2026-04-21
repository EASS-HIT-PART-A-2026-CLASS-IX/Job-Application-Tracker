import '@testing-library/jest-dom/vitest'

// Provide a stable localStorage mock for jsdom-based interface tests.
const storage = {};

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => {
      storage[key] = String(value);
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => {
        delete storage[key];
      });
    },
  },
  writable: true,
});
