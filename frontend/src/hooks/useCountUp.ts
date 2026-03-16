import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  duration?: number;
  enabled?: boolean;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { duration = 1500, enabled = true } = options;
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target <= 0 || typeof window === 'undefined') {
      return;
    }

    const startTime = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const nextValue = Math.round(target * eased);
      setValue(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration, enabled]);

  return enabled && target > 0 ? value : 0;
}

export default useCountUp;
