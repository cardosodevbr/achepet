// =========================================================
// 1. CARREGAMENTO DOS COMPONENTES BASE (HEADER/FOOTER)
// =========================================================
async function carregarComponentes() {
    try {
        const headerResp = await fetch('header.html');
        const headerHTML = await headerResp.text();
        document.getElementById('header-placeholder').innerHTML = headerHTML;

        const footerResp = await fetch('footer.html');
        const footerHTML = await footerResp.text();
        document.getElementById('footer-placeholder').innerHTML = footerHTML;

        inicializarScriptsDoHeader();
    } catch (error) {
        console.error('Erro ao carregar os componentes:', error);
    }
}

// =========================================================
// 2. VERIFICAÇÃO DE SESSÃO DO SUPABASE & UI
// =========================================================
async function verificarSessao() {
    if (typeof clienteSupabase === 'undefined') return;

    const { data: { session } } = await clienteSupabase.auth.getSession();

    const cadastrarBtn = document.getElementById('navCadastrarBtn');
    const desktopAvatar = document.getElementById('desktopAvatar');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const mobileAvatar = document.getElementById('mobileAvatar');
    const mobileGreeting = document.getElementById('mobileGreeting');
    
    const btnLogoutDesktop = document.getElementById('btnLogoutDesktop');
    const btnLogoutMobile = document.getElementById('btnLogoutMobile');
    
    const siteHeader = document.querySelector('.site-header');

    if (session) {
        if (siteHeader) siteHeader.classList.add('is-logged-in');
        
        const metadata = session.user.user_metadata;
        const nomeCompleto = metadata?.display_name || session.user.email.split('@')[0];
        const primeiroNome = nomeCompleto.split(' ')[0];
        const inicial = primeiroNome.charAt(0).toUpperCase();
        const fotoPerfilUrl = metadata?.foto_url;

        const renderizarAvatar = (elemento) => {
            if (!elemento) return;
            if (fotoPerfilUrl) {
                elemento.innerHTML = `<img src="${fotoPerfilUrl}" alt="Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                elemento.style.border = "none";
            } else {
                elemento.innerText = inicial;
            }
        };

        renderizarAvatar(desktopAvatar);
        if (userNameDisplay) userNameDisplay.innerText = `Olá, ${primeiroNome}`;

        renderizarAvatar(mobileAvatar);
        if (mobileGreeting) mobileGreeting.innerText = `Olá, ${primeiroNome}`;

        if (cadastrarBtn) {
            cadastrarBtn.classList.remove('disabled');
            cadastrarBtn.href = "form1.html";
            cadastrarBtn.style.pointerEvents = 'auto'; 
        }

        const fazerLogout = async () => {
            await clienteSupabase.auth.signOut();
            window.location.reload();
        };
        if (btnLogoutDesktop) btnLogoutDesktop.addEventListener('click', fazerLogout);
        if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', fazerLogout);

        const hasFoto = !!metadata?.foto_url;
        const hasCidade = !!metadata?.cidade;
        const hasWhatsapp = !!metadata?.whatsapp;
        const perfilCompleto = hasFoto && hasCidade && hasWhatsapp;

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
            
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.appendChild(alertBanner);
                document.getElementById('fecharAlertaPerfil').addEventListener('click', () => {
                    alertBanner.style.display = 'none';
                    sessionStorage.setItem('alerta_perfil_oculto', 'true');
                });
            }
        }

    } else {
        if (siteHeader) siteHeader.classList.remove('is-logged-in');
        
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

// =========================================================
// 3. EVENTOS DO HEADER (TEMA ESCURO E MENU MOBILE)
// =========================================================
function inicializarScriptsDoHeader() {
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const htmlElement = document.documentElement;
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navActionsGroup = document.getElementById('navActionsGroup');

    const savedTheme = localStorage.getItem('achepet_theme');
    if (savedTheme === 'escuro') {
        htmlElement.setAttribute('data-tema', 'escuro');
        themeToggles.forEach(toggle => toggle.classList.add('active'));
    }

    themeToggles.forEach(themeToggle => {
        themeToggle.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-tema') === 'escuro';
            if (isDark) {
                htmlElement.removeAttribute('data-tema');
                localStorage.setItem('achepet_theme', 'claro');
                themeToggles.forEach(t => t.classList.remove('active')); 
            } else {
                htmlElement.setAttribute('data-tema', 'escuro');
                localStorage.setItem('achepet_theme', 'escuro');
                themeToggles.forEach(t => t.classList.add('active')); 
            }
        });
    });

    if (mobileMenuBtn && navActionsGroup) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navActionsGroup.classList.toggle('active');
        });
    }
}

// =========================================================
// 4. FUNÇÕES GLOBAIS ÚTEIS E GERADOR DE CARTÕES
// =========================================================
function formatarDataSimples(dataIso) {
    if(!dataIso) return "Data desconhecida";
    const partes = dataIso.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Função para abrir/fechar os detalhes no card
window.toggleDetalhes = function(id, btnElement) {
    const el = document.getElementById(id);
    if(el.style.display === 'none') {
        el.style.display = 'block';
        btnElement.innerHTML = 'Ocultar Detalhes';
    } else {
        el.style.display = 'none';
        btnElement.innerHTML = '+ Ver Mais Detalhes';
    }
}

// O NOVO GERADOR MESTRE DE CARTÕES
window.gerarCardAnimal = function(animal) {
    const fotoUrl = animal.foto_url || 'media/placeholder-pet.png';
    let badgeClass = '';
    let badgeText = '';
    
    if(animal.status === 'perdido') {
        badgeClass = 'lost';
        badgeText = 'PERDIDO';
    } else if (animal.status === 'achado_na_rua') {
        badgeClass = 'found';
        badgeText = 'ENCONTRADO';
    } else {
        badgeClass = 'happy';
        badgeText = 'FINAL FELIZ 💖';
    }

    const idDetalhe = `detalhe-${animal.id_animal}`;
    
    // Links para os botões do WhatsApp
    const telefoneTutor = animal.tutor_telefone || ''; 
    const numeroWhatsLimpo = telefoneTutor.replace(/\D/g, '');
    let linkWhatsApp = '#';
    if(numeroWhatsLimpo) {
         linkWhatsApp = `https://wa.me/55${numeroWhatsLimpo}?text=Olá!%20Encontrei%20seu%20animal%20perdido%20(${animal.nome})%20divulgado%20no%20AchePet!`;
    }

    const botaoWhatsAppTutor = numeroWhatsLimpo ? `
        <a href="${linkWhatsApp}" target="_blank" style="background: #25D366; color: white; padding: 10px; text-align: center; border-radius: 8px; text-decoration: none; font-weight: bold; font-family: var(--fonte-poppins); display: block; margin-top: 15px;">
            💬 WhatsApp do Tutor
        </a>
    ` : '<p style="font-size: 12px; color: red; margin-top:10px; text-align: center;">Tutor não forneceu WhatsApp</p>';

    // Tratamento caso o tutor não tenha foto
    const fotoTutor = animal.tutor_foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(animal.tutor_nome || 'A')}&background=random`;
    const nomeTutor = animal.tutor_nome || 'Tutor não identificado';

    return `
        <article class="pet-card">
            <img src="${fotoUrl}" alt="Foto de ${animal.nome}">
            <span class="pet-status ${badgeClass}">${badgeText}</span>
            <div class="pet-info">
                <h3>${animal.nome}</h3>
                <p>📌 ${animal.cidade}</p>
                <p>📅 ${formatarDataSimples(animal.data_evento)}</p>
                
                <!-- Botão Ver Mais Detalhes -->
                <button onclick="toggleDetalhes('${idDetalhe}', this)" style="background: transparent; color: var(--azul-principal); border: 1px solid var(--azul-principal); padding: 8px; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: var(--fonte-poppins); width: 100%; margin-top: 10px; transition: 0.3s;">
                    + Ver Mais Detalhes
                </button>

                <!-- Área Expandida (Escondida por defeito) -->
                <div id="${idDetalhe}" style="display: none; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                    
                    <div style="font-size: 13px; color: var(--cinza-texto); margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 8px;">
                        <strong>Descrição:</strong><br>
                        ${animal.descricao}
                    </div>

                    <!-- Dados do Tutor -->
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; background: #f3f4f6; padding: 10px; border-radius: 8px;">
                        <div style="width: 45px; height: 45px; border-radius: 50%; overflow: hidden; background: var(--cinza); border: 2px solid var(--azul-claro); flex-shrink: 0;">
                           <img src="${fotoTutor}" alt="Tutor" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="overflow: hidden;">
                            <p style="font-size: 13px; font-weight: 600; color: var(--azul-escuro); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nomeTutor}</p>
                            <p style="font-size: 11px; color: var(--cinza-texto); margin: 0;">📌 ${animal.cidade}</p>
                        </div>
                    </div>

                    ${botaoWhatsAppTutor}

                    <!-- Botão Encontrei (Só aparece se o animal estiver perdido) -->
                    ${animal.status === 'perdido' ? `
                        <button onclick="notificarTutor('${animal.id_animal}', '${animal.user_id}', '${animal.nome}')" style="background: var(--azul-principal); color: white; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: var(--fonte-poppins); width: 100%; margin-top: 10px;">
                            🚨 ENCONTREI ESSE ANIMAL
                        </button>
                    ` : ''}
                </div>
            </div>
        </article>
    `;
}

// =========================================================
// 5. CARREGAMENTO DO INDEX (MURAIS DA PÁGINA INICIAL)
// =========================================================
async function carregarUltimosPerdidos() {
    const grid = document.getElementById('ultimosPerdidosGrid');
    const loading = document.getElementById('loadingPerdidos');
    const emptyMsg = document.getElementById('emptyPerdidos');
    if (!grid) return;
    try {
        const { data: animais, error } = await clienteSupabase.from('animais').select('*').eq('status', 'perdido').eq('ativo', true).order('created_at', { ascending: false }).limit(8);
        if (error) throw error;
        if (loading) loading.style.display = 'none';
        if (animais.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }
        grid.innerHTML = '';
        animais.forEach(animal => { grid.innerHTML += gerarCardAnimal(animal); });
    } catch (err) {
        console.error(err);
        if (loading) loading.innerText = "❌ Erro ao carregar.";
    }
}

async function carregarUltimosEncontrados() {
    const grid = document.getElementById('ultimosEncontradosGrid');
    const loading = document.getElementById('loadingEncontrados');
    const emptyMsg = document.getElementById('emptyEncontrados');
    if (!grid) return;
    try {
        const { data: animais, error } = await clienteSupabase.from('animais').select('*').eq('status', 'achado_na_rua').eq('ativo', true).order('created_at', { ascending: false }).limit(8);
        if (error) throw error;
        if (loading) loading.style.display = 'none';
        if (animais.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }
        grid.innerHTML = '';
        animais.forEach(animal => { grid.innerHTML += gerarCardAnimal(animal); });
    } catch (err) {
        console.error(err);
        if (loading) loading.innerText = "❌ Erro ao carregar.";
    }
}

async function carregarUltimosFelizes() {
    const grid = document.getElementById('ultimosFelizesGrid');
    const loading = document.getElementById('loadingFelizes');
    const emptyMsg = document.getElementById('emptyFelizes');
    if (!grid) return;
    try {
        const { data: animais, error } = await clienteSupabase.from('animais').select('*').eq('status', 'final_feliz').eq('ativo', true).order('created_at', { ascending: false }).limit(8);
        if (error) throw error;
        if (loading) loading.style.display = 'none';
        if (animais.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }
        grid.innerHTML = '';
        animais.forEach(animal => { grid.innerHTML += gerarCardAnimal(animal); });
    } catch (err) {
        console.error(err);
        if (loading) loading.innerText = "❌ Erro ao carregar.";
    }
}

// =========================================================
// 6. SISTEMA GLOBAL DE NOTIFICAÇÃO (ENCONTREI O PET)
// =========================================================
window.notificarTutor = async function(idAnimal, idTutor, nomeAnimal) {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    
    if (!session) {
        alert("⚠️ Para proteger os tutores, faça login ou cadastre-se para informar que encontrou este animal.");
        window.location.href = 'login.html';
        return;
    }

    if (session.user.id === idTutor) {
        return alert("Este anúncio já pertence a você.");
    }

    const confirmacao = confirm(`Você tem certeza que encontrou ${nomeAnimal}? O seu nome e telefone serão enviados para o tutor.`);
    if (!confirmacao) return;

    try {
        const remetenteMeta = session.user.user_metadata;
        
        const { error } = await clienteSupabase.from('notificacoes').insert([{
            animal_id: idAnimal,
            tutor_id: idTutor,
            remetente_nome: remetenteMeta.display_name || 'Usuário AchePet',
            remetente_telefone: remetenteMeta.whatsapp || 'Não informado',
            remetente_cidade: remetenteMeta.cidade || 'Não informada',
            remetente_foto: remetenteMeta.foto_url || 'media/placeholder-user.png'
        }]);

        if (error) throw error;
        alert("✅ Fantástico! O tutor foi notificado e recebeu os seus dados de contato. Se puder, chame-o também no WhatsApp!");

    } catch (err) {
        console.error("Erro na notificação:", err);
        alert("❌ Erro ao notificar o tutor: " + err.message);
    }
};

// =========================================================
// 7. INICIALIZAÇÃO DA PÁGINA
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarComponentes().then(() => {
        verificarSessao();
        carregarUltimosPerdidos(); 
        carregarUltimosEncontrados();
        carregarUltimosFelizes();
    });
});