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
        
        // Pega o nome, primeira letra e a foto (se existir)
        const metadata = session.user.user_metadata;
        const nomeCompleto = metadata?.display_name || session.user.email.split('@')[0];
        const primeiroNome = nomeCompleto.split(' ')[0];
        const inicial = primeiroNome.charAt(0).toUpperCase();
        const fotoPerfilUrl = metadata?.foto_url;

        // Função auxiliar para injetar a foto ou a letra
        const renderizarAvatar = (elemento) => {
            if (!elemento) return;
            if (fotoPerfilUrl) {
                elemento.innerHTML = `<img src="${fotoPerfilUrl}" alt="Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                elemento.style.border = "none"; // Remove a borda azul se tiver foto
            } else {
                elemento.innerText = inicial;
            }
        };

        // Preenche os dados visuais (Desktop)
        renderizarAvatar(desktopAvatar);
        if (userNameDisplay) userNameDisplay.innerText = `Olá, ${primeiroNome}`;

        // Preenche os dados visuais (Mobile)
        renderizarAvatar(mobileAvatar);
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

        // 5. ALERTA DE PERFIL INCOMPLETO (Injetado abaixo do header)
        const hasFoto = !!metadata?.foto_url;
        const hasCidade = !!metadata?.cidade;
        const hasWhatsapp = !!metadata?.whatsapp;
        const perfilCompleto = hasFoto && hasCidade && hasWhatsapp;

        // Verifica se está incompleto e se o utilizador ainda não fechou o alerta nesta sessão
        if (!perfilCompleto && !sessionStorage.getItem('alerta_perfil_oculto')) {
            const alertBanner = document.createElement('div');
            alertBanner.innerHTML = `
                <div style="background-color: #FEF3C7; color: #92400E; text-align: center; padding: 12px 20px; font-family: var(--fonte-poppins); font-size: 13px; font-weight: 500; display: flex; justify-content: center; align-items: center; border-bottom: 1px solid #FDE68A;">
                    <span style="flex-grow: 1;">
                        ⚠️ 
                        <a href="perfil.html" style="color: #92400E; font-weight: 700; text-decoration: underline;">Complete os seus dados</a> 
                        e aumente suas chances de encontrar seu pet
                    </span>
                    <button id="fecharAlertaPerfil" style="background: transparent; border: none; color: #92400E; font-size: 20px; cursor: pointer; font-weight: bold; padding: 0 10px; line-height: 1;">&times;</button>
                </div>
            `;
            
            // Injeta o alerta visualmente dentro do header-placeholder (logo abaixo do menu)
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.appendChild(alertBanner);
                
                // Lógica para fechar o alerta e não mostrar mais durante esta sessão
                document.getElementById('fecharAlertaPerfil').addEventListener('click', () => {
                    alertBanner.style.display = 'none';
                    sessionStorage.setItem('alerta_perfil_oculto', 'true');
                });
            }
        }

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
// 4. Inicia o processo quando a página termina de carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarComponentes().then(() => {
        verificarSessao();
        carregarUltimosPerdidos(); 
        carregarUltimosEncontrados(); // <- Nova chamada adicionada
        carregarUltimosFelizes();     // <- Nova chamada adicionada
    });
});

async function carregarUltimosEncontrados() {
    const grid = document.getElementById('ultimosEncontradosGrid');
    const loading = document.getElementById('loadingEncontrados');
    const emptyMsg = document.getElementById('emptyEncontrados');
    
    if (!grid) return;

    try {
        const { data: animais, error } = await clienteSupabase
            .from('animais')
            .select('*')
            .eq('status', 'achado_na_rua') // Filtra os encontrados
            .eq('ativo', true)
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) throw error;
        if (loading) loading.style.display = 'none';

        if (animais.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        grid.innerHTML = '';
        animais.forEach(animal => {
            const fotoUrl = animal.foto_url || 'media/placeholder-pet.png';
            const cardHTML = `
                <article class="pet-card">
                    <img src="${fotoUrl}" alt="Foto de ${animal.nome}">
                    <span class="pet-status found">ENCONTRADO</span>
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
        console.error("Erro ao carregar encontrados:", err);
        if (loading) loading.innerText = "❌ Ocorreu um erro ao carregar os anúncios.";
    }
}

async function carregarUltimosFelizes() {
    const grid = document.getElementById('ultimosFelizesGrid');
    const loading = document.getElementById('loadingFelizes');
    const emptyMsg = document.getElementById('emptyFelizes');
    
    if (!grid) return;

    try {
        const { data: animais, error } = await clienteSupabase
            .from('animais')
            .select('*')
            .eq('status', 'final_feliz') // Filtra os finais felizes
            .eq('ativo', true)
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) throw error;
        if (loading) loading.style.display = 'none';

        if (animais.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        grid.innerHTML = '';
        animais.forEach(animal => {
            const fotoUrl = animal.foto_url || 'media/placeholder-pet.png';
            const cardHTML = `
                <article class="pet-card">
                    <img src="${fotoUrl}" alt="Foto de ${animal.nome}">
                    <span class="pet-status happy">FINAL FELIZ 💖</span>
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
        console.error("Erro ao carregar finais felizes:", err);
        if (loading) loading.innerText = "❌ Ocorreu um erro ao carregar as histórias.";
    }
}

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
            .limit(8); // Traz apenas os 6 últimos

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