import LogoBox from '@/components/LogoBox'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import React, { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FallbackLoading from '@/components/FallbackLoading'
import { getMenuItems } from '@/helpers/Manu'

import avatar1 from '@/assets/images/users/avatar-1.jpg'
import { Button, Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { useLayoutContext } from '@/context/useLayoutContext'
import HoverMenuToggle from './components/HoverMenuToggle'
import authService, { AuthResponse } from '@/services/authService'
import { usePendingMissionsCount } from '@/hooks/usePendingMissionsCount'
import type { MenuItemType } from '@/types/layout'
// import AppMenu from './components/AppMenu'


const AppMenu = lazy(() => import('./components/AppMenu'))

/** Injecte le compteur de missions EN_ATTENTE en badge sur l'entrée « Missions » */
const withPendingBadge = (items: MenuItemType[], pending: number): MenuItemType[] =>
  items.map(item => ({
    ...item,
    ...(item.key === 'missions' && pending > 0
      ? { badge: { text: String(pending), variant: 'danger' } }
      : {}),
    ...(item.children ? { children: withPendingBadge(item.children, pending) } : {}),
  }))


const LeftSideBar = () => {
  const pendingMissions = usePendingMissionsCount()
  const menuItems = withPendingBadge(getMenuItems(), pendingMissions)

  const { mainMenu, changeMainMenuSize } = useLayoutContext()

  const [user, setUser] = useState<AuthResponse | null>(null)

  useEffect(() => {
    const fetchUser = () => setUser(authService.getCurrentUser());
    fetchUser();

    // Recharger si le localStorage change (ex: après un upload de photo dans un autre composant)
    window.addEventListener('storage', fetchUser);
    
    // Custom event pour capturer les changements dans le même onglet
    window.addEventListener('profileUpdate', fetchUser);

    return () => {
      window.removeEventListener('storage', fetchUser);
      window.removeEventListener('profileUpdate', fetchUser);
    };
  }, [])

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    authService.logout()
  }

  const displayName = user 
    ? (`${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur') 
    : 'Utilisateur'
  const displayRole = user?.role || 'Utilisateur'

  const changeMenu = () => {
    if (mainMenu.size == 'default') {
      changeMainMenuSize('condensed')
    } else if (mainMenu.size == 'full') {
      changeMainMenuSize('default')
    }
  }


  const { toggleBackdrop } = useLayoutContext()

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'
  const avatarSrc = user?.photoUrl 
    ? `${API_URL.replace('/api', '')}${user.photoUrl}` 
    : avatar1

  return (
    <div className="sidenav-menu">
      <LogoBox />
      {/* <button  className="button-sm-hover">
        <IconifyIcon icon='ri:circle-line' className="align-middle" />
      </button> */}
      <HoverMenuToggle />
      <button onClick={changeMenu} className="sidenav-toggle-button">
        <IconifyIcon icon='ri:menu-5-line' className="fs-20" />
      </button>

      <SimplebarReactClient data-simplebar>
        <div className="sidenav-user">
          <Dropdown className="dropdown-center text-center">
            <DropdownToggle as={'a'} className="topbar-link text-reset drop-arrow-none px-2" data-bs-toggle="dropdown" type="button" aria-haspopup="false" aria-expanded="false">
              <img src={avatarSrc} width={46} height={46} className="rounded-circle" style={{ objectFit: 'cover' }} alt="user-image" />
              <span className="d-flex gap-1 sidenav-user-name my-2">
                <span>
                  <span className="mb-0 fw-semibold lh-base fs-15">{displayName}</span>
                  <p className="my-0 fs-13 text-muted">{displayRole}</p>
                </span>
                <IconifyIcon icon='ri:arrow-down-s-line' className="d-block sidenav-user-arrow align-middle" />
              </span>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
              <DropdownHeader className="noti-title">
                <h6 className="text-overflow m-0">Welcome !</h6>
              </DropdownHeader>
              <DropdownItem as={Link} to="/users/profile">
                <IconifyIcon icon='ri:account-circle-line' className="me-1 fs-16 align-middle" />
                <span className="align-middle">My Account</span>
              </DropdownItem>
              {/* <DropdownItem>
                <IconifyIcon icon='ri:wallet-3-line' className="me-1 fs-16 align-middle" />
                <span className="align-middle">Wallet : <span className="fw-semibold">$89.25k</span></span>
              </DropdownItem> */}
              <DropdownItem as={Link} to="/users/profile">
                <IconifyIcon icon='ri:settings-2-line' className="me-1 fs-16 align-middle" />
                <span className="align-middle">Settings</span>
              </DropdownItem>
              <DropdownItem as={Link} to="/pages/faq">
                <IconifyIcon icon='ri:question-line' className="me-1 fs-16 align-middle" />
                <span className="align-middle">Support</span>
              </DropdownItem>
              <div className="dropdown-divider" />
              <DropdownItem as={Link} to="/auth/lock-screen">
                <IconifyIcon icon='ri:lock-line' className="me-1 fs-16 align-middle" />
                <span className="align-middle">Lock Screen</span>
              </DropdownItem>
              <DropdownItem href="" onClick={handleLogout} className="active fw-semibold text-danger">
                <IconifyIcon icon='ri:logout-box-line' className="me-1 fs-16 align-middle" />
                <span className="align-middle">Sign Out</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        <Suspense fallback={<FallbackLoading />}>
          <AppMenu menuItems={menuItems} />
        </Suspense>

        <div className="help-box text-center">
          <h5 className="fw-semibold fs-16">Intelligence Artificielle</h5>
          <p className="mb-3 text-muted">Générez des rapports intelligents basés sur vos données</p>
          <div className="d-grid gap-2 px-2">
            <Link to="/analytics" className="btn btn-primary btn-sm rounded-pill shadow-sm">
              <i className="ri-magic-line me-1"></i>
              Analyses & KPIs
            </Link>
            <Button variant="soft-success" className="btn-sm rounded-pill mt-1">
              <i className="ri-file-chart-line me-1"></i>
              Générer Rapport
            </Button>
          </div>
        </div>
        <div className="clearfix" />
      </SimplebarReactClient>
    </div>
  )
}

export default LeftSideBar