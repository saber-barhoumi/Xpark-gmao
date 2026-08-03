import { MENU_ITEMS } from '@/assets/data/menu-items'
import { MenuItemType } from '@/types/layout'

export const getMenuItems = (): MenuItemType[] => {
  return MENU_ITEMS
}

/**
 * Le menu horizontal servait auparavant une SECONDE liste (héritée du
 * template) qui dupliquait la navigation et pointait très majoritairement
 * vers des pages de démonstration aujourd'hui supprimées : basculer en
 * disposition horizontale exposait une navigation cassée.
 *
 * Les deux dispositions partagent désormais la MÊME définition de menu :
 * une seule source de vérité, aucune divergence possible.
 */
export const getHorizontalMenuItems = (): MenuItemType[] => {
  return MENU_ITEMS
}

export const findAllParent = (menuItems: MenuItemType[], menuItem: MenuItemType): string[] => {
  let parents: string[] = []
  const parent = findMenuItem(menuItems, menuItem.parentKey)
  if (parent) {
    parents.push(parent.key)
    if (parent.parentKey) {
      parents = [...parents, ...findAllParent(menuItems, parent)]
    }
  }
  return parents
}

export const getMenuItemFromURL = (items: MenuItemType | MenuItemType[], url: string): MenuItemType | undefined => {
  if (items instanceof Array) {
    for (const item of items) {
      const foundItem = getMenuItemFromURL(item, url)
      if (foundItem) {
        return foundItem
      }
    }
  } else {
    if (items.url == url) return items
    if (items.children != null) {
      for (const item of items.children) {
        if (item.url == url) return item
      }
    }
  }
}

export const findMenuItem = (menuItems: MenuItemType[] | undefined, menuItemKey: MenuItemType['key'] | undefined): MenuItemType | null => {
  if (menuItems && menuItemKey) {
    for (const item of menuItems) {
      if (item.key === menuItemKey) {
        return item
      }
      const found = findMenuItem(item.children, menuItemKey)
      if (found) return found
    }
  }
  return null
}
