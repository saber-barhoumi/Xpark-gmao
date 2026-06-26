
import ThemeCustomizer from '@/components/ThemeCustomizer'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'
import React, { useState } from 'react'

const ThemeCustomizeToggle = () => {

  const {
    themeCustomizer: { open, toggle },
  } = useLayoutContext()
  const [hasOpenedOnce, setHasOpenedOnce] = useState(open)

  const toggleThemeCustomizerOffcanvas = () => {
    if (!hasOpenedOnce) setHasOpenedOnce(true)
    toggle()
  }
  return (
    <>
    <div className="topbar-item d-none d-sm-flex">
      <button onClick={toggleThemeCustomizerOffcanvas} className="topbar-link" data-bs-toggle="offcanvas" data-bs-target="#theme-settings-offcanvas" type="button">
        <IconifyIcon icon='ri:settings-4-line' className="fs-22" />
      </button>
    </div>
    {hasOpenedOnce && <ThemeCustomizer open={open} toggle={toggleThemeCustomizerOffcanvas} />}
    </>
  )
}

export default ThemeCustomizeToggle