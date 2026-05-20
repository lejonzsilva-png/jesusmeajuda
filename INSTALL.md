# Setlist Metrônomo - Instalação no Mac e Windows

App está disponível em: **{REACT_APP_BACKEND_URL}** (sua URL de preview Emergent).

A app é um **PWA (Progressive Web App)** instalável - **não precisa de App Store / Play Store / .exe / .dmg**. Em poucos cliques fica como um app nativo no Dock (Mac) ou Barra de Tarefas (Windows), com ícone próprio, janela própria, e funciona offline.

---

## 🪟 Windows (Edge, Chrome ou Brave)

1. Abra a URL do app no **Microsoft Edge** ou **Google Chrome**.
2. Na barra de endereço (direita), procure pelo ícone de **instalação** — parece um monitor com seta para baixo (`⤓`) ou um `+`. No Chrome aparece como `Instalar Setlist Metrônomo`.
3. Clique nele e em seguida em **Instalar**.
4. O app abre numa janela própria. Atalho aparece:
   - No **menu Iniciar** (categoria "Apps recentes")
   - Na **Barra de Tarefas** (clique com botão direito no app → "Fixar na Barra de Tarefas")
   - Na **Área de Trabalho** (opcional, durante a instalação)

### Atalho alternativo
- Menu Edge: `Configurações ⋯ → Apps → Instalar este site como um app`
- Menu Chrome: `⋮ → Transmitir, salvar e compartilhar → Instalar Setlist Metrônomo`

---

## 🍎 macOS (Chrome, Edge, Safari 17+)

### Chrome ou Edge (recomendado)
1. Abra a URL no **Chrome** ou **Edge**.
2. Na barra de endereço, clique no ícone de **instalação** à direita (mesmo `⤓` do Windows).
3. Confirme **Instalar**.
4. O app vira um aplicativo no **Launchpad** com ícone próprio.
5. **Arraste o ícone do Launchpad para o Dock** para fixar (ou: com o app aberto, clique-direito no Dock → `Opções → Manter no Dock`).

### Safari 17+ (macOS Sonoma 14+)
1. Abra a URL no **Safari**.
2. Menu **Arquivo** → **Adicionar à Dock…**
3. Confirme. Ícone aparece no Dock automaticamente.

---

## 📱 iPhone / iPad (Safari)

1. Abra a URL no **Safari**.
2. Toque no botão **Compartilhar** (quadrado com seta para cima) na barra inferior.
3. Role para baixo e toque em **Adicionar à Tela de Início**.
4. Confirme **Adicionar**.
5. O ícone aparece na sua Home Screen como um app normal.

---

## 🤖 Android (Chrome, Edge, Samsung Internet)

1. Abra a URL no **Chrome**.
2. Toque em `⋮` → **Instalar app** (ou **Adicionar à tela inicial**).
3. Confirme.
4. Ícone aparece no Drawer e na Home.

---

## ✅ O que funciona depois de instalado

- **Ícone próprio** no Dock / Barra de Tarefas / Launchpad / Home Screen.
- **Janela isolada** sem barra do browser (parece app nativo).
- **Offline-first**: depois da primeira abertura, funciona mesmo sem internet (assets em cache via Service Worker).
- **Wake Lock**: tela não dorme durante reprodução do metrônomo (Chrome, Edge, Safari 16.4+).
- **Atalho `S`** abre o Modo Show instantaneamente.
- **Áudio em segundo plano**: scheduler com lookahead adaptativo + silent keep-alive (Chrome/Edge desktop OK; iOS Safari pausa quando app perde foco — limitação do iOS).

---

## 🔧 Atualizando o app instalado

O Service Worker (`setlist-metronome-v2`) atualiza automaticamente sempre que você abre o app online. Para forçar atualização:

- **Windows/Mac**: feche e reabra a janela do app, ou clique-direito no ícone do Dock → `Fechar tudo`.
- **iOS/Android**: feche o app das tarefas recentes e reabra.

---

## 🛠 Para uso ao vivo no palco

1. **Instale como PWA** (passos acima) para ficar full-screen sem barras de browser.
2. Abra a app, monte seu setlist (Adicionar / Importar `.setlist`).
3. Pressione `S` ou clique em **Modo Show** para ir para a tela de palco.
4. Use as setas no Modo Show para abrir o **popup de navegação** com o setlist (auto-some em 5s).
5. Wake Lock mantém a tela ligada — não precisa mexer no tablet.

**Pro tip**: instale a app em um **tablet/iPad em modo paisagem** próximo à bateria — letras gigantes do título e do tom são legíveis a 2-3 metros.

---

## 🆘 Resolução de problemas

| Problema | Solução |
|---|---|
| Popup do Modo Show não aparece | Pressione `Ctrl+Shift+R` (Win) ou `Cmd+Shift+R` (Mac) para forçar refresh com cache limpo. O popup foi corrigido na iteração 5. |
| Ícone errado no Dock após instalar | Desinstale (clique-direito no Dock → Remover) e reinstale. Cache de ícone do SO pode demorar para atualizar. |
| Áudio pausa em background no iPhone | Limitação do iOS Safari. Mantenha o app em primeiro plano durante o show, ou use Mac/Windows/Android. |
| Tela apaga durante reprodução | Verifique se a aba está em foco. iOS Safari < 16.4 não suporta Wake Lock. |

---

Bom show! 🎶
