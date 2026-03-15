// Carregar produtos salvos ou usar padrão
let produtos = JSON.parse(localStorage.getItem("produtos")) || [
  // removido item inicial indesejado
  { nome: "Laser RGS 3W", foto: "https://via.placeholder.com/200", preco: 200, estoque: 3 },
  { nome: "Máquina de Fumaça 1500W", foto: "https://via.placeholder.com/200", preco: 150, estoque: 10 }
];

let modoAdmin = null;

// Carrinho separado por usuário (ou genérico quando não há login)
function getCarrinho() {
  const usuarioEmail = localStorage.getItem("usuarioEmail") || "_anonimo";
  return JSON.parse(localStorage.getItem("carrinho_" + usuarioEmail)) || {};
}
function setCarrinho(carrinho) {
  const usuarioEmail = localStorage.getItem("usuarioEmail") || "_anonimo";
  localStorage.setItem("carrinho_" + usuarioEmail, JSON.stringify(carrinho));
}

// Mescla o carrinho anônimo (_anonimo) com o carrinho do usuário logado
function mergeAnonCartToUser(targetEmail) {
  try {
    const anonKey = "carrinho__anonimo";
    const userKey = "carrinho_" + targetEmail;
    const anonCart = JSON.parse(localStorage.getItem(anonKey)) || {};
    const userCart = JSON.parse(localStorage.getItem(userKey)) || {};
    let mergedAny = false;

    for (let i in anonCart) {
      const anonQty = Number(anonCart[i] || 0);
      if (anonQty <= 0) continue;

      const prod = produtos[i];
      const userQty = Number(userCart[i] || 0);
      const estoque = prod && typeof prod.estoque === 'number' ? prod.estoque : Infinity;

      const novo = Math.min(userQty + anonQty, estoque);
      if (novo > 0) {
        userCart[i] = novo;
        mergedAny = true;
      }
    }

    if (mergedAny) {
      localStorage.setItem(userKey, JSON.stringify(userCart));
      localStorage.removeItem(anonKey);
      mostrarNotificacao('✓ Carrinho anônimo mesclado ao usuário.');
    }
  } catch (err) {
    console.error('Erro ao mesclar carrinho anônimo:', err);
  }
}
let carrinho = getCarrinho();

// Renderizar catálogo
function renderProdutos() {
  const container = document.getElementById("produtos");
  if (!container) return;
  container.innerHTML = "";
  produtos.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "produto-card";
    const quantidadeNoCarrinho = carrinho[i] || 0;
    const podeAdicionar = p.estoque > 0 && quantidadeNoCarrinho < p.estoque;
    card.innerHTML = `
      <img src="${p.foto}" alt="${p.nome}">
      <h3>${p.nome}</h3>
      <p>R$ ${p.preco},00/dia</p>
      <p>Estoque: ${p.estoque}</p>
      <button ${!podeAdicionar ? 'disabled' : ''} onclick="adicionarCarrinho(${i})">${podeAdicionar ? 'Reservar Agora' : (p.estoque === 0 ? 'Esgotado' : 'Limite atingido')}</button>
    `;
    container.appendChild(card);
  });
}
renderProdutos();

// Adicionar ao carrinho
function adicionarCarrinho(i) {
  const prod = produtos[i];
  if (!prod) return;
  if (!carrinho[i]) carrinho[i] = 0;
  if (carrinho[i] >= prod.estoque) {
    mostrarNotificacao(`⚠️ Limite de estoque atingido para ${prod.nome}`);
    renderProdutos();
    return;
  }
  carrinho[i]++;
  setCarrinho(carrinho);

  // Calcular total de itens no carrinho
  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);

  mostrarNotificacao(`✓ ${prod.nome} adicionado! (Total no carrinho: ${totalItens} ${totalItens === 1 ? 'item' : 'itens'})`);
  atualizarContadorCarrinho();
  renderProdutos();
}

// Notificação
function mostrarNotificacao(texto) {
  let notif = document.getElementById("notificacao");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "notificacao";
    document.body.appendChild(notif);
  }
  notif.textContent = texto;
  notif.style.display = "block";
  setTimeout(() => { notif.style.display = "none"; }, 2000);
}

// Atualizar contador do carrinho
function atualizarContadorCarrinho() {
  let carrinhoBadge = document.getElementById("carrinhoBadge");
  
  // Calcular total de itens
  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);
  
  if (totalItens > 0) {
    if (!carrinhoBadge) {
      carrinhoBadge = document.createElement("span");
      carrinhoBadge.id = "carrinhoBadge";
      carrinhoBadge.style.cssText = "position: fixed; top: 20px; right: 30px; background: #00ffcc; color: #000; padding: 5px 10px; border-radius: 20px; font-weight: bold; z-index: 100; cursor: pointer;";
      carrinhoBadge.onclick = () => window.location.href = "../outros/catalogo.html";
      document.body.appendChild(carrinhoBadge);
    }
    carrinhoBadge.textContent = `🛒 ${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;
    carrinhoBadge.style.display = "block";
  } else if (carrinhoBadge) {
    carrinhoBadge.style.display = "none";
  }
}

// Painel Admin
function renderAdminPanel() {
  const lista = document.getElementById("listaAdmin");
  if (!lista) return;
  lista.innerHTML = `
    <button onclick="modoAdmin='editar'; renderAdminPanel()">Editar</button>
    <button onclick="modoAdmin='excluir'; renderAdminPanel()">Excluir</button>
    <button onclick="modoAdmin='adicionar'; renderAdminPanel()">Adicionar</button>
    <button onclick="modoAdmin='pedidos'; renderAdminPanel()">Meus Pedidos</button>
  `;
  produtos.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "admin-item";
    if (modoAdmin === "editar") {
      item.innerHTML = `
        <input type="text" value="${p.nome}" id="nome-${i}">
        <input type="text" value="${p.foto}" id="foto-${i}">
        <input type="number" value="${p.preco}" id="preco-${i}">
        <input type="number" value="${p.estoque}" id="estoque-${i}">
        <button onclick="salvarProduto(${i})">Salvar</button>
      `;
    } else if (modoAdmin === "excluir") {
      item.innerHTML = `
        <p>${p.nome} - R$ ${p.preco},00 (Estoque: ${p.estoque})</p>
        <button onclick="excluirProduto(${i})">Excluir</button>
      `;
    } else {
      item.innerHTML = `<p>${p.nome} - R$ ${p.preco},00 (Estoque: ${p.estoque})</p>`;
    }
    lista.appendChild(item);
  });
  if (modoAdmin === "adicionar") {
    lista.innerHTML += `
      <div>
        <input type="text" id="novoNome" placeholder="Nome">
        <input type="text" id="novoFoto" placeholder="Foto URL">
        <input type="number" id="novoPreco" placeholder="Preço">
        <input type="number" id="novoEstoque" placeholder="Estoque">
        <button onclick="adicionarProduto()">Salvar Produto</button>
      </div>
    `;
  }
  if (modoAdmin === 'pedidos') {
    // buscar e renderizar solicitações do servidor
    renderSolicitacoes();
  }
}
function salvarProduto(i) {
  produtos[i].nome = document.getElementById(`nome-${i}`).value;
  produtos[i].foto = document.getElementById(`foto-${i}`).value;
  produtos[i].preco = Number(document.getElementById(`preco-${i}`).value);
  produtos[i].estoque = Number(document.getElementById(`estoque-${i}`).value);
  localStorage.setItem("produtos", JSON.stringify(produtos));
  renderProdutos(); renderAdminPanel();
}
function excluirProduto(i) {
  produtos.splice(i, 1);
  localStorage.setItem("produtos", JSON.stringify(produtos));
  renderProdutos(); renderAdminPanel();
}

// Buscar solicitações do servidor e renderizar no painel admin
async function renderSolicitacoes() {
  const lista = document.getElementById("listaAdmin");
  if (!lista) return;
  lista.innerHTML = '<h3>Carregando pedidos...</h3>';
  try {
    const res = await fetch('http://localhost:3000/api/solicitacoes');
    if (!res.ok) {
      lista.innerHTML = `<p>Erro ao carregar solicitações do servidor (status ${res.status}).</p>`;
      return;
    }
    const dados = await res.json();
    if (!Array.isArray(dados) || dados.length === 0) {
      lista.innerHTML = '<p>Nenhuma solicitação encontrada.</p>';
      return;
    }
    lista.innerHTML = '<h3>Solicitações</h3>';
    dados.reverse().forEach(s => {
      const bloco = document.createElement('div');
      bloco.style.cssText = 'background:#1a1a1a;padding:10px;margin:8px;border-radius:6px;color:#fff;';
      bloco.innerHTML = `
        <strong>ID:</strong> ${s.id} <br>
        <strong>Nome:</strong> ${s.nome} <br>
        <strong>Telefone:</strong> ${s.telefone} <br>
        <strong>Itens:</strong><div style="margin-left:6px;color:#ccc">${s.itens.replace(/\n/g,'<br>')}</div>
        <strong>Total:</strong> R$ ${s.total},00 <br>
        <strong>Status:</strong> ${s.status} <br>
        <button onclick="atualizarStatus(${s.id}, 'aprovado')">Aprovar</button>
        <button onclick="atualizarStatus(${s.id}, 'cancelado')">Cancelar</button>
      `;
      lista.appendChild(bloco);
    });
  } catch (err) {
    console.error('Erro ao buscar solicitacoes:', err);
    lista.innerHTML = `<p>Erro ao carregar solicitações: ${err.message || err}. Verifique se o servidor está rodando (execute <code>node server.js</code> na pasta do projeto).</p>`;
  }
}

// Atualiza status de solicitação no servidor
async function atualizarStatus(id, status) {
  try {
    const res = await fetch('http://localhost:3000/api/solicitacoes/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    });
    const resp = await res.json();
    if (resp && resp.sucesso) {
      mostrarNotificacao('Status atualizado.');
      renderSolicitacoes();
    } else {
      mostrarNotificacao('Erro ao atualizar status.');
    }
  } catch (err) {
    console.error('Erro atualizarStatus:', err);
    mostrarNotificacao('Erro de conexão ao atualizar status.');
  }
}
function adicionarProduto() {
  const nome = document.getElementById("novoNome").value;
  const foto = document.getElementById("novoFoto").value;
  const preco = Number(document.getElementById("novoPreco").value);
  const estoque = Number(document.getElementById("novoEstoque").value);
  if (!nome || !foto || !preco || !estoque) {
    mostrarNotificacao("Preencha todos os campos para adicionar o produto.");
    return;
  }
  produtos.push({ nome, foto, preco, estoque });
  localStorage.setItem("produtos", JSON.stringify(produtos));
  renderProdutos(); renderAdminPanel();
}

// Modal Login
const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const closeModal = document.getElementById("closeModal");
const loginAdminBtn = document.getElementById("loginAdmin");
const msgAdmin = document.getElementById("msgAdmin");

if (adminBtn) adminBtn.onclick = () => { if (adminModal) adminModal.style.display = "block"; };
if (closeModal) closeModal.onclick = () => { if (adminModal) adminModal.style.display = "none"; };

// Função de logout (opcional)
function logoutAdmin() {
  localStorage.removeItem("usuarioEmail");
  localStorage.removeItem("usuarioNome");
  localStorage.removeItem("usuarioIsAdmin");
  const bemVindo = document.getElementById("bemVindo");
  if (bemVindo) bemVindo.textContent = "";
  const panel = document.getElementById("adminPanel");
  if (panel) panel.style.display = "none";
  mostrarNotificacao("Logout realizado.");
}

// Login via servidor (validação real)
if (loginAdminBtn) {
  loginAdminBtn.onclick = async () => {
    const email = document.getElementById("adminEmail").value;
    const senha = document.getElementById("adminSenha").value;

    try {
      const resposta = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      }).then(res => res.json());

      if (resposta && resposta.sucesso) {
        msgAdmin.textContent = "Login realizado com sucesso!";
        msgAdmin.style.color = "green";
        if (adminModal) adminModal.style.display = "none";
        const panel = document.getElementById("adminPanel");
        if (panel) panel.style.display = "block";
        renderAdminPanel();

        // Salva usuário logado e flag de admin
        localStorage.setItem("usuarioEmail", email);
        localStorage.setItem("usuarioNome", resposta.nome || email.split("@")[0]);
        localStorage.setItem("usuarioIsAdmin", "true");

        // Mesclar carrinho anônimo (se existir) para este usuário
        mergeAnonCartToUser(email);

        // Atualiza UI do carrinho após mesclagem
        atualizarContadorCarrinho();
        renderProdutos();

        // Atualizar navbar
        atualizarNavbar();

        // Mostra mensagem personalizada
        let bemVindo = document.getElementById("bemVindo");
        if (!bemVindo) {
          bemVindo = document.createElement("h2");
          bemVindo.id = "bemVindo";
          document.body.insertBefore(bemVindo, document.body.firstChild);
        }
        bemVindo.textContent = "Bem-vindo, " + (resposta.nome || email.split("@")[0]);
      } else {
        msgAdmin.textContent = resposta && resposta.mensagem ? resposta.mensagem : "Email ou senha incorretos!";
        msgAdmin.style.color = "red";
      }
    } catch (err) {
      msgAdmin.textContent = "Erro de conexão com servidor!";
      msgAdmin.style.color = "red";
      console.error("Erro no login:", err);
    }
  };
}

// Ao carregar a página, mostrar usuário logado e painel se for admin
window.addEventListener("DOMContentLoaded", () => {
  const usuarioNome = localStorage.getItem("usuarioNome");
  const usuarioIsAdmin = localStorage.getItem("usuarioIsAdmin") === "true";

  if (usuarioNome) {
    let bemVindo = document.getElementById("bemVindo");
    if (!bemVindo) {
      bemVindo = document.createElement("h2");
      bemVindo.id = "bemVindo";
      document.body.insertBefore(bemVindo, document.body.firstChild);
    }
    bemVindo.textContent = "Bem-vindo, " + usuarioNome;
  }

  if (usuarioIsAdmin) {
    const panel = document.getElementById("adminPanel");
    if (panel) panel.style.display = "block";
    renderAdminPanel();
  }

  // Atualizar contador do carrinho ao carregar
  atualizarContadorCarrinho();
});