import LogoBox from '@/components/LogoBox'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useEffect, useRef, useState } from 'react'
import Flag from './components/Flag'
import LeftSideBarToggle from './components/LeftSideBarToggle'
import Notifications from './components/Notifications'
import ProfileDropdown from './components/ProfileDropdown'
import SearchBox from './components/SearchBox'
import ThemeCustomizeToggle from './components/ThemeCustomizeToggle'
import ThemeModeToggle from './components/ThemeModeToggle'
import { useLocation } from 'react-router-dom'


type TitleType = {
  title: string
}

const TopBar = () => {
  const navbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.addEventListener('scroll',
      () => {
        if (navbarRef.current) navbarRef.current.classList.toggle('topbar-active', window.scrollY > 100)
      }
    )
  }, [])


  let location = useLocation();

  const [title, setTitle] = useState<string>('Welcome')

  useEffect(() => {
    setTitle(document.title.split("|")[0])
    console.log(title)

  }, [title, location])

  return (
    <>
      <header ref={navbarRef} className={`app-topbar `} id="header">
        <div className="page-container topbar-menu">
          <div className="d-flex align-items-center gap-2">
            <LogoBox />
            <LeftSideBarToggle />
            

            <div className="topbar-item d-none d-md-flex px-2">
              <div>
                <h4 className="page-title fs-20 fw-semibold mb-0">{title}</h4>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="topbar-item d-flex d-xl-none">
              <button className="topbar-link" data-bs-toggle="modal" data-bs-target="#searchModal" type="button">
                <IconifyIcon icon='ri:search-line' className="fs-22" />
              </button>
            </div>
            <SearchBox />
            <Flag />
            <Notifications />
            <ThemeCustomizeToggle />
            <ThemeModeToggle />
            <ProfileDropdown />
          </div>
        </div>
      </header>

    </>
  )
}

export default TopBar