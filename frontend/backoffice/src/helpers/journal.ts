/**
 * Traces de diagnostic (connexion temps réel, extraction OCR…).
 *
 * Elles rendent service pendant le développement mais n'ont rien à faire dans
 * la console d'un utilisateur : elles y révèlent le fonctionnement interne et
 * peuvent laisser filtrer le contenu des documents analysés.
 *
 * `import.meta.env.DEV` est remplacé par une constante à la compilation : dans
 * le bundle de production la condition est toujours fausse et les appels sont
 * purement et simplement éliminés.
 *
 * Les vraies erreurs continuent d'utiliser `console.error` — elles doivent
 * rester visibles partout.
 */
export const trace = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.info(...args)
}
