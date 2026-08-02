/**
 * Traduction métier des événements IBOA.
 *
 * Le flux interne transporte des identifiants techniques
 * (`xpark.optimization.plan-generated`, `internal`, `LOW`, `INFO`, `batchId`,
 * `executionTimeMs`…). Un exploitant n'a pas à les lire : cette couche les
 * convertit en information d'exploitation — ce qui s'est passé, pourquoi,
 * quel impact, quelle action recommandée.
 *
 * Un type inconnu retombe sur un libellé lisible déduit du nom, afin qu'un
 * nouvel événement ajouté côté serveur reste compréhensible sans modifier
 * cette table.
 */

export interface DescriptionEvenement {
  titre:        string
  quoi:         string
  pourquoi:     string
  impact:       string
  action:       string
  icone:        string
  couleur:      string   // variante Bootstrap
}

/** Dictionnaire des événements connus de la plateforme. */
const EVENEMENTS: Record<string, DescriptionEvenement> = {
  'xpark.optimization.plan-generated': {
    titre: 'Plan d’affectation généré',
    quoi: 'L’assistant d’optimisation a proposé une répartition des missions en attente entre les chauffeurs et les véhicules disponibles.',
    pourquoi: 'Des missions attendaient une affectation et les ressources nécessaires étaient disponibles.',
    impact: 'Les missions concernées peuvent être lancées sans saisie manuelle, ce qui réduit les délais de départ.',
    action: 'Vérifier la proposition dans « Optimisateur » puis la valider ou l’ajuster avant départ.',
    icone: 'tabler:route', couleur: 'primary',
  },
  'xpark.missions.ready-for-optimization': {
    titre: 'Missions prêtes à être affectées',
    quoi: 'Des missions validées attendent qu’un chauffeur et un véhicule leur soient attribués.',
    pourquoi: 'Ces missions ont été créées ou acceptées sans ressource assignée.',
    impact: 'Tant qu’elles ne sont pas affectées, ces transports ne peuvent pas démarrer.',
    action: 'Lancer l’optimisation du planning ou affecter manuellement depuis la page Missions.',
    icone: 'tabler:clipboard-list', couleur: 'info',
  },
  'xpark.mission.client-request': {
    titre: 'Nouvelle demande de transport',
    quoi: 'Un client a déposé une demande de transport depuis son espace.',
    pourquoi: 'Le client a besoin d’un acheminement et attend une proposition tarifaire.',
    impact: 'Une demande sans réponse rapide peut être perdue au profit d’un concurrent.',
    action: 'Établir et envoyer un devis depuis « Demandes de Transport ».',
    icone: 'tabler:file-invoice', couleur: 'success',
  },
  'xpark.mission.task-completed': {
    titre: 'Mission terminée',
    quoi: 'Un transport a été mené à son terme et clôturé.',
    pourquoi: 'Le chauffeur a confirmé la livraison et la mission a été fermée.',
    impact: 'La prestation est livrée : elle devient facturable et le véhicule redevient disponible.',
    action: 'Établir la facture correspondante et vérifier le kilométrage de retour.',
    icone: 'tabler:circle-check', couleur: 'success',
  },
  'xpark.mission.task-cancelled': {
    titre: 'Mission annulée',
    quoi: 'Un transport prévu a été annulé.',
    pourquoi: 'Annulation à la demande du client ou impossibilité d’exécuter la mission.',
    impact: 'Le chiffre d’affaires prévu est perdu et les ressources réservées se libèrent.',
    action: 'Prévenir le client, replanifier si possible et réaffecter le véhicule et le chauffeur.',
    icone: 'tabler:circle-x', couleur: 'danger',
  },
  'xpark.fleet.vehicle-breakdown': {
    titre: 'Panne de véhicule signalée',
    quoi: 'Un véhicule du parc est déclaré en panne.',
    pourquoi: 'Une avarie a été constatée en exploitation ou lors d’un contrôle.',
    impact: 'Le véhicule est immobilisé : les missions qui lui étaient confiées doivent être réattribuées.',
    action: 'Ouvrir un ordre de travail, réaffecter les missions en cours et prévenir les clients concernés.',
    icone: 'tabler:alert-triangle', couleur: 'danger',
  },
  'xpark.fleet.vehicle-added': {
    titre: 'Véhicule ajouté au parc',
    quoi: 'Un nouveau véhicule a été enregistré dans la flotte.',
    pourquoi: 'Acquisition ou mise en service d’un véhicule supplémentaire.',
    impact: 'La capacité de transport augmente.',
    action: 'Vérifier que l’assurance, la visite technique et la carte grise sont enregistrées.',
    icone: 'tabler:truck', couleur: 'primary',
  },
}

/** Repli lisible pour un type non répertorié (ex. nouvel événement serveur). */
const humaniser = (eventType: string): DescriptionEvenement => {
  const nom = (eventType || '')
    .replace(/^xpark\./, '')
    .replace(/[.\-_]/g, ' ')
    .trim()
  const titre = nom.charAt(0).toUpperCase() + nom.slice(1)
  return {
    titre: titre || 'Événement d’exploitation',
    quoi: 'Un événement d’exploitation a été enregistré par la plateforme.',
    pourquoi: 'Il découle d’une opération réalisée dans un module de la plateforme.',
    impact: 'À évaluer selon le niveau de priorité indiqué.',
    action: 'Consulter le module concerné pour en vérifier les conséquences.',
    icone: 'tabler:info-circle', couleur: 'secondary',
  }
}

export const decrireEvenement = (eventType: string): DescriptionEvenement =>
  EVENEMENTS[eventType] ?? humaniser(eventType)

/** Gravité : LOW / MEDIUM / HIGH → langage métier. */
export const GRAVITE: Record<string, { label: string; couleur: string }> = {
  LOW:      { label: 'Faible',    couleur: 'secondary' },
  MEDIUM:   { label: 'Moyenne',   couleur: 'warning' },
  HIGH:     { label: 'Élevée',    couleur: 'danger' },
  CRITICAL: { label: 'Critique',  couleur: 'danger' },
}

/** Priorité de traitement (classification interne) → langage métier. */
export const PRIORITE: Record<string, { label: string; couleur: string }> = {
  INFO:      { label: 'Pour information',   couleur: 'secondary' },
  NORMAL:    { label: 'À suivre',           couleur: 'info' },
  IMPORTANT: { label: 'Important',          couleur: 'warning' },
  CRITIQUE:  { label: 'Traitement immédiat', couleur: 'danger' },
}

/** Origine de l'événement → module métier. */
export const ORIGINE: Record<string, string> = {
  internal:       'Assistant d’exploitation',
  MissionService: 'Missions',
  FleetService:   'Parc de véhicules',
  MaintenanceService: 'Maintenance',
  FinanceService: 'Facturation',
  IAMService:     'Comptes et accès',
  TestConsole:    'Test interne',
}

export const libelleOrigine = (source?: string) =>
  ORIGINE[source ?? ''] ?? (source || 'Plateforme')

/**
 * Extrait du contenu technique les seules références utiles à un exploitant
 * (mission, véhicule, chauffeur, client, montant…), en ignorant les champs
 * d'implémentation (identifiants de lot, temps d'exécution, versions…).
 */
const CHAMPS_METIER: { cles: string[]; label: string }[] = [
  { cles: ['missionId', 'idMission', 'mission_id'],            label: 'Mission' },
  { cles: ['vehiculeId', 'vehicleId', 'idVehicule'],           label: 'Véhicule' },
  { cles: ['immatriculation', 'plate', 'registration'],        label: 'Immatriculation' },
  { cles: ['employeeId', 'chauffeurId', 'driverId'],           label: 'Chauffeur' },
  { cles: ['chauffeurNom', 'driverName'],                      label: 'Nom du chauffeur' },
  { cles: ['clientId', 'clientIdUtilisateur'],                 label: 'Client' },
  { cles: ['clientNom', 'clientName'],                         label: 'Nom du client' },
  { cles: ['villeDepart', 'origin', 'depart'],                 label: 'Départ' },
  { cles: ['villeArrivee', 'destination', 'arrivee'],          label: 'Destination' },
  { cles: ['montant', 'amount', 'cout', 'coutTotal'],          label: 'Montant' },
  { cles: ['distance', 'distanceKm'],                          label: 'Distance' },
  { cles: ['missionsCount', 'nbMissions', 'assignmentsCount'], label: 'Missions concernées' },
  { cles: ['raison', 'reason', 'motif'],                       label: 'Motif' },
  { cles: ['statut', 'status'],                                label: 'Statut' },
]

export interface ReferenceMetier { label: string; valeur: string }

export const referencesMetier = (data: unknown): ReferenceMetier[] => {
  if (!data || typeof data !== 'object') return []
  const obj = data as Record<string, unknown>
  const out: ReferenceMetier[] = []
  for (const { cles, label } of CHAMPS_METIER) {
    const cle = cles.find(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
    if (!cle) continue
    const v = obj[cle]
    if (typeof v === 'object') continue
    out.push({ label, valeur: String(v) })
  }
  return out
}
