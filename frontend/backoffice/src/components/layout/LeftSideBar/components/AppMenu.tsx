import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { findAllParent, findMenuItem, getMenuItemFromURL } from '@/helpers/Manu'
import { MenuItemType, SubMenus } from '@/types/layout'
import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { Fragment, useCallback, useEffect, useState, type MouseEvent } from 'react'
import { Collapse, OverlayTrigger, Tooltip } from 'react-bootstrap'

const MenuItemWithChildren = ({ item, className, linkClassName, subMenuClassName, activeMenuItems, toggleMenu, level }: SubMenus) => {
  const [open, setOpen] = useState<boolean>(activeMenuItems!.includes(item.key))
  const level1 = level === 1

  useEffect(() => {
    setOpen(activeMenuItems!.includes(item.key))
  }, [activeMenuItems, item])

  const toggleMenuItem = (e: MouseEvent<HTMLParagraphElement>) => {
    e.preventDefault()
    const status = !open
    setOpen(status)
    if (toggleMenu) toggleMenu(item, status)
    return false
  }

  const getActiveClass = useCallback(
    (item: MenuItemType) => {
      return activeMenuItems?.includes(item.key) ? 'active' : ''
    },
    [activeMenuItems],
  )

  return (
    <li className={className}>
      <div onClick={toggleMenuItem} aria-expanded={open} role="button" className={clsx(linkClassName)}>
        {item.icon && (
          <span className="menu-icon">
            <IconifyIcon icon={item.icon} />
          </span>
        )}
        {level1 ? <span className="menu-text">{item.label}</span> :
          <Link to="" className='side-nav-link '><span className="menu-text">{item.label}</span>
            <div className='menu-arrow'>
              <IconifyIcon icon="tabler:chevron-right" width={19} height={19} />
            </div>
          </Link>}
        {!item.badge ? (
          <>
            {level1 &&
              <span className='menu-arrow'>
                <IconifyIcon icon="tabler:chevron-right" width={19} height={19} />
              </span>
            }
          </>
        ) : (
          <>
            <span className={`badge rounded-pill text-end bg-${item.badge.variant}`}>{item.badge.text}</span>
          </>
        )}

      </div>
      <Collapse in={open}>
        <div>
          <ul className={clsx(subMenuClassName)}>
            {(item.children || []).map((child, idx) => {
              return (
                <Fragment key={child.key + idx}>
                  {child.children ? (
                    <MenuItemWithChildren
                      item={child}
                      linkClassName={clsx('nav-link', getActiveClass(child))}
                      activeMenuItems={activeMenuItems}
                      className={clsx('side-nav-item', getActiveClass(child))}
                      level={level + 1}
                      subMenuClassName="sub-menu"
                      toggleMenu={toggleMenu}
                    />
                  ) : (
                    <MenuItem level={level + 1} item={child} className={clsx('side-nav-item', getActiveClass(child))} linkClassName={clsx('side-nav-link', getActiveClass(child))} />
                  )}
                </Fragment>
              )
            })}
          </ul>
        </div>
      </Collapse>
    </li>
  )
}

const MenuItem = ({ item, className, linkClassName, level }: SubMenus) => {
  return (
    <li className={className}>
      <MenuItemLink item={item} level={level + 1} className={linkClassName} />
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
      {item.badge && <span className={`badge rounded-pill text-end bg-${item.badge.variant}`}>{item.badge.text}</span>}
      {item?.badgeIcon &&
        <OverlayTrigger placement="top" overlay={<Tooltip className="tooltip-warning">Your wallet balance is <b>low!</b></Tooltip>}>
          <span className="badge p-0 menu-alert fs-16 text-danger">
            <IconifyIcon icon={item.badgeIcon} data-bs-html="true" data-bs-toggle="tooltip" data-bs-placement="top" />
          </span>
        </OverlayTrigger>
      }
    </Link>
  )
}

type AppMenuProps = {
  menuItems: Array<MenuItemType>
}

const AppMenu = ({ menuItems }: AppMenuProps) => {
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
    const currentPath = pathname.pathname; // Ensure to extract the correct URL part

    const matchingMenuItem = getMenuItemFromURL(menuItems, currentPath);
    if (matchingMenuItem) {
      const activeItem = findMenuItem(menuItems, matchingMenuItem.key);
      if (activeItem) {
        setActiveMenuItems([activeItem.key, ...findAllParent(menuItems, activeItem)]);
      }
    }

    setTimeout(() => {
      const activatedItem: HTMLAnchorElement | null = document.querySelector(`#leftside-menu-container .simplebar-content a[href="${currentPath}"]`);
      if (activatedItem) {
        const simplebarContent = document.querySelector('#leftside-menu-container .simplebar-content-wrapper');
        if (simplebarContent) {
          const offset = activatedItem.offsetTop - window.innerHeight * 0.4;
          scrollTo({ top: offset, behavior: 'smooth' });
        }
      }
    }, 400);
  }, [pathname, menuItems])

  useEffect(() => {
    if (menuItems && menuItems.length > 0) activeMenu()
  }, [activeMenu, menuItems])

  return (
    <ul className="side-nav">
      {(menuItems || []).map((item, idx) => {
        return (
          <Fragment key={item.key + idx}>
            {item.isTitle ? (
              <li className={clsx('side-nav-title', { 'mt-2': idx != 0 })}>{item.label}</li>
            ) : (
              <>
                {item.children ? (
                  <MenuItemWithChildren
                    item={item}
                    toggleMenu={toggleMenu}
                    className={clsx('side-nav-item', getActiveClass(item))}
                    level={1}
                    linkClassName={clsx('side-nav-link', getActiveClass(item))}
                    subMenuClassName="sub-menu"
                    activeMenuItems={activeMenuItems}
                  />
                ) : (
                  <MenuItem item={item} level={1} linkClassName={clsx('side-nav-link', getActiveClass(item))} className={clsx('side-nav-item', getActiveClass(item))} />
                )}
              </>
            )}
          </Fragment>
        )
      })}
    </ul>
  )
}

export default AppMenu

