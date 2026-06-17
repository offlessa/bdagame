# Batalha da Aldeia — Como rodar

## Pré-requisitos
- Node.js 20+
- npm 10+
- Conta no [Supabase](https://supabase.com) (grátis)
- Expo Go no celular (opcional)

---

## 1. Banco de dados (Supabase)

1. Crie um projeto no Supabase
2. Vá em **SQL Editor** e cole o conteúdo de `infra/supabase.sql`
3. Execute o script

---

## 2. Backend

```bash
cd apps/backend
cp .env.example .env
# Edite .env com suas chaves do Supabase e um JWT_SECRET seguro
npm install
npm run dev
```

O backend sobe em `http://localhost:3001`

---

## 3. Frontend

```bash
cd apps/frontend
npm install
# Crie .env.local com:
# EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
npx expo start
```

- Pressione `w` para abrir no **navegador**
- Escaneie o QR code com o **Expo Go** para testar no celular

---

## Fluxo do jogo

```
Login/Cadastro
    ↓
Lobby → Criar sala (recebe código 6 dígitos)
    ↓        ↑
         Oponente digita o código e entra
    ↓
Draft: cada jogador escolhe 3 MCs em ordem secreta
    ↓
Batalha:
  Round 1 → Atacante compra Beat → escolhem atributos → revelam MCs → Fatality? → Moment → Calcular
  Round 2 → Idem (atacante e defensor trocam)
  Round 3 (se empate) → Bate-Volta com atributos restantes
    ↓
Tela de Resultado → Ranking atualizado
```

---

## Estrutura do projeto

```
batalha-da-aldeia/
├── packages/
│   └── game-engine/        # Lógica pura do jogo (TypeScript)
├── apps/
│   ├── backend/            # Node.js + Express + Socket.io
│   └── frontend/           # Expo (web + iOS + Android)
└── infra/
    └── supabase.sql        # Schema do banco
```
