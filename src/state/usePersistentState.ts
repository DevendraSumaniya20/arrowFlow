import { useEffect, useState } from 'react';

/**
 * State that loads once from storage and saves after every change.
 * Never saves before the load finishes, so stored data is not overwritten
 * with defaults. `load` and `save` must be stable (module-level) functions.
 */
export function usePersistentState<T>(
  load: () => Promise<T>,
  save: (value: T) => Promise<void>,
  initial: T,
) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    load().then(v => {
      if (alive) {
        setValue(v);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    if (loaded) {
      save(value);
    }
  }, [value, loaded, save]);

  return [value, setValue, loaded] as const;
}
