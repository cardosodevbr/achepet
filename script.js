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

    // Elementos de Texto e Links
    const cadastrarBtn = document.getElementById('navCadastrarBtn');
    const desktopAvatar = document.getElementById('desktopAvatar');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const mobileAvatar = document.getElementById('mobileAvatar');
    const mobileGreeting = document.getElementById('mobileGreeting');
    
    // Botões de Logout
    const btnLogoutDesktop = document.getElementById('btnLogoutDesktop');
    const btnLogoutMobile = document.getElementById('btnLogoutMobile');
    
    // O Header principal que vai receber a classe de estado
    const siteHeader = document.querySelector('.site-header');

    if (session) {
        console.log("🟢 Utilizador logado:", session.user.email);
        
        // Adiciona a classe de estado logado ao header
        if (siteHeader) siteHeader.classList.add('is-logged-in');
        
        // Pega o nome e a primeira letra para o Avatar
        const nomeCompleto = session.user.user_metadata?.display_name || session.user.email.split('@')[0];
        const primeiroNome = nomeCompleto.split(' ')[0];
        const inicial = primeiroNome.charAt(0).toUpperCase();

        // Preenche os dados visuais (Desktop)
        if (desktopAvatar) desktopAvatar.innerText = inicial;
        if (userNameDisplay) userNameDisplay.innerText = `Olá, ${primeiroNome}`;

        // Preenche os dados visuais (Mobile)
        if (mobileAvatar) mobileAvatar.innerText = inicial;
        if (mobileGreeting) mobileGreeting.innerText = `Olá, ${primeiroNome}`;

        // Libera o Botão de Cadastrar
        if (cadastrarBtn) {
            cadastrarBtn.classList.remove('disabled');
            cadastrarBtn.href = "form1.html";
            cadastrarBtn.style.pointerEvents = 'auto'; 
        }

        // Lógica de Logout
        const fazerLogout = async () => {
            await clienteSupabase.auth.signOut();
            window.location.reload();
        };
        if (btnLogoutDesktop) btnLogoutDesktop.addEventListener('click', fazerLogout);
        if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', fazerLogout);

    } else {
        console.log("🔴 Utilizador não logado (Visitante)");
        
        // Remove a classe de estado logado do header
        if (siteHeader) siteHeader.classList.remove('is-logged-in');
        
        // Desabilita Cadastrar
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
    // Agora selecionamos TODOS os botões de tema (desktop e mobile)
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const htmlElement = document.documentElement;
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navActionsGroup = document.getElementById('navActionsGroup');

    // --- MODO ESCURO ---
    const savedTheme = localStorage.getItem('achepet_theme');
    if (savedTheme === 'escuro') {
        htmlElement.setAttribute('data-tema', 'escuro');
        themeToggles.forEach(toggle => toggle.classList.add('active'));
    }

    // Adiciona o evento de clique a todos os botões de tema existentes
    themeToggles.forEach(themeToggle => {
        themeToggle.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-tema') === 'escuro';
            if (isDark) {
                htmlElement.removeAttribute('data-tema');
                localStorage.setItem('achepet_theme', 'claro');
                themeToggles.forEach(t => t.classList.remove('active')); // Desliga ambos
            } else {
                htmlElement.setAttribute('data-tema', 'escuro');
                localStorage.setItem('achepet_theme', 'escuro');
                themeToggles.forEach(t => t.classList.add('active')); // Liga ambos
            }
        });
    });

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
        carregarUltimosPerdidos(); // <- Adicionámos a chamada aqui!
    });
});

// =========================================================
// 5. CARREGAMENTO DINÂMICO PARA A PÁGINA INICIAL (INDEX)
// =========================================================

// Função utilitária para datas (caso seja chamada antes de outras)
function formatarDataSimples(dataIso) {
    if(!dataIso) return "Data desconhecida";
    const partes = dataIso.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

async function carregarUltimosPerdidos() {
    const grid = document.getElementById('ultimosPerdidosGrid');
    const loading = document.getElementById('loadingPerdidos');
    const emptyMsg = document.getElementById('emptyPerdidos');
    
    // Se esta div não existir na página atual (ex: utilizador está no login.html), aborta a função
    if (!grid) return;

    try {
        // Busca os últimos 6 animais perdidos e que estejam ativos
        const { data: animais, error } = await clienteSupabase
            .from('animais')
            .select('*')
            .eq('status', 'perdido')
            .eq('ativo', true)
            .order('created_at', { ascending: false })
            .limit(6); // Traz apenas os 6 últimos

        if (error) throw error;

        // Esconde o "A carregar..."
        if (loading) loading.style.display = 'none';

        if (animais.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        // Limpa o grid antes de injetar
        grid.innerHTML = '';

        // Monta o HTML para cada cartão recebido do banco de dados
        animais.forEach(animal => {
            const fotoUrl = animal.foto_url || 'media/placeholder-pet.png';
            
            const cardHTML = `
                <article class="pet-card">
                    <img src="${fotoUrl}" alt="Foto de ${animal.nome}">
                    <span class="pet-status lost">PERDIDO</span>
                    <div class="pet-info">
                        <h3>${animal.nome}</h3>
                        <p>📌 ${animal.cidade}</p>
                        <p>📅 ${formatarDataSimples(animal.data_evento)}</p>
                    </div>
                </article>
            `;
            grid.innerHTML += cardHTML;
        });

    } catch (err) {
        console.error("Erro ao carregar os últimos animais perdidos:", err);
        if (loading) loading.innerText = "❌ Ocorreu um erro ao carregar os anúncios.";
    }
}