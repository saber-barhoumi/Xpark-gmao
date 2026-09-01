import { MENU_ITEMS } from '@/assets/data/menu-items'
import { MenuItemType } from '@/types/layout'
import { APP_ROUTES } from '@/routes/index'
import { roleMatches } from '@/config/rbac'

/**
 * URL de route → rôles autorisés, dérivé directement de `routes/index.ts`
 * (`AppRoute.allowedRoles`). C'est la MÊME table que celle utilisée par
 * `ProtectedRoute` : la barre latérale ne peut donc jamais montrer un lien
 * vers une page que le rôle courant ne peut pas ouvrir.
 */
const ROLES_BY_PATH: Record<string, string[] | undefined> =
  Object.fromEntries(APP_ROUTES.map(r => [r.path, r.allowedRoles]))

/** Filtre récursivement les items (et leurs enfants) selon le rôle courant. */
const filterByRole = (items: MenuItemType[], role?: string | null): MenuItemType[] =>
  items.reduce<MenuItemType[]>((acc, item) => {
    if (item.children) {
      const children = filterByRole(item.children, role)
      if (children.length > 0) acc.push({ ...item, children })
      return acc
    }
    if (item.isTitle || !item.url || roleMatches(ROLES_BY_PATH[item.url], role)) {
      acc.push(item)
    }
    return acc
  }, [])

/** Retire un titre de section (isTitle) si aucun élément ne le suit (groupe vidé par le filtre). */
const dropOrphanTitles = (items: MenuItemType[]): MenuItemType[] =>
  items.filter((item, idx) => !item.isTitle || (!!items[idx + 1] && !items[idx + 1].isTitle))

const applyRoleFilter = (items: MenuItemType[], role?: string | null): MenuItemType[] =>
  dropOrphanTitles(filterByRole(items, role))

export const getMenuItems = (role?: string | null): MenuItemType[] => {
  return applyRoleFilter(MENU_ITEMS, role)
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
export const getHorizontalMenuItems = (role?: string | null): MenuItemType[] => {
  return applyRoleFilter(MENU_ITEMS, role)
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
