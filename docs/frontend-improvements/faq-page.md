# Page FAQ — `/pages/faq`

## Avant

- Contenu de **template sans rapport** avec XPARK : « session tracking
  dashboard », Payment, Shipping, Return.
- Simple liste d'accordéons + navigation d'ancres, sans recherche.
- Formulaire de contact (`Question.tsx`) en **anglais**, `onClick` au lieu de
  `onSubmit`, sans retour utilisateur.

## Après

Une **expérience FAQ moderne** :

- **Hero** avec titre, sous-titre et **recherche instantanée** (surlignage du
  terme trouvé, compteur de résultats).
- **Filtres par catégorie** (Tout + 4 catégories) avec compteur.
- **Accordéon par catégorie** ; en mode recherche, ouverture multiple
  (`alwaysOpen`) pour voir tous les résultats.
- **Contenu XPARK réel** réorganisé en 4 catégories : Général, Gestion de
  flotte, Compte & sécurité, Technique.
- **Section contact / aide** : coordonnées + formulaire « Poser une question »
  (traduit en FR, validation FR, retour de succès).
- **Empty state** quand aucune question ne correspond.

## Explication technique

- **Fichiers** : `data.ts` (contenu structuré `faqCategories` +
  `contactDetails`), `components/Faqs.tsx` (hero + recherche + filtres +
  accordéon + contact), `components/Question.tsx` (formulaire FR).
- **Modèle** : `FaqCategory { key, label, icon, items: FaqItem[] }`.
- **Filtrage** : `useMemo` combine l'onglet actif et la recherche, ne garde
  que les catégories non vides ; `highlight()` surligne le terme.
- **Design conservé** : cartes, accordéon React-Bootstrap, `IconifyIcon`,
  classes `bg-soft-*`, dégradé cohérent avec le reste.

## Intégration backend future

Le contenu est éditorial : il peut rester dans `data.ts` ou provenir d'un CMS
/ endpoint `/faq`. Le formulaire de contact marque le point de branchement
vers le module **Support** (création de ticket).
