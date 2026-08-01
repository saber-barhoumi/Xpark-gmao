export interface FaqItem {
  question: string
  answer:   string
}

export interface FaqCategory {
  key:   string
  label: string
  icon:  string
  items: FaqItem[]
}

/**
 * Contenu FAQ de la plateforme XPARK GMAO, organisé par catégories métier.
 * Remplace le contenu générique du template (session tracking / shipping /
 * returns) par des questions réellement pertinentes pour les utilisateurs.
 */
export const faqCategories: FaqCategory[] = [
  {
    key: 'general', label: 'Général', icon: 'tabler:help-circle',
    items: [
      { question: 'Qu\'est-ce que la plateforme XPARK GMAO ?',
        answer: 'XPARK GMAO est une solution de gestion de flotte et de maintenance assistée par ordinateur pour les sociétés de transport. Elle réunit dans un seul système la gestion des véhicules, des missions, de la maintenance, de la facturation et du suivi GPS en temps réel.' },
      { question: 'Comment la plateforme est-elle organisée ?',
        answer: 'XPARK couvre les grands métiers du transport : comptes et accès, parc de véhicules, missions, maintenance, facturation, alertes et messagerie. Trois espaces y accèdent : un back-office pour les gestionnaires, un portail pour les clients et une application mobile pour les chauffeurs.' },
      { question: 'Qui peut utiliser XPARK GMAO ?',
        answer: 'Les administrateurs et gestionnaires pilotent la flotte depuis le back-office, les chauffeurs utilisent l\'application mobile, et les clients suivent leurs demandes et livraisons depuis le portail client.' },
      { question: 'La plateforme est-elle disponible en plusieurs langues ?',
        answer: 'L\'assistant Ayshaa du site vitrine répond en français, anglais et arabe dialectal (darija). L\'interface de gestion est en français.' },
    ],
  },
  {
    key: 'flotte', label: 'Gestion de flotte', icon: 'tabler:truck',
    items: [
      { question: 'Comment ajouter un véhicule à la flotte ?',
        answer: 'Depuis Gestion → Véhicules, cliquez sur « Nouveau véhicule » et renseignez l\'immatriculation, la marque, le modèle et les caractéristiques. La carte grise et l\'assurance peuvent être scannées par OCR pour un remplissage automatique.' },
      { question: 'Comment sont créées et affectées les missions ?',
        answer: 'Une mission naît d\'une demande de transport (devis) acceptée par le client. Elle reste « en attente » jusqu\'à ce que l\'optimisateur de flotte, ou un gestionnaire, lui affecte un chauffeur et un véhicule disponibles.' },
      { question: 'Comment fonctionne la maintenance ?',
        answer: 'Les interventions (préventives ou curatives) et les ordres de travail sont suivis par véhicule. Le module de maintenance prédictive estime en plus les pannes à venir par organe et propose des dates d\'intervention.' },
      { question: 'Puis-je suivre mes véhicules en temps réel ?',
        answer: 'Oui. L\'application chauffeur remonte la position GPS en arrière-plan ; le back-office et le client visualisent le trajet en direct sur une carte, avec l\'historique des positions.' },
    ],
  },
  {
    key: 'compte', label: 'Compte & sécurité', icon: 'tabler:shield-lock',
    items: [
      { question: 'Comment sont gérés les utilisateurs et les rôles ?',
        answer: 'La gestion des utilisateurs se fait depuis le module Administration. Chaque compte porte un rôle (Administrateur, Gestionnaire, Technicien, RH, Chauffeur, Client) qui détermine précisément les pages et actions accessibles.' },
      { question: 'Comment fonctionnent les permissions (RBAC) ?',
        answer: 'Les autorisations sont basées sur les rôles : chaque route et chaque action sensible vérifie le rôle de l\'utilisateur, côté back-office comme côté API. Un accès non autorisé est refusé avec un message clair.' },
      { question: 'Mes données sont-elles sécurisées ?',
        answer: 'L\'authentification repose sur des jetons JWT signés, les mots de passe sont hachés (BCrypt) et une authentification à deux facteurs (TOTP ou code par e-mail) peut être activée pour renforcer la connexion.' },
      { question: 'J\'ai oublié mon mot de passe, que faire ?',
        answer: 'Utilisez le lien « Mot de passe oublié » sur la page de connexion pour recevoir un lien de réinitialisation, ou contactez votre administrateur qui peut réinitialiser votre accès.' },
    ],
  },
  {
    key: 'technique', label: 'Technique', icon: 'tabler:settings',
    items: [
      { question: 'D\'où proviennent les données affichées ?',
        answer: 'Chaque écran lit les informations directement dans votre base XPARK. Les données (véhicules, missions, factures, alertes…) sont toujours réelles et à jour ; rien n\'est simulé dans l\'interface.' },
      { question: 'La plateforme s\'intègre-t-elle à d\'autres outils ?',
        answer: 'Oui. XPARK est organisée par domaine métier et met ses données à disposition de façon sécurisée, ce qui permet de la connecter à vos outils existants (comptabilité, ERP, télématique) ou d\'ajouter de nouveaux modules.' },
      { question: 'Comment fonctionne l\'assistant IA ?',
        answer: 'L\'assistant Ayshaa s\'appuie sur la documentation de la plateforme et sur vos données en temps réel pour répondre aux questions sur la flotte, les missions, les tarifs et les analyses.' },
      { question: 'Comment obtenir de l\'aide technique ?',
        answer: 'Ouvrez un ticket depuis le module Support, ou utilisez le formulaire de contact ci-dessous. L\'équipe technique traite les demandes selon leur priorité.' },
    ],
  },
]

/** Coordonnées d'aide affichées dans la section contact. */
export type ContactDetailsType = { icon: string; title: string; description: string }

export const contactDetails: ContactDetailsType[] = [
  { icon: 'tabler:mail',  title: 'E-mail',        description: 'support@xpark.tn' },
  { icon: 'tabler:phone', title: 'Téléphone',     description: '+216 71 000 000' },
  { icon: 'tabler:clock', title: 'Disponibilité', description: 'Lun–Ven, 8h–18h' },
]
