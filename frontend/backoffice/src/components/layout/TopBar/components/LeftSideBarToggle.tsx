import { useEffect, useRef } from 'react'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'
import useViewPort from '@/hooks/useViewPort'

/** Palier d'affichage déduit de la largeur de fenêtre. */
type Palier = 'mobile' | 'tablette' | 'bureau'
const palierDe = (w: number): Palier => (w <= 768 ? 'mobile' : w <= 1140 ? 'tablette' : 'bureau')

/** Taille de barre latérale imposée par chaque palier. */
const TAILLE_PAR_PALIER = { mobile: 'full', tablette: 'condensed', bureau: 'default' } as const

const LeftSideBarToggle = () => {
  const { mainMenu, changeMainMenuSize, toggleBackdrop } = useLayoutContext()
  const { width } = useViewPort()

  /**
   * Bascule de la barre latérale.
   *
   * L'ancienne version enchaînait des `if` indépendants terminés par un
   * `else if` : certains états (sm-hover, sm-hover-active…) n'étaient traités
   * par aucune branche et le bouton restait sans effet. Chaîne complète :
   * sur mobile on ouvre/ferme le tiroir, sinon on bascule replié / déplié.
   */
  const handleMenuSize = () => {
    if (mainMenu.size === 'full') { toggleBackdrop(); return }
    changeMainMenuSize(mainMenu.size === 'default' ? 'condensed' : 'default')
  }

  /**
   * Adaptation à la taille d'écran — UNIQUEMENT au franchissement d'un palier.
   *
   * Deux défauts corrigés ici :
   *  1. il n'existait aucun cas « grand écran » : une taille imposée par une
   *     petite fenêtre ('full' / 'condensed') était persistée dans le
   *     localStorage et n'était jamais restaurée en revenant sur un grand
   *     écran — la barre restait repliée d'une session à l'autre, même après
   *     rafraîchissement ;
   *  2. la logique se déclenchait à chaque évaluation, si bien qu'un repli
   *     volontaire sur grand écran était aussitôt annulé.
   *
   * On ne réagit donc qu'au CHANGEMENT de palier : à l'intérieur d'un palier,
   * le choix de l'utilisateur (replié, sm-hover…) est respecté.
   */
  const palier = palierDe(width)
  const palierPrecedent = useRef<Palier | null>(null)

  useEffect(() => {
    if (palierPrecedent.current === palier) return
    const premierRendu = palierPrecedent.current === null
    palierPrecedent.current = palier

    const cible = TAILLE_PAR_PALIER[palier]
    // Au premier rendu sur grand écran, on ne force rien : on respecte le
    // réglage enregistré (sauf s'il est resté bloqué sur une taille mobile).
    if (premierRendu && palier === 'bureau' && mainMenu.size !== 'full') return
    if (mainMenu.size !== cible) changeMainMenuSize(cible)
  }, [palier, mainMenu.size, changeMainMenuSize])

  return (
    <button onClick={handleMenuSize} className="sidenav-toggle-button px-2">
      <IconifyIcon icon='ri:menu-5-line' className="fs-24" />
    </button>
  )
}

export default LeftSideBarToggle
