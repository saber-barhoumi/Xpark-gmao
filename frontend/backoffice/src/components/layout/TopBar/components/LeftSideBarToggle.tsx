
import { useCallback, useEffect, useRef } from 'react'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'
// import { usePathname } from 'next/navigation'
import useViewPort from '@/hooks/useViewPort'

import {debounce} from 'lodash';
import { useLocation } from 'react-router-dom'


const LeftSideBarToggle = () => {
  const { mainMenu, changeMainMenuSize, toggleBackdrop } = useLayoutContext()
  const pathname = useLocation()
  const isFirstRender = useRef(true)

  const { width } = useViewPort()

  const handleMenuSize = () => {
    if (mainMenu.size === 'full') toggleBackdrop()
    if (mainMenu.size === 'condensed') changeMainMenuSize('default')
    if (mainMenu.size === 'fullscreen') changeMainMenuSize('default')
    if (mainMenu.size === 'compact') changeMainMenuSize('condensed')
    else if (mainMenu.size === 'default') changeMainMenuSize('condensed')
  }


     const resize = useCallback(
        debounce(() => {
          if (isFirstRender.current) {
            isFirstRender.current = false
          }
          else if (mainMenu.size === 'full') {
            toggleBackdrop()
          }
      
          if (width <= 768) {
            if (mainMenu.size !== 'full') changeMainMenuSize('full')
          } else if (width <= 1140) {
            if (mainMenu.size !== 'condensed') changeMainMenuSize('condensed')
          }
        }, 500),
        [width]
    );

    useEffect(() => {
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [resize]);




  return (
    <button onClick={handleMenuSize} className="sidenav-toggle-button px-2">
      <IconifyIcon icon='ri:menu-5-line' className="fs-24" />
    </button>
  )
}

export default LeftSideBarToggle
