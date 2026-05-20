# Setlist Metrônomo

Metrônomo PWA sincronizado com setlist — com subdivisões, acentos personalizados, Modo Show fullscreen, Wake Lock e instalação como app nativo no Mac, Windows, iOS e Android.

## Stack
- **Frontend**: React 19 (CRA) + Tailwind v3 + shadcn/ui + Web Audio API
- **Backend**: FastAPI + Motor (MongoDB) — template, não usado pela app (setlist é local)
- **PWA**: manifest + Service Worker offline-first

## Como rodar localmente

### Pré-requisitos
- Node.js 18+ e Yarn (`npm i -g yarn`)
- Python 3.11+ e pip
- MongoDB (opcional — backend é template; app funciona sem ele)

### 1) Backend (opcional)
```bash
cd backend
pip install -r requirements.txt
# Crie um .env com:
#   MONGO_URL=mongodb://localhost:27017
#   DB_NAME=setlist_metronome
#   CORS_ORIGINS=*
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 2) Frontend
```bash
cd frontend
yarn install
# Crie um .env com:
#   REACT_APP_BACKEND_URL=http://localhost:8001
#   WDS_SOCKET_PORT=443
yarn start
```
Abra `http://localhost:3000` no Chrome/Edge.

## Como instalar como app nativo (Mac/Windows/iOS/Android)
Veja **`INSTALL.md`** para guia passo-a-passo.

## Estrutura do código
```
frontend/
├── public/
│   ├── manifest.json        # PWA manifest com 6 ícones
│   ├── sw.js                # Service Worker offline
│   ├── logo.png             # Logo do header
│   ├── icon-{192,512}.png   # Ícones PWA
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png
│   ├── favicon{,-32,-64}.{png,ico}
│   └── index.html
└── src/
    ├── App.js               # Rota única
    ├── index.css            # Tema mostarda escuro + animações
    ├── types.js             # TIME_SIGNATURES, MUSICAL_KEYS, SUBDIVISIONS
    ├── pages/
    │   └── Home.jsx         # Página principal; useMetronome (elevado), atalhos S/Space/←→/↑↓
    ├── components/
    │   ├── Metronome.jsx    # BPM, slider, tap tempo, play, accent editor
    │   ├── SetlistPanel.jsx # CRUD, drag-and-drop, export/import .setlist
    │   ├── SongForm.jsx     # Form com validação + acentos por batida
    │   ├── AccentEditor.jsx # Botões clicáveis cycling mute/normal/accent
    │   ├── ShowMode.jsx     # Tela cheia para palco — sem navegação interna
    │   └── ui/              # shadcn components (Button, Dialog, Select…)
    └── hooks/
        ├── useMetronome.js  # Scheduler Web Audio com lookahead adaptativo
        ├── useSetlist.js    # CRUD + export/import (sem persistência local)
        └── useWakeLock.js   # Screen wake lock durante reprodução

backend/
├── server.py                # FastAPI template
├── requirements.txt
└── tests/
    └── test_backend.py

memory/
└── PRD.md                   # Documento de requisitos / histórico

INSTALL.md                   # Guia de instalação PWA
```

## Features
- Metrônomo BPM 30–300 com slider, ±1/±5/±10, tap tempo (até 8 taps)
- Compassos: 1/4, 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 12/8
- Subdivisões: tempo, colcheias, tercinas, semicolcheias
- Acentos por batida: mute (0), normal (1), acento (2) — clique cicla
- 24 tons disponíveis (12 maiores + 12 menores incluindo todos os sustenidos/bemóis)
- Setlist com CRUD, drag-and-drop, export/import `.setlist` (JSON)
- Modo Show fullscreen com fontes gigantes para palco
- Wake Lock — tela não dorme durante reprodução
- Click contínuo entre Home ↔ Show Mode (sem reset de timing)
- Atalhos: `Espaço` play/pause, `↑↓` navegar setlist, `←→` BPM, `S` Modo Show, `ESC` sair
- Resistente a aba em segundo plano (lookahead adaptativo + silent keep-alive)
- PWA instalável (Mac/Windows/iOS/Android)

## Atalhos no Modo Show
- `Espaço` — Tocar / Pausar
- `←` `→` — BPM −1 / +1
- `ESC` — Sair

## Persistência
Setlists são em memória — a app sempre inicia em branco. Use **Exportar** (botão de download) para salvar setlists `.setlist` e **Importar** (botão upload) para carregar.
