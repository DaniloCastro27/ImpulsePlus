require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./db");

const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const progressRoutes = require("./routes/progress");

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------------------------------------------------
   API
---------------------------------------------------------- */
app.get("/api/health", (req, res) => res.json({ ok: true, servico: "impulse-plus" }));
app.use("/api/auth", authRoutes);
app.use("/api", contentRoutes);
app.use("/api/progress", progressRoutes);

app.use("/api", (req, res) => res.status(404).json({ erro: "Rota não encontrada." }));
app.use("/api", (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

/* ---------------------------------------------------------
   FRONTEND (arquivos estáticos em /public)
   O navegador roda o React direto via módulos ES + Babel,
   sem precisar de build (Vite/webpack) nenhum.
---------------------------------------------------------- */
app.use(express.static(path.join(__dirname, "public")));

/* ---------------------------------------------------------
   SOCKET.IO — salas do "Desafio em grupo" (estilo Kahoot)
---------------------------------------------------------- */

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const salas = new Map();

const perguntasQuiz = () =>
  db.prepare("SELECT id, pergunta, opcoes, correta FROM quiz_questions").all()
    .map((p) => ({ ...p, opcoes: JSON.parse(p.opcoes) }));

function gerarCodigo() {
  let codigo;
  do {
    codigo = String(Math.floor(100000 + Math.random() * 900000));
  } while (salas.has(codigo));
  return codigo;
}

function estadoPublico(sala) {
  return {
    codigo: sala.codigo,
    status: sala.status,
    perguntaAtual: sala.perguntaAtual,
    totalPerguntas: sala.perguntas.length,
    jogadores: [...sala.jogadores.entries()].map(([id, j]) => ({ id, nome: j.nome, pontos: j.pontos })),
  };
}

io.on("connection", (socket) => {
  socket.on("criar-sala", ({ nome, perguntasPersonalizadas }, callback) => {
    const codigo = gerarCodigo();
    const perguntasValidas = Array.isArray(perguntasPersonalizadas) && perguntasPersonalizadas.length > 0
      ? perguntasPersonalizadas.filter((p) => p && p.pergunta && Array.isArray(p.opcoes) && p.opcoes.length === 4 && typeof p.correta === "number")
      : null;
    const sala = {
      codigo,
      anfitriao: socket.id,
      status: "aguardando",
      perguntaAtual: -1,
      perguntas: perguntasValidas && perguntasValidas.length > 0 ? perguntasValidas : perguntasQuiz(),
      jogadores: new Map([[socket.id, { nome: nome || "Anfitrião", pontos: 0 }]]),
      respostasRodada: new Map(),
    };
    salas.set(codigo, sala);
    socket.join(codigo);
    callback({ ok: true, ...estadoPublico(sala) });
  });

  socket.on("entrar-sala", ({ codigo, nome }, callback) => {
    const sala = salas.get(codigo);
    if (!sala) return callback({ ok: false, erro: "Sala não encontrada." });
    if (sala.status !== "aguardando") return callback({ ok: false, erro: "Este desafio já começou." });

    sala.jogadores.set(socket.id, { nome: nome || "Jogador", pontos: 0 });
    socket.join(codigo);
    io.to(codigo).emit("sala-atualizada", estadoPublico(sala));
    callback({ ok: true, ...estadoPublico(sala) });
  });

  socket.on("iniciar-desafio", ({ codigo }) => {
    const sala = salas.get(codigo);
    if (!sala || sala.anfitriao !== socket.id) return;
    sala.status = "em_andamento";
    sala.perguntaAtual = 0;
    sala.respostasRodada = new Map();
    io.to(codigo).emit("pergunta", proximaPerguntaPayload(sala));
  });

  socket.on("responder", ({ codigo, opcao, tempoRestante }) => {
    const sala = salas.get(codigo);
    if (!sala || sala.status !== "em_andamento") return;
    if (sala.respostasRodada.has(socket.id)) return;

    const pergunta = sala.perguntas[sala.perguntaAtual];
    const acertou = Number(opcao) === pergunta.correta;
    const pontosGanhos = acertou ? 500 + Math.max(0, tempoRestante) * 40 : 0;

    sala.respostasRodada.set(socket.id, true);
    const jogador = sala.jogadores.get(socket.id);
    if (jogador) jogador.pontos += pontosGanhos;

    socket.emit("resultado-resposta", { acertou, correta: pergunta.correta, pontosGanhos });

    if (sala.respostasRodada.size >= sala.jogadores.size) {
      io.to(codigo).emit("rodada-revelada", { correta: pergunta.correta, ranking: rankingOrdenado(sala) });
    }
  });

  socket.on("proxima-pergunta", ({ codigo }) => {
    const sala = salas.get(codigo);
    if (!sala || sala.anfitriao !== socket.id) return;

    sala.perguntaAtual += 1;
    sala.respostasRodada = new Map();

    if (sala.perguntaAtual >= sala.perguntas.length) {
      sala.status = "finalizado";
      io.to(codigo).emit("desafio-finalizado", { ranking: rankingOrdenado(sala) });
    } else {
      io.to(codigo).emit("pergunta", proximaPerguntaPayload(sala));
    }
  });

  socket.on("disconnect", () => {
    for (const [codigo, sala] of salas) {
      if (sala.jogadores.delete(socket.id)) {
        if (sala.jogadores.size === 0) {
          salas.delete(codigo);
        } else {
          if (sala.anfitriao === socket.id) sala.anfitriao = [...sala.jogadores.keys()][0];
          io.to(codigo).emit("sala-atualizada", estadoPublico(sala));
        }
      }
    }
  });
});

function proximaPerguntaPayload(sala) {
  const p = sala.perguntas[sala.perguntaAtual];
  return {
    indice: sala.perguntaAtual,
    total: sala.perguntas.length,
    pergunta: p.pergunta,
    opcoes: p.opcoes,
  };
}

function rankingOrdenado(sala) {
  return [...sala.jogadores.values()].sort((a, b) => b.pontos - a.pontos).map((j) => ({ nome: j.nome, pontos: j.pontos }));
}

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Impulse+ rodando em http://localhost:${PORT}`);
});
