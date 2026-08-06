import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State mirrored into localStorage.
 *
 * Reads lazily so the initial render is not blocked, writes on change, and
 * listens for `storage` events so two open tabs stay consistent. Every access
 * is guarded because localStorage throws in private-mode Safari and when a
 * quota is exceeded — a failed persist should never break the render.
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Storage unavailable or full — keep the in-memory value. */
    }
  }, [key, value]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== keyRef.current || event.newValue === null) return;
      try {
        setValue(JSON.parse(event.newValue));
      } catch {
        /* Ignore values another tab wrote in a shape we cannot parse. */
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(keyRef.current);
    } catch {
      /* no-op */
    }
    setValue(initialValue);
  }, [initialValue]);

  return [value, setValue, remove];
}
