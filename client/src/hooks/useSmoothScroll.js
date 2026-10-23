import { useEffect } from 'react';

/**
 * useSmoothScroll
 * Provides high-performance, silky-smooth interpolated momentum scrolling for mouse wheels
 * while preserving native trackpad inertia and eliminating frame-rate drops.
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let isAnimating = false;
    let scrollDebounce = null;
    let isTrackingWheel = false;

    // Detect if element or its ancestors have their own scrollable container
    const isScrollableElement = (el) => {
      let current = el;
      while (current && current !== document.body && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          current.scrollHeight > current.clientHeight
        ) {
          return true;
        }
        if (
          (overflowX === 'auto' || overflowX === 'scroll') &&
          current.scrollWidth > current.clientWidth
        ) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    };

    const handleScrollActivity = () => {
      document.body.classList.add('is-scrolling');
      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 100);

      if (!isAnimating) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    };

    const animate = () => {
      const diff = targetY - currentY;
      const step = diff * 0.14; // Smooth damping coefficient

      if (Math.abs(diff) < 0.75) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        isAnimating = false;
        return;
      }

      currentY += step;
      window.scrollTo(0, currentY);
      requestAnimationFrame(animate);
    };

    const handleWheel = (e) => {
      // If user is inside an internal scrollable element (e.g., table with horizontal overflow or textarea), let native scroll handle it
      if (isScrollableElement(e.target)) {
        return;
      }

      // Check for trackpad gestures (fractional delta or small continuous deltaMode 0)
      const isTrackpad =
        e.deltaMode === 0 &&
        (Math.abs(e.deltaY) < 30 || Math.abs(e.deltaX) > 0 || !Number.isInteger(e.deltaY));

      if (isTrackpad) {
        targetY = window.scrollY;
        currentY = window.scrollY;
        return;
      }

      // Mouse wheel detected: apply smooth interpolated glide
      e.preventDefault();
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      // Scale discrete mouse wheel steps for a comfortable, smooth scroll distance
      const delta = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY * 1.15;
      targetY = Math.max(0, Math.min(maxScroll, targetY + delta));

      handleScrollActivity();

      if (!isAnimating) {
        currentY = window.scrollY;
        isAnimating = true;
        requestAnimationFrame(animate);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScrollActivity, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScrollActivity);
      clearTimeout(scrollDebounce);
      document.body.classList.remove('is-scrolling');
    };
  }, []);
};
