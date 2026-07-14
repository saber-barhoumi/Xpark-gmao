/**
 * Stockage de session multiplateforme.
 *
 * expo-secure-store est NATIF (Keychain iOS / Keystore Android) et n'existe pas
 * sur le web. On l'utilise sur mobile (chiffré) et on retombe sur localStorage
 * sur le web (le web n'a de toute façon pas de stockage sécurisé équivalent).
 * L'AuthContext ne dépend ainsi d'aucune API spécifique à une plateforme.
 */
import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"

const isWeb = Platform.OS === "web"

export const sessionStore = {
    async get(key: string): Promise<string | null> {
        if (isWeb) {
            try { return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null } catch { return null }
        }
        return SecureStore.getItemAsync(key)
    },
    async set(key: string, value: string): Promise<void> {
        if (isWeb) {
            try { localStorage.setItem(key, value) } catch { /* ignore */ }
            return
        }
        await SecureStore.setItemAsync(key, value)
    },
    async del(key: string): Promise<void> {
        if (isWeb) {
            try { localStorage.removeItem(key) } catch { /* ignore */ }
            return
        }
        await SecureStore.deleteItemAsync(key)
    },
}
