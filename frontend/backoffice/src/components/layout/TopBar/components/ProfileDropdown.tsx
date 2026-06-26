import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import avatar1 from '@/assets/images/users/avatar-1.jpg'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import authService, { AuthResponse } from '@/services/authService'
import profileService from '@/services/profileService'

const ProfileDropdown = () => {
  const [user, setUser] = useState<AuthResponse | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        // Fetch fresh photo from DB (Bug 2 Fix)
        try {
          const profile = await profileService.getProfile(currentUser.idUtilisateur)
          if (profile.photoUrl) {
            setUser(prev => prev ? { ...prev, photoUrl: profile.photoUrl! } : null)
          }
        } catch (err) {
          console.error('[ProfileDropdown] Error fetching fresh profile:', err)
        }
      }
    }
    
    fetchUser();

    // Recharger si le localStorage change (ex: après un upload de photo dans un autre composant)
    window.addEventListener('storage', fetchUser);
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

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'
  const avatarSrc = user?.photoUrl 
    ? `${API_URL.replace('/api', '')}${user.photoUrl}` 
    : avatar1

  const displayName = user 
    ? (`${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur') 
    : 'Utilisateur'

  return (
    <div className="topbar-item nav-user">
      <Dropdown>
        <DropdownToggle className="topbar-link drop-arrow-none px-2" data-bs-toggle="dropdown" data-bs-offset="0,25" type="button" aria-haspopup="false" aria-expanded="false">
          <img src={avatarSrc} width={32} height={32} className="rounded-circle me-lg-2 d-flex" style={{ objectFit: 'cover' }} alt="user-image" />
          <span className="d-lg-flex flex-column gap-1 d-none">
            <h5 className="my-0">{displayName}</h5>
          </span>
          <IconifyIcon icon='ri:arrow-down-s-line' className="d-none d-lg-block align-middle ms-1" />
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
  )
}

export default ProfileDropdown