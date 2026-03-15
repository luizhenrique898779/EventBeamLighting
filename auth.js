// ========== AUTENTICAÇÃO COMPARTILHADA ==========

// Verificar se admin está logado
function verificarAdminLogado() {
    return localStorage.getItem("usuarioIsAdmin") === "true" && localStorage.getItem("usuarioEmail") !== null;
}

// Obter nome do admin logado
function obterNomeAdmin() {
    return localStorage.getItem("usuarioNome") || "Admin";
}

// Obter email do admin
function obterEmailAdmin() {
    return localStorage.getItem("usuarioEmail") || "";
}

// Fazer logout
function fazerLogout() {
    localStorage.removeItem("usuarioEmail");
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("usuarioIsAdmin");
    location.reload();
}

// Atualizar navbar com status de login
function atualizarNavbar() {
    const adminBtn = document.getElementById("adminBtn");
    
    if (!adminBtn) return;

    if (verificarAdminLogado()) {
        // Se está logado como admin
        adminBtn.textContent = `👤 ${obterNomeAdmin()} (Sair)`;
        adminBtn.style.background = "#10b981";
        adminBtn.style.cursor = "pointer";
        adminBtn.onclick = (e) => {
            e.preventDefault();
            if (confirm("Deseja fazer logout?")) {
                fazerLogout();
            }
        };
    } else {
        // Se não está logado
        adminBtn.textContent = "🔐 Admin";
        adminBtn.style.background = "#7c3aed";
        adminBtn.style.cursor = "pointer";
        adminBtn.onclick = (e) => {
            e.preventDefault();
            // Salvar página atual e redirecionar para o login
            const paginaAtual = window.location.pathname;
            localStorage.setItem("pagina_anterior", paginaAtual);
            
            // Se já está na página de inicio, abrir modal
            if (window.location.pathname.includes("inicio.html")) {
                const modal = document.getElementById("adminModal");
                if (modal) {
                    modal.style.display = "block";
                }
            } else {
                // Caso contrário, redirecionar para inicio
                window.location.href = "../inicio/inicio.html";
            }
        };
    }
}

// Chamar ao carregar
document.addEventListener("DOMContentLoaded", atualizarNavbar);
