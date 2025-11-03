# News Platform with Fake News Detection

Ce projet se compose de deux parties :
1. `fake-news-agent-BO2` : Backend Python pour la détection de fake news
2. `news-platform-amin` : Frontend Next.js pour l'interface utilisateur

## 1. Installation du Backend (fake-news-agent-BO2)

```bash
# Aller dans le dossier backend
cd fake-news-agent-BO2

# Créer un environnement virtuel Python
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows :
.\venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

## 2. Installation du Frontend (news-platform-amin)

```bash
# Aller dans le dossier frontend
cd news-platform-amin

# Installer les dépendances avec npm
npm install --legacy-peer-deps
```

## 3. Configuration

### Backend
1. Vérifiez que tous les fichiers de modèles nécessaires sont présents dans le dossier approprié
2. Si nécessaire, créez un fichier `.env` dans `fake-news-agent-BO2` avec les variables requises

### Frontend
1. Créez un fichier `.env.local` dans `news-platform-amin`

## 4. Lancer le Projet

### Démarrer le Backend
```bash
# Dans le dossier fake-news-agent-BO2 (avec venv activé)
python api.py
```
Le serveur backend démarrera sur http://localhost:5000

### Démarrer le Frontend
```bash
# Dans le dossier news-platform-amin
npm run dev

Le frontend sera accessible sur http://localhost:3000

## 5. Vérification

1. Ouvrez http://localhost:3000 dans votre navigateur
2. Vérifiez que vous pouvez voir l'interface utilisateur
3. Testez la vérification des sources en cliquant sur le bouton "Verify Source"
4. Vérifiez que les requêtes API fonctionnent (le backend doit être en cours d'exécution)

