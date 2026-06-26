import { useState, useEffect, useCallback } from 'react';

export interface ContextMenuState {
  visible:   boolean;
  x:         number;
  y:         number;
  messageId: number | null;
  isMine:    boolean;
}

export const useContextMenu = () => {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, messageId: null, isMine: false,
  });

  // Fermer en cliquant ailleurs ou en appuyant sur Escape
  useEffect(() => {
    if (!menu.visible) return;

    const close = () => setMenu(m => ({ ...m, visible: false }));

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    // Délai pour éviter que le mousedown qui ouvre le menu le ferme aussitôt
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', close);
      document.addEventListener('keydown', handleKey);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menu.visible]);

  const openMenu = useCallback((
    e: React.MouseEvent,
    messageId: number,
    isMine: boolean = false
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Calcul position pour rester dans le viewport
    const MENU_WIDTH  = 180;
    const MENU_HEIGHT = 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const x = e.clientX + MENU_WIDTH  > vw ? e.clientX - MENU_WIDTH  : e.clientX;
    const y = e.clientY + MENU_HEIGHT > vh ? e.clientY - MENU_HEIGHT  : e.clientY;

    setMenu({ visible: true, x, y, messageId, isMine });
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(m => ({ ...m, visible: false }));
  }, []);

  return { menu, openMenu, closeMenu };
};
