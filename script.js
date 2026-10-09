// 1. Função para carregar os componentes
async function carregarComponentes() {
    try {
        // Carrega o Header
        const headerResp = await fetch('header.html');
        const headerHTML = await headerResp.text();
        document.getElementById('header-placeholder').innerHTML = headerHTML;

        // Carrega o Footer
        const footerResp = await fetch('footer.html');
        const footerHTML = await footerResp.text();
        document.getElementById('footer-placeholder').innerHTML = footerHTML;

        // 2. SÓ DEPOIS de o HTML existir na página é que inicializamos os botões!
        inicializarScriptsDoHeader();

    } catch (error) {
        console.error('Erro ao carregar os componentes:', error);
    }
}

// =========================================================
// VERIFICAÇÃO DE AUTENTICAÇÃO (SUPABASE) - UI MELHORADA
// =========================================================
async function verificarSessao() {
    if (typeof clienteSupabase === 'undefined') return;

    const { data: { session } } = await clienteSupabase.auth.getSession();

    // Elementos Compartilhados
    const loginBtn = document.getElementById('navLoginBtn');
    const cadastrarBtn = document.getElementById('navCadastrarBtn');
    const headerDivider = document.getElementById('headerDivider');
    
    // Elementos Desktop
    const userProfile = document.getElementById('userProfile');
    const desktopAvatar = document.getElementById('desktopAvatar');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const btnLogoutDesktop = document.getElementById('btnLogoutDesktop');
    
    // Elementos Mobile
    const mobileProfileHeader = document.getElementById('mobileProfileHeader');
    const mobileAvatar = document.getElementById('mobileAvatar');
    const mobileGreeting = document.getElementById('mobileGreeting');
    const btnLogoutMobile = document.getElementById('btnLogoutMobile');

    if (session) {
        console.log("🟢 Utilizador logado:", session.user.email);
        
        // Pega o nome e a primeira letra para o Avatar
        const nomeCompleto = session.user.user_metadata?.display_name || session.user.email.split('@')[0];
        const primeiroNome = nomeCompleto.split(' ')[0];
        const inicial = primeiroNome.charAt(0).toUpperCase();

        // 1. Atualiza UI do Desktop
        if (loginBtn) loginBtn.style.display = 'none';
        if (headerDivider) headerDivider.style.display = 'none'; // Some o divisor pois o Avatar é leve
        if (userProfile) userProfile.style.display = 'flex';
        if (desktopAvatar) desktopAvatar.innerText = inicial;
        if (userNameDisplay) userNameDisplay.innerText = `Olá, ${primeiroNome}`;

        // 2. Atualiza UI do Mobile
        if (mobileProfileHeader) mobileProfileHeader.style.display = 'flex';
        if (mobileAvatar) mobileAvatar.innerText = inicial;
        if (mobileGreeting) mobileGreeting.innerText = `Olá, ${primeiroNome}`;
        if (btnLogoutMobile) btnLogoutMobile.style.display = 'block';

        // 3. Libera o Botão de Cadastrar
        if (cadastrarBtn) {
            cadastrarBtn.classList.remove('disabled');
            cadastrarBtn.href = "form1.html";
            cadastrarBtn.style.pointerEvents = 'auto'; 
        }

        // 4. Lógica de Logout (Atrela aos dois botões)
        const fazerLogout = async () => {
            await clienteSupabase.auth.signOut();
            window.location.reload();
        };
        if (btnLogoutDesktop) btnLogoutDesktop.addEventListener('click', fazerLogout);
        if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', fazerLogout);

    } else {
        console.log("🔴 Utilizador não logado (Visitante)");
        
        // 1. Oculta Perfis e Logouts
        if (userProfile) userProfile.style.display = 'none';
        if (mobileProfileHeader) mobileProfileHeader.style.display = 'none';
        if (btnLogoutMobile) btnLogoutMobile.style.display = 'none';
        
        // 2. Exibe Login e Divisor
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (headerDivider) headerDivider.style.display = 'block';
        
        // 3. Desabilita Cadastrar
        if (cadastrarBtn) {
            cadastrarBtn.classList.add('disabled');
            cadastrarBtn.href = "#"; 
            cadastrarBtn.addEventListener('click', (event) => {
                event.preventDefault();
                alert("⚠️ Por favor, faça login ou cadastre-se para poder anunciar um animal.");
                window.location.href = "login.html";
            });
        }
    }
}

// 3. Lógica do Header (Modo Escuro e Hambúrguer)
function inicializarScriptsDoHeader() {
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navActionsGroup = document.getElementById('navActionsGroup');

    // --- MODO ESCURO ---
    const savedTheme = localStorage.getItem('achepet_theme');
    if (savedTheme === 'escuro') {
        htmlElement.setAttribute('data-tema', 'escuro');
        if (themeToggle) themeToggle.classList.add('active');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-tema') === 'escuro';
            if (isDark) {
                htmlElement.removeAttribute('data-tema');
                themeToggle.classList.remove('active');
                localStorage.setItem('achepet_theme', 'claro');
            } else {
                htmlElement.setAttribute('data-tema', 'escuro');
                themeToggle.classList.add('active');
                localStorage.setItem('achepet_theme', 'escuro');
            }
        });
    }

    // --- MENU HAMBÚRGUER ---
    if (mobileMenuBtn && navActionsGroup) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navActionsGroup.classList.toggle('active');
        });
    }
}

// 4. Inicia o processo quando a página termina de carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarComponentes().then(() => {
        verificarSessao();
    });
});