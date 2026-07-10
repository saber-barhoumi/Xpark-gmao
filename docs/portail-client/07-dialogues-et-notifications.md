# 💬 Dialogues & notifications — remplacement des alertes natives

## Le problème (bug UI/UX signalé)

Les pages du portail utilisaient `window.confirm()` / `window.alert()` : le navigateur
affichait une boîte grise « localhost:3001 indique… » — non professionnelle, non stylée,
impossible à mettre à la charte.

Cas concernés :
| Page | Ancien comportement |
|---|---|
| `/account/security` | `window.confirm("Désactiver l'Authenticator ? …")` |
| `/account/missions` | `window.confirm("Annuler cette réservation ? …")` + `window.alert(erreur)` |
| `/account/documents` | `alert("Autorisez les fenêtres pop-up…")` |

## La solution

### Nouveau composant : `components/portal/Feedback.js`

Deux hooks réutilisables, à la charte XPARK (rouge `#C11425`, variables du portail,
dark mode automatique) :

```jsx
// 1. Dialogue de confirmation (remplace window.confirm) — API en promesse
const [confirm, confirmDialog] = useConfirm()

const ok = await confirm({
    title: "Désactiver l'Authenticator ?",
    message: "Votre compte sera moins protégé…",
    confirmLabel: "Désactiver",
    cancelLabel: "Garder activé",
    danger: true,      // bouton rouge
    icon: "🔓",
})
if (!ok) return
// … action confirmée

// 2. Toast (remplace window.alert pour l'information)
const [toast, toastNode] = useToast()
toast("Annulation impossible…", "error")   // "success" | "error" | "info"
```

`confirmDialog` et `toastNode` se rendent une seule fois dans le JSX de la page :

```jsx
return (
    <ClientPortalLayout title="…">
        {confirmDialog}
        {toastNode}
        …
    </ClientPortalLayout>
)
```

### Bonnes pratiques intégrées

- **Dialogue** : overlay flouté, carte centrée animée, icône contextuelle, action
  destructive en rouge, fermeture par Échap / clic hors du dialogue / « Annuler »,
  `role="dialog"` + `aria-modal` (accessibilité) ;
- **Toast** : en bas de l'écran, disparition automatique (4,5 s), fermeture manuelle ✕,
  `role="status"` + `aria-live="polite"`, 3 variantes colorées ;
- **API en promesse** : `await confirm(...)` remplace `window.confirm` ligne à ligne —
  migration triviale des pages existantes et futures.

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `components/portal/Feedback.js` | **Nouveau** — `useConfirm()` + `useToast()` |
| `app/account/security/page.js` | Confirmation stylée pour la désactivation MFA |
| `app/account/missions/page.js` | Confirmation d'annulation + toast d'erreur |
| `app/account/documents/page.js` | Toast si pop-up bloquée |
| `lib/documentTemplates.js` | `openDocument()` retourne `false` au lieu d'appeler `alert()` |

## Règle pour la suite

**Ne plus jamais utiliser `window.alert` / `window.confirm`** dans le frontoffice :
importer `useConfirm` / `useToast` depuis `components/portal/Feedback`.

## Comment tester

1. `/account/security` → « Désactiver » l'Authenticator → dialogue XPARK (plus de boîte navigateur).
2. `/account/missions` → « Annuler » une réservation en attente → dialogue rouge « Oui, annuler ».
3. Provoquer une erreur d'annulation (mission déjà affectée) → toast rouge en bas.
4. Bloquer les pop-ups puis ouvrir un document → toast rouge explicite.
