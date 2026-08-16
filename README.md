# Sueca Online

Sueca, dominó, damas e quatro em linha (uma partida em simultâneo por sala) — backend Node.js + Socket.io, frontend React PWA.

## Estrutura

```
sueca/
  server/   -> Node + Express + Socket.io (estado do jogo em memória)
  client/   -> React + Vite PWA
```

## Como correr localmente

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```
Fica a correr em `http://localhost:3001`.

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```
Fica a correr em `http://localhost:5173`. Abre em 4 separadores/dispositivos diferentes para testar os 4 lugares (usa nomes diferentes).

## Como jogar — Sueca

1. No lobby, escolhe "Sueca".
2. Cada um dos 4 jogadores entra com o mesmo nome de "Sala" (ex: `mesa-1`) e um nome próprio.
3. Quando os 4 estiverem na sala, cada um carrega em "Estou pronto".
4. O jogo distribui as cartas automaticamente; a última carta do dealer define o trunfo.
5. Jogadores 0 e 2 são a Equipa A, jogadores 1 e 3 são a Equipa B (posições atribuídas pela ordem de entrada).
6. No fim das 10 vazas, os pontos somam ao placar de sessão. Podem carregar em "Jogar outra partida" para continuar a somar pontos sem sair da sala.

## Como jogar — Dominó

1. No lobby, escolhe "Dominó".
2. 2 jogadores entram na mesma sala; ambos carregam em "Estou pronto".
3. Conjunto double-six (28 peças), 7 por jogador, resto no monte.
4. Se não tiveres jogada, aparece o botão "Comprar do monte"; se o monte esgotar e continuares sem jogada, aparece "Passar".
5. A mão termina quando alguém fica sem peças ("bateu") ou quando ambos passam seguidos sem conseguir jogar (jogo bloqueado — ganha quem tiver menos pintas na mão; em caso de empate, ninguém pontua nessa mão).
6. Quem ganha soma ao placar de sessão as pintas que sobraram na mão do adversário.

Nota: a sala fica fixada ao primeiro jogo escolhido por quem a cria — se tentares entrar numa sala "mesa-1" já a jogar sueca com o dominó selecionado, o servidor avisa-te e tens de escolher outro nome de sala.

## Como jogar — Damas

1. No lobby, escolhe "Damas".
2. 2 jogadores entram na mesma sala; ambos carregam em "Estou pronto".
3. Tabuleiro 8x8, 12 peças por jogador. Peças normais só andam e capturam para a frente, na diagonal. A dama, depois de promovida na última linha, "voa" — anda e captura a qualquer distância, em qualquer direção diagonal.
4. Captura é obrigatória; se houver mais que uma sequência de captura possível, só são permitidas as que capturam o maior número de peças (regra da maioria). Uma captura múltipla continua automaticamente com a mesma peça enquanto houver mais peças para capturar — exceto se a peça for promovida a meio da sequência, caso em que a jogada termina de imediato.
5. Perde quem ficar sem peças ou sem jogadas possíveis. Quem ganha soma 1 ponto ao placar de sessão.

## Como jogar — Quatro em Linha

1. No lobby, escolhe "Quatro em Linha".
2. 2 jogadores entram na mesma sala; ambos carregam em "Estou pronto".
3. Tabuleiro 7 colunas x 6 linhas. Cada jogador, na sua vez, clica numa coluna para lá deixar cair uma peça — cai até à posição livre mais baixa dessa coluna.
4. Ganha quem conseguir alinhar 4 peças suas seguidas na horizontal, vertical ou diagonal. Se o tabuleiro encher sem ninguém alinhar 4, é empate.
5. Quem ganha soma 1 ponto ao placar de sessão; em caso de empate, ninguém pontua.

## Notas de arquitetura

- **Estado em memória**: não há base de dados — cada `Room` mantém o estado da(s) partida(s) em RAM no processo Node. Isto é suficiente para "um jogo em simultâneo"; se precisares de várias mesas ao mesmo tempo, o código já suporta (cada `roomId` é independente), mas reiniciar o servidor perde todas as sessões em curso.
- **Reconexão**: se um jogador perder ligação e voltar a entrar com o mesmo nome e sala, retoma a posição anterior.
- **Validação de jogadas**: feita sempre no servidor (`server/src/game/rules.js` e `Game.js`) — o cliente nunca decide se uma jogada é válida, só mostra/desativa cartas para dar feedback visual.

## Próximos passos sugeridos

- Deploy: backend num serviço Node (Render, Railway, Fly.io); frontend como PWA estática (Vercel/Netlify), apontando `VITE_SERVER_URL` para o backend.
- Persistência: se quiseres sobreviver a reinícios do servidor, trocar o estado em memória por Redis ou um ficheiro JSON simples (dado o volume baixo, um ficheiro chega).
- Ícones: os `icon-192.png`/`icon-512.png` em `client/public/` são placeholders — substitui por um ícone final antes de publicar a PWA.
