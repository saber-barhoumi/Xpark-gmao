#!/usr/bin/env python3
"""
Script de diagnostic pour problèmes de connexion XPARK GMAO
Usage: python diagnose_login.py sabersalemaicha@gmail.com
"""
import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000/api/auth"

def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def check_user_status(email):
    """Vérifier le statut de l'utilisateur"""
    print_section("ÉTAPE 1 : Vérification du compte")
    
    try:
        response = requests.get(f"{BASE_URL}/diagnostic/check-email/{email}", timeout=5)
        
        if response.status_code == 404:
            print(f"❌ ERREUR : L'email '{email}' n'existe pas dans la base de données")
            print("   → Créez d'abord un compte avec cet email")
            return None
        
        user = response.json()
        
        print(f"✅ Utilisateur trouvé : {user['nom']} {user['prenom']}")
        print(f"   Email          : {user['email']}")
        print(f"   Actif          : {'✅ Oui' if user['actif'] else '❌ Non'}")
        print(f"   Email confirmé : {'✅ Oui' if user['emailConfirmed'] else '❌ Non'}")
        print(f"   Mot de passe   : {'✅ Défini' if user['hasPassword'] else '❌ Non défini'}")
        print(f"   Tentatives     : {user['failedLoginAttempts']}/5")
        
        if user['isLocked']:
            locked_until = user['accountLockedUntil']
            print(f"   🔒 VERROUILLÉ  : Jusqu'à {locked_until}")
        else:
            print(f"   🔓 Déverrouillé : Peut se connecter")
        
        if user['lastLogin']:
            print(f"   Dernière conn. : {user['lastLogin']}")
        
        return user
    
    except Exception as e:
        print(f"❌ ERREUR : {e}")
        return None

def test_password(email, password):
    """Tester un mot de passe"""
    print_section(f"ÉTAPE 2 : Test du mot de passe '{password}'")
    
    try:
        data = {"email": email, "password": password}
        response = requests.post(f"{BASE_URL}/diagnostic/test-login", json=data, timeout=5)
        result = response.json()
        
        if result.get('passwordMatch'):
            print(f"✅ MOT DE PASSE CORRECT !")
            print(f"   Le mot de passe '{password}' fonctionne")
        else:
            print(f"❌ Mot de passe incorrect")
            print(f"   Le mot de passe '{password}' ne correspond pas")
        
        print(f"\n   Peut se connecter : {'✅ OUI' if result.get('canLogin') else '❌ NON'}")
        
        if not result.get('canLogin'):
            print(f"\n   Raisons bloquantes :")
            if not result.get('actif'):
                print(f"     - Compte inactif")
            if not result.get('emailConfirmed'):
                print(f"     - Email non confirmé")
            if result.get('isLocked'):
                print(f"     - Compte verrouillé jusqu'à {result.get('lockedUntil')}")
        
        return result
    
    except Exception as e:
        print(f"❌ ERREUR : {e}")
        return None

def unlock_account(email):
    """Déverrouiller le compte"""
    print_section("ÉTAPE 3 : Déverrouillage du compte")
    
    try:
        response = requests.post(f"{BASE_URL}/diagnostic/unlock-account/{email}", timeout=5)
        result = response.json()
        
        print(f"✅ {result['message']}")
        print(f"   Tentatives échouées : {result['failedLoginAttempts']}")
        print(f"   Verrouillage        : {result['accountLockedUntil'] or 'Aucun'}")
        
        return True
    
    except Exception as e:
        print(f"❌ ERREUR : {e}")
        return False

def reset_password(email, new_password):
    """Réinitialiser le mot de passe"""
    print_section(f"ÉTAPE 4 : Réinitialisation du mot de passe → '{new_password}'")
    
    try:
        data = {"newPassword": new_password}
        response = requests.post(
            f"{BASE_URL}/diagnostic/reset-password/{email}", 
            json=data, 
            timeout=5
        )
        result = response.json()
        
        print(f"✅ {result['message']}")
        print(f"   Email           : {result['email']}")
        print(f"   Nouveau mot de passe : {result['newPassword']}")
        print(f"   ⚠️  {result['warning']}")
        
        return True
    
    except Exception as e:
        print(f"❌ ERREUR : {e}")
        return False

def test_login_real(email, password):
    """Tester le vrai login"""
    print_section(f"ÉTAPE 5 : Test du login réel")
    
    try:
        data = {"email": email, "password": password}
        response = requests.post(f"{BASE_URL}/login", json=data, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ LOGIN RÉUSSI !")
            print(f"   Token reçu : {result.get('token', '')[:30]}...")
            print(f"   Utilisateur : {result.get('prenom')} {result.get('nom')}")
            print(f"   Rôle : {result.get('role')}")
            return True
        else:
            error = response.json()
            print(f"❌ LOGIN ÉCHOUÉ")
            print(f"   Status : {response.status_code}")
            print(f"   Message : {error.get('message', 'Erreur inconnue')}")
            return False
    
    except Exception as e:
        print(f"❌ ERREUR : {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python diagnose_login.py <email>")
        print("Exemple: python diagnose_login.py sabersalemaicha@gmail.com")
        sys.exit(1)
    
    email = sys.argv[1]
    
    print("\n" + "🔍" * 35)
    print(f"  DIAGNOSTIC DE CONNEXION - XPARK GMAO")
    print(f"  Email : {email}")
    print(f"  Date  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🔍" * 35)
    
    # 1. Vérifier le statut
    user = check_user_status(email)
    if not user:
        return
    
    # 2. Si verrouillé, déverrouiller
    if user.get('isLocked'):
        unlock_account(email)
    
    # 3. Tester des mots de passe courants
    passwords_to_test = ["test123", "20977200", "password", "Admin@123"]
    
    for pwd in passwords_to_test:
        result = test_password(email, pwd)
        if result and result.get('passwordMatch'):
            # Mot de passe trouvé !
            print_section("🎉 SOLUTION TROUVÉE")
            print(f"   Le bon mot de passe est : '{pwd}'")
            
            # Tester le login réel
            test_login_real(email, pwd)
            return
    
    # 4. Aucun mot de passe ne fonctionne - proposer de réinitialiser
    print_section("💡 SOLUTION PROPOSÉE")
    print(f"   Aucun des mots de passe testés ne fonctionne.")
    print(f"   Réinitialisation recommandée.")
    
    response = input("\n   Voulez-vous réinitialiser le mot de passe à 'test123' ? (o/n) : ")
    
    if response.lower() == 'o':
        if reset_password(email, "test123"):
            print("\n   Essayons maintenant de nous connecter...")
            test_login_real(email, "test123")
    
    print_section("FIN DU DIAGNOSTIC")

if __name__ == "__main__":
    main()
