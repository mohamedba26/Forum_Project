# Forum Multimédia — Guide de démarrage

## Stack technique

| Couche         | Technologie                                |
|----------------|--------------------------------------------|
| Frontend       | React 18 + Vite + TailwindCSS              |
| Backend        | Node.js + Express                          |
| Base de données| PostgreSQL + Prisma ORM                    |
| Temps réel     | Socket.IO (chat privé)                     |
| Médias         | Cloudinary (images, audio, vidéo)          |
| Auth           | JWT + bcrypt                               |

---

## 1. Prérequis

- Node.js 18+
- PostgreSQL 14+
- Compte Cloudinary (gratuit sur cloudinary.com)

---

## 2. Installation du Frontend

```bash
cd forum-multimedia
npm install
```

---

## 3. Installation du Backend

```bash
cd server
npm install

# Copier les variables d'environnement
cp .env.example .env
# Remplir DATABASE_URL, JWT_SECRET, et les clés Cloudinary dans .env
```

---

## 4. Base de données

```bash
# Dans /server
npx prisma migrate dev --name init
npm run db:seed   # Crée les comptes de test et données initiales
```

**Comptes créés par le seed :**
| Rôle        | Email               | Mot de passe |
|-------------|---------------------|--------------|
| Admin       | admin@forum.com     | admin123     |
| Modérateur  | modo@forum.com      | modo123      |
| Utilisateur | user@forum.com      | user123      |

---

## 5. Démarrage

### Backend
```bash
cd server
npm run dev    # Port 5000
```

### Frontend
```bash
cd forum-multimedia
npm run dev    # Port 3000
```

Ouvrir : http://localhost:3000

---

## Structure du projet

```
forum-multimedia/
├── src/
│   ├── components/
│   │   ├── layout/        # Navbar, Sidebar, Layout
│   │   └── forum/         # NewPosteModal, ReportModal
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── AuthPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── SujetPage.jsx
│   │   ├── PostePage.jsx
│   │   ├── ProposerSujetPage.jsx
│   │   ├── MesPostesPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── AdminPage.jsx
│   │   └── ModeratorPage.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── forumService.js
│   │   ├── adminService.js
│   │   └── socketService.js
│   └── utils/
│       └── helpers.js
│
└── server/
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── index.js          # Point d'entrée Express + Socket.IO
        ├── socket.js         # Logique chat temps réel
        ├── seed.js
        ├── middleware/
        │   ├── auth.js       # JWT + rôles
        │   └── upload.js     # Multer + Cloudinary
        └── routes/
            ├── auth.js
            ├── sujets.js
            ├── postes.js
            ├── admin.js
            └── reports.js
```

---

## Fonctionnalités par rôle

### Utilisateur (anonyme)
- ✅ S'inscrire avec pseudo anonyme
- ✅ Proposer un sujet (→ validé par admin)
- ✅ Créer des posts (texte, image, audio, vidéo)
- ✅ Commenter (texte, image, audio, vidéo)
- ✅ Chat privé avec un autre utilisateur
- ✅ Reporter un utilisateur ou commentaire
- ✅ Gérer ses propres posts

### Modérateur
- ✅ Valider / Supprimer les posts du sujet assigné
- ✅ Supprimer les commentaires
- ✅ Reporter des utilisateurs

### Admin
- ✅ Gérer tous les utilisateurs (bloquer, chercher)
- ✅ Valider / Refuser les sujets proposés
- ✅ Attribuer / Retirer le rôle modérateur
- ✅ Traiter les rapports

---

## Cloudinary — Configuration

1. Créer un compte sur https://cloudinary.com
2. Copier `Cloud Name`, `API Key`, `API Secret`
3. Les mettre dans `server/.env`

Les médias (images, audio, vidéo) seront automatiquement uploadés sur Cloudinary.
