import { useEffect, useRef, useState } from 'react';

/**
 * Triggers once when an element enters the viewport.
 * Used for scroll-based reveal animations.
 */
export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

/**
 * Animates a number from 0 to target with ease-out cubic easing.
 * Only starts when `isActive` is true.
 */
export function useCountUp(target: number, duration = 2000, isActive: boolean, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const startTime = performance.now();
    let rafId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((target * eased).toFixed(decimals)));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, isActive, decimals]);

  return value;
}
