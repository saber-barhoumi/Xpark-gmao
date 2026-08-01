import { useCallback, useEffect, useMemo, useState } from 'react'
import clientService from '@/services/clientService'
import userService from '@/services/userService'
import missionService from '@/services/missionService'
import type { Mission } from '@/types/mission'

/**
 * Annuaire clients — /users/contacts.
 *
 * La page affichait des contacts factices (data.ts du template). On agrège
 * désormais trois sources EXISTANTES, sans nouvelle API :
 *   • /user-management  → LISTE DE RÉFÉRENCE des comptes clients + statut réel
 *   • /clients          → enrichissement société / ville / secteur
 *   • /missions         → nombre de missions et dernière activité
 *
 * Pourquoi partir de /user-management et non de /clients : /clients ne renvoie
 * que les clients disposant d'une fiche société (2 sur 9 en base). Les clients
 * inscrits depuis le portail n'y figurent pas alors qu'ils ont des missions —
 * ils manquaient donc à l'annuaire. La liste des COMPTES est la référence, la
 * fiche société n'est qu'un complément.
 */

export interface ContactClient {
  idUtilisateur:    number
  nom:              string
  prenom:           string
  email:            string
  telephone?:       string | null
  nomSociete?:      string | null
  ville?:           string | null
  estEntreprise:    boolean
  statut:           string
  nbMissions:       number
  derniereActivite: string | null
}

/** Date la plus récente d'une mission (départ à défaut de création). */
const dateMission = (m: Mission) => m.dateDepart || m.dateCreation || ''

export function useContacts() {
  const [contacts, setContacts] = useState<ContactClient[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [statut, setStatut]     = useState<string>('ALL')

  const charger = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      // La fiche société et les missions sont des compléments : si l'appel
      // échoue (droits, service momentanément indisponible), on affiche quand
      // même l'annuaire plutôt qu'une page en erreur.
      const [comptesR, clientsR, missionsR] = await Promise.allSettled([
        userService.getAllUsers(),
        clientService.getAll(),
        missionService.getAll(),
      ])

      if (comptesR.status === 'rejected') throw new Error('comptes')
      const comptesClients = comptesR.value.filter(u => u.role === 'CLIENT')

      // Enrichissement société, quand la fiche existe.
      const ficheParId = new Map<number, { nomSociete?: string | null; ville?: string | null; estEntreprise: boolean }>()
      if (clientsR.status === 'fulfilled') {
        clientsR.value.forEach(c => ficheParId.set(c.idUtilisateur, {
          nomSociete: c.nomSociete, ville: c.ville, estEntreprise: c.estEntreprise,
        }))
      }

      const missions: Mission[] = missionsR.status === 'fulfilled' ? missionsR.value : []
      const parClient = new Map<number, Mission[]>()
      missions.forEach(m => {
        if (m.clientIdUtilisateur == null) return
        const liste = parClient.get(m.clientIdUtilisateur) ?? []
        liste.push(m)
        parClient.set(m.clientIdUtilisateur, liste)
      })

      setContacts(comptesClients.map(u => {
        const ms = parClient.get(u.idUtilisateur) ?? []
        const derniere = ms
          .map(dateMission)
          .filter(Boolean)
          .sort((a, b) => b.localeCompare(a))[0] ?? null
        const fiche = ficheParId.get(u.idUtilisateur)
        return {
          idUtilisateur: u.idUtilisateur,
          nom: u.nom, prenom: u.prenom, email: u.email,
          telephone: u.telephone,
          nomSociete: fiche?.nomSociete ?? null,
          ville: fiche?.ville ?? null,
          estEntreprise: fiche?.estEntreprise ?? false,
          statut: u.statut || (u.actif ? 'ACTIF' : 'DESACTIVE'),
          nbMissions: ms.length,
          derniereActivite: derniere,
        }
      }))
    } catch {
      setError("Impossible de charger l'annuaire des clients.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  const filtres = useMemo(() => {
    let list = [...contacts]
    if (statut !== 'ALL') list = list.filter(c => c.statut === statut)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c =>
        `${c.prenom} ${c.nom}`.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.nomSociete ?? '').toLowerCase().includes(q) ||
        (c.ville ?? '').toLowerCase().includes(q) ||
        (c.telephone ?? '').includes(q))
    }
    // Les clients les plus actifs d'abord — c'est l'ordre utile au commercial.
    return list.sort((a, b) => b.nbMissions - a.nbMissions)
  }, [contacts, search, statut])

  const stats = useMemo(() => ({
    total:       contacts.length,
    entreprises: contacts.filter(c => c.estEntreprise).length,
    actifs:      contacts.filter(c => c.statut === 'ACTIF').length,
    avecMission: contacts.filter(c => c.nbMissions > 0).length,
  }), [contacts])

  return {
    contacts: filtres, tous: contacts, stats,
    loading, error, search, setSearch, statut, setStatut,
    reload: charger,
  }
}

export default useContacts
