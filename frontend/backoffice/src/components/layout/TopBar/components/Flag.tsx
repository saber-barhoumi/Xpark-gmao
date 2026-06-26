import React from 'react'
import flagTn from '@/assets/images/flags/tn.svg'
import { Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const Flag = () => {

  const flags = [{
    flag: flagTn,
    language: 'Tunisie'
  }]

  return (
    <div className="topbar-item">
      <Dropdown align={'end'}>
        <DropdownToggle as={'button'} className="topbar-link drop-arrow-none" data-bs-toggle="dropdown" data-bs-offset="0,32" type="button" aria-haspopup="false" aria-expanded="false">
          <img src={flagTn} alt="user-image" className="w-100 rounded" height={18} id="selected-language-image" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          {
            flags.map((flag, idx) => (
              <a href="javascript:void(0)" className="dropdown-item" key={idx}>
                <img src={flag.flag} alt="user-image" className="me-1 rounded" height={18} /> <span className="align-middle">{flag.language}</span>
              </a>
            ))
          }
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default Flag