# Impulse+ — projeto unificado (backend + frontend juntos)

Essa versão junta tudo num processo só: o mesmo servidor Express que roda a API também entrega as páginas do site. Não tem Vite, não tem build, não tem pasta `frontend` separada — é **um `npm install` e um `npm start`**, e pronto.

Como isso funciona: o navegador carrega o React direto de um CDN (sem precisar instalar nada disso no seu PC) e usa o Babel pra entender o JSX na hora, no próprio navegador. Isso deixa o projeto mais simples de rodar e de publicar, ao custo de o site demorar um pouquinho a mais pra carregar na primeira vez (o navegador processa o código na hora, em vez de já vir pronto).

## Rodando localmente

```bash
npm install
cp .env.example .env      # depois edite o JWT_SECRET se quiser
npm run seed                # popula o banco com flashcards, resumos, quiz e materiais
npm start
```

Abra `http://localhost:4000` no navegador — é só isso, um único endereço pra tudo (API e site).

## Estrutura

```
impulse-plus/
  server.js          -> Express + Socket.IO + serve os arquivos estáticos
  db.js               -> conexão e schema do SQLite
  seed.js             -> popula o banco (rode com npm run seed)
  routes/              -> rotas da API (auth, content, progress)
  middleware/auth.js   -> validação de JWT
  public/               -> todo o frontend
    index.html           -> carrega Babel + o app.js como módulo
    app.js                -> toda a interface React (JSX rodando direto no navegador)
    api.js                 -> chamadas para a API (usa caminhos relativos, tipo /api/...)
    socket.js               -> conexão Socket.IO (mesma origem, sem configurar URL)
    index.css                -> fontes e reset
```

## Publicando no Render (um serviço só)

1. Suba essa pasta inteira pra um repositório no GitHub.
2. No Render.com, clique em **New > Web Service** e conecte o repositório.
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Em **Environment**, adicione a variável `JWT_SECRET` com um valor secreto seu.
5. Depois do primeiro deploy, rode o seed uma vez — no painel do Render, vá em **Shell** (dentro do serviço) e execute `npm run seed`.

Pronto — o Render te dá uma URL pública (tipo `impulse-plus.onrender.com`) com a plataforma inteira funcionando: front e back juntos, no mesmo serviço. Não precisa mais de GitHub Pages nem de configurar dois deploys separados.

⚠️ **Sobre o banco de dados no Render:** o plano gratuito usa disco temporário, que reseta a cada novo deploy. Pra persistência de verdade em produção, ative um "Persistent Disk" no plano pago, ou migre pra um banco Postgres gerenciado (o Render oferece isso de graça também) quando o projeto crescer além do uso local/escolar.

## Diferença pro projeto anterior (com Vite)

| | Antes (Vite) | Agora (unificado) |
|---|---|---|
| Pastas | `frontend/` e `backend/` separadas | Uma pasta só |
| Comandos pra rodar | 2 terminais (`npm run dev` + `npm start`) | 1 terminal (`npm start`) |
| Build | Vite compila o React antes de rodar | Nenhum — roda direto no navegador |
| Deploy | Precisaria de 2 serviços (front + back) | 1 serviço só no Render |
