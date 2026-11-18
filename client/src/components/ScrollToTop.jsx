
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const element = document.getElementById(
        decodeURIComponent(hash.slice(1))
      );

      if (element) {
        element.scrollIntoView();
        return;
      }
    }

    window.history.scrollRestoration = 'manual';

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, hash]);

  return null;
}
