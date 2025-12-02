# 📅 Kalendary - Vercel Edition

Un'app per la gestione del tempo e delle attività con AI integrata.

> ⚡ Questa versione è ottimizzata per il deploy su Vercel con PostgreSQL

---

## 🚀 Quick Deploy su Vercel

### Prerequisiti
- Account [Vercel](https://vercel.com)
- Repository GitHub/GitLab con questo codice

### Step 1: Deploy su Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Clicca su **"Add New Project"**
2. Importa il repository
3. Vercel rileverà automaticamente Next.js

### Step 2: Aggiungi Postgres Database

1. Vai su **Storage** > **Create Database** > **Postgres**
2. Scegli un nome (es. `kalendary-db`)
3. Seleziona la regione `fra1` (Europa)
4. Clicca **Create**
5. Vai su **Connect** e collega al progetto

Le variabili d'ambiente PostgreSQL verranno aggiunte automaticamente!

### Step 3: Aggiungi JWT_SECRET

Vai su **Settings** > **Environment Variables** e aggiungi:

| Variable | Valore |
|----------|--------|
| `JWT_SECRET` | Una stringa casuale di almeno 32 caratteri |

> 💡 Per generare JWT_SECRET: `openssl rand -base64 32`

### Step 4: Redeploy

Dopo aver configurato le variabili, fai un nuovo deploy:
- Vai su **Deployments** > clicca sui 3 puntini > **Redeploy**

🎉 **Fatto!** L'app sarà disponibile al tuo URL Vercel.

---

## 🛠️ Sviluppo Locale (con Vercel Postgres)

```bash
# Clona il repo
git clone <repo-url>
cd kalendary-vercel

# Installa dipendenze
npm install

# Installa Vercel CLI
npm i -g vercel

# Collega al progetto Vercel e scarica le variabili d'ambiente
vercel link
vercel env pull .env.local

# Aggiungi JWT_SECRET manualmente a .env.local
echo 'JWT_SECRET="your-secret-key-here"' >> .env.local

# Avvia in dev mode
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## ✨ Features

- 📅 **Calendario interattivo** con drag & drop
- ✅ **Gestione attività** con completamento e streak
- 🎯 **Obiettivi personali** e tracking progressi
- 🎨 **Tema chiaro/scuro** automatico
- 📱 **PWA ready** - installabile su mobile
- 🔐 **Autenticazione** con JWT
- 🤖 **AI Suggestions** (opzionale)

---

## 📁 Struttura Progetto

```
kalendary-vercel/
├── app/
│   ├── api/           # API Routes
│   │   ├── activities/
│   │   ├── auth/
│   │   └── user/
│   ├── page.tsx       # Homepage
│   └── layout.tsx     # Layout principale
├── components/
│   ├── sections/      # Sezioni dell'app
│   └── ...
├── lib/
│   ├── db-adapter.ts  # Database PostgreSQL
│   ├── auth.ts        # JWT Auth
│   └── store.ts       # Zustand store
└── public/
```

---

## 🔧 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Vercel Postgres
- **Auth**: JWT + bcrypt
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion

---

## 🔒 Environment Variables

| Variable | Descrizione | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | Connection string PostgreSQL | ✅ |
| `JWT_SECRET` | Secret per JWT tokens (min 32 chars) | ✅ |
| `LM_STUDIO_URL` | URL LM Studio (per AI features) | ❌ |
| `OPENAI_API_KEY` | OpenAI API key (alternativa) | ❌ |

---

## 📝 Note Importanti

### Database
Il database viene inizializzato automaticamente al primo avvio. Le tabelle vengono create se non esistono.

### Migrazione da SQLite
Se avevi la versione con SQLite, i dati NON vengono migrati automaticamente. Questa è una versione pulita per Vercel.

### Performance
- Region consigliata: `fra1` (Frankfurt) per utenti EU
- Memory functions: 1024 MB
- Max duration: 30s

---

## 🐛 Troubleshooting

### "relation does not exist"
Il database non è stato inizializzato. Fai una chiamata API qualsiasi per triggerare l'init automatico.

### "JWT_SECRET not found"
Aggiungi la variabile `JWT_SECRET` nelle Environment Variables di Vercel.

### Build fails
Verifica che non ci siano reference a `better-sqlite3` nel codice.

---

## 📄 License

MIT

---

**Made with ❤️ for Vercel**
