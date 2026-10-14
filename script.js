// Variável global para sabermos se o utilizador está logado
window.sessaoAtual = null;

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
    window.sessaoAtual = session;

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
// 3. EVENTOS DO HEADER
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
// 4. FUNÇÕES GLOBAIS E GERADOR DE CARTÕES
// =========================================================
function formatarDataSimples(dataIso) {
    if(!dataIso) return "Data desconhecida";
    const partes = dataIso.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

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

// O NOVO GERADOR DE CARTÕES
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

    let areaDetalhesHTML = '';

    if (animal.status !== 'final_feliz') {
        const idDetalhe = `detalhe-${animal.id_animal}`;
        let areaContatoHTML = '';
        const descricaoPet = animal.descricao ? animal.descricao : 'Nenhuma descrição detalhada fornecida.';

        // NÃO LOGADO: Trava total
        if (!window.sessaoAtual) {
            areaContatoHTML = `
                <div style="margin-top: 15px; padding: 15px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; text-align: center;">
                    <p style="color: #991b1b; font-size: 13px; margin: 0; font-weight: 600;">🔒 Faça login para ver quem cadastrou e entrar em contato.</p>
                </div>
            `;
        } 
        // LOGADO: Exibe dados de quem cadastrou e o botão híbrido
        else {
            const fotoTutor = animal.tutor_foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(animal.tutor_nome || 'U')}&background=random`;
            const nomeTutor = animal.tutor_nome || 'Usuário não identificado';
            const telefoneTutor = animal.tutor_telefone || ''; 
            const numeroWhatsLimpo = telefoneTutor.replace(/\D/g, '');
            
            let botaoCTA = '';
            
            if(numeroWhatsLimpo) {
                // Ao invés de um link (a href), é um botão que dispara a notificação e o modal
                botaoCTA = `
                    <button onclick="acionarFluxoContato('${animal.id_animal}', '${animal.user_id}', '${animal.nome}', '${numeroWhatsLimpo}', '${animal.status}')" style="background: transparent; color: var(--azul-principal); border: 1px solid var(--azul-principal); padding: 10px; width: 100%; text-align: center; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; font-family: var(--fonte-poppins); margin-top: 15px; transition: 0.3s;">
                        🐾 Encontrei ou tenho informações sobre esse pet
                    </button>
                `;
            } else {
                botaoCTA = '<p style="font-size: 12px; color: #dc2626; margin-top:10px; text-align: center;">Contato não fornecido</p>';
            }

            areaContatoHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 15px; background: #f3f4f6; padding: 10px; border-radius: 8px;">
                    <div style="width: 45px; height: 45px; border-radius: 50%; overflow: hidden; background: var(--cinza); border: 2px solid var(--azul-claro); flex-shrink: 0;">
                       <img src="${fotoTutor}" alt="Contato" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="overflow: hidden;">
                        <p style="font-size: 13px; font-weight: 600; color: var(--azul-escuro); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nomeTutor}</p>
                        <p style="font-size: 11px; color: var(--cinza-texto); margin: 0;">📌 ${animal.cidade}</p>
                    </div>
                </div>
                ${botaoCTA}
            `;
        }

        areaDetalhesHTML = `
            <button onclick="toggleDetalhes('${idDetalhe}', this)" style="background: transparent; color: var(--azul-principal); border: 1px solid var(--azul-principal); padding: 8px; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: var(--fonte-poppins); width: 100%; margin-top: 10px; transition: 0.3s;">
                + Ver Mais Detalhes
            </button>
            <div id="${idDetalhe}" style="display: none; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                <div style="font-size: 13px; color: var(--cinza-texto); background: #f8fafc; padding: 10px; border-radius: 8px;">
                    <strong>Descrição:</strong><br>${descricaoPet}
                </div>
                ${areaContatoHTML}
            </div>
        `;
    }

    return `
        <article class="pet-card">
            <img src="${fotoUrl}" alt="Foto de ${animal.nome}">
            <span class="pet-status ${badgeClass}">${badgeText}</span>
            <div class="pet-info">
                <h3>${animal.nome}</h3>
                <p>📌 ${animal.cidade}</p>
                <p>📅 ${formatarDataSimples(animal.data_evento)}</p>
                ${areaDetalhesHTML}
            </div>
        </article>
    `;
}

// =========================================================
// 5. FLUXO HÍBRIDO (NOTIFICAÇÃO + MODAL)
// =========================================================
window.acionarFluxoContato = async function(idAnimal, idTutor, nomeAnimal, numeroWhatsTutor, statusAnimal) {
    if (!window.sessaoAtual) {
        alert("🔒 Faça login para entrar em contato.");
        return;
    }

    if (window.sessaoAtual.user.id === idTutor) {
        return alert("Este anúncio foi criado por você.");
    }

    // 1. Grava a Notificação Interna
    try {
        const remetenteMeta = window.sessaoAtual.user.user_metadata;
        await clienteSupabase.from('notificacoes').insert([{
            animal_id: idAnimal,
            tutor_id: idTutor,
            remetente_nome: remetenteMeta.display_name || 'Usuário AchePet',
            remetente_telefone: remetenteMeta.whatsapp || 'Não informado',
            remetente_cidade: remetenteMeta.cidade || 'Não informada',
            remetente_foto: remetenteMeta.foto_url || 'media/placeholder-user.png'
        }]);
    } catch (err) {
        console.error("Notificação interna falhou:", err);
    }

    // 2. Abre o Modal Responsivo com o Link do WhatsApp
    const modalExistente = document.getElementById('modal-contato-achepet');
    if (modalExistente) modalExistente.remove();

    let textoMensagem = statusAnimal === 'perdido' 
        ? `Olá! Tenho informações sobre o pet (${nomeAnimal}) divulgado no AchePet!`
        : `Olá! Acredito que o animal (${nomeAnimal}) que você encontrou no AchePet seja meu!`;
    
    const linkWhatsApp = `https://wa.me/55${numeroWhatsTutor}?text=${encodeURIComponent(textoMensagem)}`;

    const modalHTML = `
        <div id="modal-contato-achepet" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; box-sizing: border-box; backdrop-filter: blur(3px);">
            <div style="background: white; border-radius: 12px; padding: 25px; max-width: 400px; width: 100%; text-align: center; font-family: var(--fonte-poppins); position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <button onclick="document.getElementById('modal-contato-achepet').remove()" style="position: absolute; top: 12px; right: 15px; background: transparent; border: none; font-size: 24px; color: var(--cinza-texto); cursor: pointer;">&times;</button>
                
                <div style="font-size: 45px; margin-bottom: 10px;">✅</div>
                <h3 style="color: var(--azul-escuro); margin-bottom: 10px; font-size: 18px;">Compartilhamos seus dados!</h3>
                <p style="color: var(--cinza-texto); font-size: 13px; margin-bottom: 25px; line-height: 1.5;">
                    Já compartilhamos os seus dados de contato com quem cadastrou o pet. Deseja enviar uma mensagem para quem cadastrou o pet?
                </p>
                
                <a href="${linkWhatsApp}" target="_blank" onclick="document.getElementById('modal-contato-achepet').remove()" style="display: block; background: #25D366; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
                    Entrar em contato
                </a>
                
                <button onclick="document.getElementById('modal-contato-achepet').remove()" style="display: block; width: 100%; background: transparent; color: var(--cinza-texto); border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">
                    Fechar
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// =========================================================
// 6. CARREGAMENTO DO INDEX (MURAIS DA PÁGINA INICIAL)
// =========================================================
async function carregarUltimosPerdidos() {
    const grid = document.getElementById('ultimosPerdidosGrid');
    if (!grid) return;
    try {
        const { data: animais, error } = await clienteSupabase.from('animais').select('*').eq('status', 'perdido').eq('ativo', true).order('created_at', { ascending: false }).limit(8);
        if (error) throw error;
        document.getElementById('loadingPerdidos').style.display = 'none';
        if (animais.length === 0) return document.getElementById('emptyPerdidos').style.display = 'block';
        grid.innerHTML = '';
        animais.forEach(animal => { grid.innerHTML += gerarCardAnimal(animal); });
    } catch (err) { console.error(err); }
}

async function carregarUltimosEncontrados() {
    const grid = document.getElementById('ultimosEncontradosGrid');
    if (!grid) return;
    try {
        const { data: animais, error } = await clienteSupabase.from('animais').select('*').eq('status', 'achado_na_rua').eq('ativo', true).order('created_at', { ascending: false }).limit(8);
        if (error) throw error;
        document.getElementById('loadingEncontrados').style.display = 'none';
        if (animais.length === 0) return document.getElementById('emptyEncontrados').style.display = 'block';
        grid.innerHTML = '';
        animais.forEach(animal => { grid.innerHTML += gerarCardAnimal(animal); });
    } catch (err) { console.error(err); }
}

async function carregarUltimosFelizes() {
    const grid = document.getElementById('ultimosFelizesGrid');
    if (!grid) return;
    try {
        const { data: animais, error } = await clienteSupabase.from('animais').select('*').eq('status', 'final_feliz').eq('ativo', true).order('created_at', { ascending: false }).limit(8);
        if (error) throw error;
        document.getElementById('loadingFelizes').style.display = 'none';
        if (animais.length === 0) return document.getElementById('emptyFelizes').style.display = 'block';
        grid.innerHTML = '';
        animais.forEach(animal => { grid.innerHTML += gerarCardAnimal(animal); });
    } catch (err) { console.error(err); }
}

// =========================================================
// 7. INICIALIZAÇÃO DA PÁGINA
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarComponentes().then(async () => {
        await verificarSessao(); 
        carregarUltimosPerdidos(); 
        carregarUltimosEncontrados();
        carregarUltimosFelizes();
    });
});

// =========================================================
// 8. SISTEMA DE LOGOUT AUTOMÁTICO (5 MINUTOS DE INATIVIDADE)
// =========================================================
const TEMPO_INATIVIDADE = 5 * 60 * 1000;
let timerInatividade;

function resetarTimerInatividade() {
    if (!window.sessaoAtual) return;
    clearTimeout(timerInatividade);
    timerInatividade = setTimeout(logoutPorInatividade, TEMPO_INATIVIDADE);
}

async function logoutPorInatividade() {
    if (typeof clienteSupabase !== 'undefined') {
        await clienteSupabase.auth.signOut();
    }
    window.sessaoAtual = null;
    alert("🔒 A sua sessão expirou devido a 5 minutos de inatividade. Por favor, faça login novamente para sua segurança.");
    window.location.replace('login.html');
}

const eventosAtividade = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
eventosAtividade.forEach(evento => {
    document.addEventListener(evento, resetarTimerInatividade, true);
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(resetarTimerInatividade, 2000); 
});