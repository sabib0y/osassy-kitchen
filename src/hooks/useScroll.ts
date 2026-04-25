import { useCallback, useEffect, useState } from "react";

interface UseScrollReturn {
  scrollTop: boolean;
  scroll: number;
}

const useScroll = (scrollSize: number = 0): UseScrollReturn => {
  const [scroll, setScroll] = useState<number>(() =>
    typeof window !== 'undefined' ? window.scrollY : 0
  );
  const [scrollTop, setScrollTop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.scrollY > scrollSize : false
  );

  const handleSet = useCallback(() => {
    setScroll(window?.scrollY || 0);
    if ((window?.scrollY || 0) > scrollSize) {
      setScrollTop(true);
    } else {
      setScrollTop(false);
    }
  }, [scrollSize]);

  useEffect(() => {
    handleSet();
    window.addEventListener("scroll", handleSet);

    return () => window.removeEventListener("scroll", handleSet);
  }, [handleSet]);

  return { scrollTop, scroll };
};

export default useScroll;