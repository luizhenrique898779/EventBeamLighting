// Alterna entre login e cadastro
const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => container.classList.add("active"));
loginBtn.addEventListener('click', () => container.classList.remove("active"));

// Funções auxiliares
function getUsuarios() {
    return JSON.parse(localStorage.getItem("usuarios")) || [];
}
function setUsuarios(usuarios) {
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

// Cadastro
document.getElementById("formCadastro").addEventListener("submit", function(e) {
    e.preventDefault();
    const email = document.getElementById("emailCadastro").value.trim();
    const senha = document.getElementById("senhaCadastro").value.trim();
    const msg = document.getElementById("msgCadastro");

    let usuarios = getUsuarios();
    let existe = usuarios.find(u => u.email === email);

    if (existe) {
        msg.textContent = "Já existe uma conta com este email!";
        msg.className = "mensagem erro";
    } else {
        usuarios.push({ email, senha });
        setUsuarios(usuarios);
        msg.textContent = "Conta criada com sucesso! Faça login.";
        msg.className = "mensagem sucesso";
        setTimeout(() => {
            container.classList.remove("active"); // volta para tela de login
            msg.textContent = "";
        }, 1500);
    }
});

// Login
document.getElementById("formLogin").addEventListener("submit", function(e) {
    e.preventDefault();
    const email = document.getElementById("emailLogin").value.trim();
    const senha = document.getElementById("senhaLogin").value.trim();
    const msg = document.getElementById("msgLogin");

    let usuarios = getUsuarios();
    let usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
        msg.textContent = "Login realizado com sucesso!";
        msg.className = "mensagem sucesso";

        // Salva o usuário logado para usar no inicio.html
        localStorage.setItem("usuarioLogado", email);

        setTimeout(() => {
            // Se login.html está dentro da pasta "login", usa ../inicio/inicio.html
            // Se login.html está na raiz, usa inicio/inicio.html
            window.location.href = "../inicio/inicio.html";
        }, 1000);
    } else {
        msg.textContent = "Email ou senha incorretos!";
        msg.className = "mensagem erro";
    }
});