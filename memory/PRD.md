# Setlist Metrônomo — PRD

## Original Problem Statement
"vamos continuar com a construção dessa app" — usuário enviou o zip `Setlist-Metronome-Enhancer.zip` (projeto Replit pnpm/Express/PostgreSQL/Replit-Auth).

## User Choices
- Stack: migrar para Emergent (React + FastAPI + MongoDB).
- Auth: nenhuma.
- Persistência: **nenhuma** — setlist sempre em branco ao abrir.
- Features base: a + b + c + f + g + h + k.
- Layout: setlist à esquerda, metrônomo à direita, sem scroll.
- Tipografia: nome da música/tom 3 níveis maiores.
- Performance: metrônomo em segundo plano + Wake Lock durante reprodução.
- Show Mode: popup de navegação ao clicar nas setas, auto-some em 5s sem interação.
- Atalho `S` para abrir Modo Show.
- **Logo PNG do metrônomo** aplicado em todos os ícones (header, manifest PWA, favicon, apple-touch-icon, dock/taskbar).
- App entregue para instalação Mac/Windows via **PWA**.

## Personas
Músicos solo / bandas em ensaio ou show ao vivo — precisam de metrônomo confiável, setlist visível à distância (palco), tela sempre acesa e popup rápido para trocar de música.

## Core Requirements
- UI em PT-BR, tema mostarda escuro, sem emojis.
- Web Audio scheduler com lookahead adaptativo (0.25s normal, 1.5s em background) + silent keep-alive.
- Setlist em memória (não persiste entre sessões).
- PWA instalável e offline-capable com 6 ícones (32/64/180/192/512/maskable).
- Wake Lock + Fullscreen + atalhos de teclado.

## Architecture
- **Frontend**: React 19 (CRA) + Tailwind v3 + shadcn/ui.
- **Backend**: FastAPI template (`GET /api/`) — não consumido pela app.
- **PWA**: `/manifest.json`, `/sw.js` (cache `setlist-metronome-v2`).
- **Audio**: Web Audio + setTimeout scheduler + silent buffer loop.

## What's been implemented

### Iteração 1 — MVP
- Metrônomo BPM 30–300, slider, chevrons ±1/±5/±10, tap tempo.
- Compassos 1/4 a 12/8, subdivisões (tempo/colcheia/tercina/semicolcheia), acentos mute/normal/accent.
- CRUD setlist + drag-and-drop + export/import `.setlist`.

### Iteração 2 — Refinos
- Layout lado a lado fixo, viewport sem scroll, tipografia da música +3 níveis, card do metrônomo `max-w-3xl` em 2 colunas.

### Iteração 3 — Persistência off + Modo Show + Wake Lock + background
- `localStorage.removeItem` no mount: app sempre em branco.
- Modo Show fullscreen com fontes gigantes, ESC para sair.
- `useWakeLock(isPlaying)` requisita screen wake lock.
- Scheduler com lookahead adaptativo (0.25s / 1.5s) + silent keep-alive.

### Iteração 4 — Show Mode navegável + atalho S
- Popup `show-nav-popup` ao clicar em show-prev/show-next, lista o setlist, click promove música.
- Auto-hide 5s sem atividade, com reset de timer em hover/scroll/click.
- ESC duas camadas: 1º fecha popup, 2º sai do Show Mode.
- Atalho `S` (com guard contra INPUT/TEXTAREA/contentEditable).
- Fix race condition `enteringFullscreenRef` vs fullscreenchange handler.

### Iteração 6 — Tons menores completos + click contínuo no Show Mode + sem navegação no Show Mode
- **MUSICAL_KEYS** agora tem 24 entradas: 12 maiores + 12 menores (adicionados `A#m/B♭m`, `C#m/D♭m`, `D#m/E♭m`, `F#m/G♭m`, `G#m/A♭m`).
- **Click contínuo**: `useMetronome` foi elevado para `Home.jsx` (única instância, antes do early return do showMode). Os outputs (`currentBeat, currentSub, isAccent, beatTick`) são passados como props para `Metronome` e `ShowMode`. Resultado: entrar/sair do Modo Show **não reinicia** o scheduler — timing permanece contínuo, sem gap nem reset de beat.
- **Show Mode sem navegação**: removidos botões `show-prev`/`show-next`, popup `show-nav-popup` e sub-componente `NavigationPopup`. ShowMode agora exibe apenas: logo + Modo Show + Sair, título/tom, BPM/compasso, beat dots, play/pause e BPM ±1. Para mudar de música, sair com ESC.

## Testing
- It. 6 (FINAL): backend 15/15 + frontend 37/37 = 100%. Continuidade do click validada com probe `locator('[data-testid=show-play-pause] svg.lucide-pause').count() === 1` logo após `S` enquanto isPlaying=true.

## Prioritized backlog
- **P2** Modo "ensaio" com aceleração gradual de BPM.
- **P2** Contagem regressiva de 4 batidas antes da música.
- **P2** Som customizado de click (sample upload).
- **P3** Compartilhar setlist por link/código base64.
- **P3** Modo banda colaborativa (websockets).
- **P3** Swipe esquerda/direita no Modo Show para mobile.
- **(opcional)** DialogDescription nos Dialogs para silenciar warnings Radix.

## Next tasks
- Aguardar feedback do usuário para próximas features.
