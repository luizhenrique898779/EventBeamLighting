import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Rota de login
app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;

  // Credenciais fixas do Admin
  const adminEmailCorreto = "eblighting@hotmail.com";
  const adminSenhaCorreta = "luizhenriquepandafischer";

  if (email === adminEmailCorreto && senha === adminSenhaCorreta) {
    res.json({
      sucesso: true,
      nome: "Administrador"
    });
  } else {
    res.json({
      sucesso: false,
      mensagem: "Email ou senha incorretos"
    });
  }
});

// Inicializa servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Arquivo para armazenar solicitações de orçamento
const solicitacoesFile = path.join(process.cwd(), 'solicitacoes.json');

function readSolicitacoes() {
  try {
    if (!fs.existsSync(solicitacoesFile)) return [];
    const raw = fs.readFileSync(solicitacoesFile, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Erro lendo solicitacoes:', err);
    return [];
  }
}

function writeSolicitacoes(list) {
  try {
    fs.writeFileSync(solicitacoesFile, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erro salvando solicitacoes:', err);
    return false;
  }
}

// Endpoint para receber nova solicitação (do cliente)
app.post('/api/solicitacoes', (req, res) => {
  const solicitacao = req.body;
  if (!solicitacao || !solicitacao.id) {
    return res.status(400).json({ sucesso: false, mensagem: 'Solicitação inválida' });
  }
  const list = readSolicitacoes();
  list.push(solicitacao);
  const ok = writeSolicitacoes(list);
  if (!ok) return res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar' });
  return res.json({ sucesso: true });
});

// Endpoint para o admin listar solicitações
app.get('/api/solicitacoes', (req, res) => {
  const list = readSolicitacoes();
  res.json(list);
});

// Endpoint para atualizar status de uma solicitação (ex: pendente -> aprovado)
app.put('/api/solicitacoes/:id', (req, res) => {
  const id = Number(req.params.id);
  const novoStatus = req.body.status;
  if (!novoStatus) return res.status(400).json({ sucesso: false, mensagem: 'Status ausente' });
  let list = readSolicitacoes();
  let changed = false;
  list = list.map(s => {
    if (s.id === id) {
      s.status = novoStatus;
      changed = true;
    }
    return s;
  });
  if (!changed) return res.status(404).json({ sucesso: false, mensagem: 'Solicitação não encontrada' });
  const ok = writeSolicitacoes(list);
  if (!ok) return res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar' });
  res.json({ sucesso: true });
});