import { useEffect } from 'react';

let lockCount = 0;
let prevOverflow = '';
let prevPaddingRight = '';

const getScrollbarWidth = (): number => {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
};

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    if (typeof document === 'undefined') return;

    lockCount += 1;
    if (lockCount === 1) {
      const bodyStyle = document.body.style;
      prevOverflow = bodyStyle.overflow;
      prevPaddingRight = bodyStyle.paddingRight;

      const scrollbarWidth = getScrollbarWidth();
      bodyStyle.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        bodyStyle.paddingRight = `${scrollbarWidth}px`;
      }
    }

    return () => {
      if (typeof document === 'undefined') return;
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        const bodyStyle = document.body.style;
        bodyStyle.overflow = prevOverflow;
        bodyStyle.paddingRight = prevPaddingRight;
      }
    };
  }, [isLocked]);
}

