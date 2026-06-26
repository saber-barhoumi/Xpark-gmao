
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'
import { findAllParent, findMenuItem, getMenuItemFromURL } from '@/helpers/Manu'
import { MenuItemType, SubMenus } from '@/types/layout'
import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Collapse, DropdownToggle } from 'react-bootstrap'


const MenuItemWithChildren = ({ item, className, activeMenuItems, toggleMenu, level, tag }: SubMenus) => {
  const Tag: any = tag

  const getActiveClass = useCallback(
    (item: MenuItemType) => {
      return activeMenuItems?.includes(item.key) ? 'active' : ''
    },
    [activeMenuItems],
  )
  return (
    <Tag className={`${className} dropdown hover-dropdown`}>
      <DropdownToggle as={'a'} className={` ${tag === 'div' ? 'dropdown-item' : 'nav-link'} drop-arrow-none`} id="topnav-dashboards" data-bs-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">

        {item.icon && <span className="menu-icon"><IconifyIcon icon={item.icon} /></span>}
        <div className='d-flex w-100 justify-content-between align-items-center'>
          <span className="menu-text"> {item.label} </span>
          <span className="menu-arrow " >
            <IconifyIcon icon="tabler:chevron-right" width={14} height={14} />
          </span>
        </div>
      </DropdownToggle>
      <div className="dropdown-menu" aria-labelledby="topnav-dashboards">
        {(item.children || []).map((child, idx) => {
          return (
            <Fragment key={child.key + idx}>
              {child.children ? (
                <MenuItemWithChildren
                  item={child}
                  tag={"div"}
                  linkClassName={clsx('nav-link', getActiveClass(child))}
                  activeMenuItems={activeMenuItems}
                  className="dropdown"
                  level={level + 1}
                  subMenuClassName="sub-menu"
                  toggleMenu={toggleMenu}
                />
              ) : (
                <MenuItem level={level + 1} item={child} linkClassName={clsx('dropdown-item', getActiveClass(child))} />
              )}
            </Fragment>
          )
        })}
      </div>
    </Tag>
  )
}

const MenuItem = ({ item, linkClassName,className, level }: SubMenus) => {
  return (
    <li className={className}>
      <MenuItemLink level={level + 1} item={item} className={linkClassName} />
    </li>
  )
}

const MenuItemLink = ({ item, className }: SubMenus) => {
  return (

    <Link to={item.url ?? ''} target={item.target} className={clsx(className, { disabled: item.isDisabled })}>
      {item.icon && (
        <span className="menu-icon">
          <IconifyIcon icon={item.icon} />
        </span>
      )}

      <span className="menu-text">{item.label}</span>
    </Link>
  )
}


type AppMenuProps = {
  menuItems: Array<MenuItemType>
}

const HorizontalNavBar = ({ menuItems }: AppMenuProps) => {
  const pathname = useLocation()

  const [activeMenuItems, setActiveMenuItems] = useState<Array<string>>([])
  const toggleMenu = (menuItem: MenuItemType, show: boolean) => {
    if (show) setActiveMenuItems([menuItem.key, ...findAllParent(menuItems, menuItem)])
  }

  const getActiveClass = useCallback(
    (item: MenuItemType) => {
      return activeMenuItems?.includes(item.key) ? 'active' : ''
    },
    [activeMenuItems],
  )

  const activeMenu = useCallback(() => {
    const trimmedURL: any = pathname
    const matchingMenuItem = getMenuItemFromURL(menuItems, trimmedURL)

    if (matchingMenuItem) {
      const activeMt = findMenuItem(menuItems, matchingMenuItem.key)
      if (activeMt) {
        setActiveMenuItems([activeMt.key, ...findAllParent(menuItems, activeMt)])
      }

    }
  }, [pathname, menuItems])

  useEffect(() => {
    if (menuItems && menuItems.length > 0) activeMenu()
  }, [activeMenu, menuItems])


  const { horizontalMenu } = useLayoutContext()

  return (
    <>
      <header className="topnav">
        <nav className="navbar navbar-expand-lg">
          <nav className="page-container">
            <Collapse in={horizontalMenu.open} className="collapse navbar-collapse" >
              <div>
                <ul className="navbar-nav">
                  {
                    (menuItems || []).map((item, idx) => {
                      return (
                        <Fragment key={idx}>
                          {item.children ? (
                            <MenuItemWithChildren
                              item={item}
                              toggleMenu={toggleMenu}
                              // className=""
                              className={clsx('nav-item', getActiveClass(item))}
                              level={1}
                              linkClassName={clsx('nav-link', getActiveClass(item))}
                              subMenuClassName="sub-menu"
                              tag="li"
                              activeMenuItems={activeMenuItems}
                            />
                          ) : (
                            <MenuItem item={item} level={1} className="nav-item" linkClassName={clsx('dropdown-item nav-link', getActiveClass(item))} />
                          )}
                        </Fragment>
                      )
                    })
                  }
                </ul>
              </div>
            </Collapse>
          </nav>
        </nav>
      </header>

    </>
  )
}

export default HorizontalNavBar