import { useCallback, useMemo, useState } from 'react'

/**
 * useBulkSelection — sélection multiple générique pour les tables du back office.
 *
 * Patron unique (issu des pages /alertes et /gestion/demandes-transport) pour que
 * TOUTES les listes offrent la même expérience : case « tout sélectionner » dans
 * l'en-tête, case par ligne, boutons « Supprimer la sélection (n) » / « Tout
 * supprimer ». Le hook est agnostique du type d'id (number ou string — IBOA
 * utilise des ids VARCHAR).
 *
 * Usage :
 *   const sel = useBulkSelection(filtered, r => r.idVehicule)
 *   <input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} />
 *   <input type="checkbox" checked={sel.isSelected(id)} onChange={() => sel.toggle(id)} />
 */
export function useBulkSelection<T, K extends number | string>(items: T[], getId: (item: T) => K) {
    const [selected, setSelected] = useState<Set<K>>(new Set())

    const ids = useMemo(() => items.map(getId), [items, getId])
    const allSelected = ids.length > 0 && ids.every(id => selected.has(id))

    const toggle = useCallback((id: K) =>
        setSelected(prev => {
            const n = new Set(prev)
            if (n.has(id)) n.delete(id); else n.add(id)
            return n
        }), [])

    const toggleAll = useCallback(() =>
        setSelected(prev =>
            ids.length > 0 && ids.every(id => prev.has(id)) ? new Set() : new Set(ids)),
        [ids])

    const clear = useCallback(() => setSelected(new Set()), [])
    const isSelected = useCallback((id: K) => selected.has(id), [selected])

    return {
        selected,
        selectedIds: useMemo(() => [...selected], [selected]),
        count: selected.size,
        allSelected,
        isSelected,
        toggle,
        toggleAll,
        clear,
    }
}

export default useBulkSelection
