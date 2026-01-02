/**
 * BQNexus - Sistema de Gestão de Questões Médicas
 * Lógica de filtragem, estado e renderização dinâmica
 */

// --- ESTADO GLOBAL ---
let questoes = [];
let selectedCycle = 'Ciclo Básico';
let selectedModalidade = 'PBL'; // PBL definido como prioridade/padrão
let selectedModules = new Set();
let quantity = 20;

/**
 * Inicialização: Carrega os dados e configura a interface
 */
async function carregarBancoDeQuestoes() {
    try {
        // Carregamento via fetch (Caminho relativo para ambiente estático)
        const response = await fetch("data/questoes.json");

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        questoes = await response.json();

        // Atualiza o contador total bruto no rodapé da lateral
        const totalElement = document.getElementById("total-questoes");
        if (totalElement) {
            totalElement.innerText = questoes.length;
        }

        console.log(`Questões carregadas: ${questoes.length}`);

        // Define o estado inicial da UI
        setCycle('Ciclo Básico');

    } catch (error) {
        console.error("Erro crítico ao carregar o banco de questões:", error);
    }
}

/**
 * Define o Ciclo Atual (Básico, Clínico ou Internato)
 * @param {string} cycle 
 */
function setCycle(cycle) {
    selectedCycle = cycle;
    selectedModules.clear(); // Limpa seleção ao trocar de ciclo
    
    // Atualização Visual dos Cards de Ciclo
    document.querySelectorAll('.cycle-card').forEach(card => {
        card.classList.remove('active');
    });

    const activeId = cycle === 'Ciclo Básico' ? 'cycle-basico' : 
                     cycle === 'Ciclo Clínico' ? 'cycle-clinico' : 'cycle-internato';
    
    const activeCard = document.getElementById(activeId);
    if (activeCard) activeCard.classList.add('active');

    renderModules();
    updateFilteredCount();
}

/**
 * Alterna entre PBL e Tradicional
 * @param {string} mod 
 */
function setModalidade(mod) {
    selectedModalidade = mod;
    
    // Atualização Visual dos botões de Toggle
    const btnPbl = document.getElementById('mod-pbl');
    const btnTrad = document.getElementById('mod-tradicional');

    if (mod === 'PBL') {
        btnPbl.classList.add('active');
        btnTrad.classList.remove('active');
    } else {
        btnTrad.classList.add('active');
        btnPbl.classList.remove('active');
    }
    
    updateFilteredCount();
}

/**
 * Renderiza a lista de módulos baseada no ciclo e na ordem lógica
 */
function renderModules() {
    const container = document.getElementById('modules-container');
    if (!container) return;
    
    container.innerHTML = '';

    // Filtra e ordena módulos numericamente (Ex: Módulo 1, Módulo 2...)
    const modulesInCycle = [...new Set(questoes
        .filter(q => q.ciclo === selectedCycle)
        .map(q => q.modulo))
    ].sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)) || 0;
        const numB = parseInt(b.match(/\d+/)) || 0;
        return numA - numB;
    });

    if (modulesInCycle.length === 0) {
        container.innerHTML = '<p class="text-slate-600 text-xs italic p-4 text-center">Nenhum módulo disponível para este ciclo.</p>';
        return;
    }

    modulesInCycle.forEach(modName => {
        const card = document.createElement('div');
        card.className = 'premium-card p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-all border-white/5';
        
        // Permite selecionar clicando em qualquer lugar do card
        card.onclick = (e) => {
            const cb = card.querySelector('input');
            cb.checked = !cb.checked;
            toggleModule(modName);
        };

        card.innerHTML = `
            <div class="flex items-center gap-4">
                <input type="checkbox" class="custom-checkbox" onclick="event.stopPropagation()" onchange="toggleModule('${modName}')">
                <span class="text-xs font-bold text-slate-300 tracking-tight">${modName}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-slate-700">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        `;
        container.appendChild(card);
    });
}

/**
 * Gerencia a lista de módulos selecionados para o filtro
 */
function toggleModule(modName) {
    if (selectedModules.has(modName)) {
        selectedModules.delete(modName);
    } else {
        selectedModules.add(modName);
    }
    updateFilteredCount();
}

/**
 * Lógica para os Toggles de Status (Não Respondidas / Erros)
 */
function toggleFilter(id) {
    const el = document.getElementById(id);
    if (el) {
        el.checked = !el.checked;
        updateFilteredCount();
    }
}

/**
 * Calcula em tempo real quantas questões batem com os filtros ativos
 */
function updateFilteredCount() {
    const showUnanswered = document.getElementById('filter-unanswered')?.checked;
    const showErrors = document.getElementById('filter-errors')?.checked;

    const filtered = questoes.filter(q => {
        const matchCycle = q.ciclo === selectedCycle;
        const matchModality = q.modalidade === selectedModalidade;
        const matchModule = selectedModules.size === 0 || selectedModules.has(q.modulo);
        
        let matchStatus = false;
        // Se ambos desmarcados, resultado é 0 por padrão de segurança
        if (showUnanswered && q.status === 'Nao Respondida') matchStatus = true;
        if (showErrors && q.status === 'Erro') matchStatus = true;

        return matchCycle && matchModality && matchModule && matchStatus;
    });

    const countDisplay = document.getElementById('questions-found-count');
    if (countDisplay) {
        countDisplay.innerText = filtered.length;
    }

    // Gerenciamento do estado do botão principal
    const btnGenerate = document.getElementById('btn-generate-notebook');
    if (btnGenerate) {
        btnGenerate.disabled = (filtered.length === 0);
    }
}

/**
 * Ajusta a quantidade de questões do caderno (+/-)
 */
function adjustQuantity(val) {
    quantity = Math.max(5, Math.min(100, quantity + val));
    const display = document.getElementById('quantity-display');
    if (display) display.innerText = quantity;
}

/**
 * Simula a geração do caderno e fornece feedback ao usuário
 */
function generateNotebook() {
    const countFound = parseInt(document.getElementById('questions-found-count').innerText || "0");
    const finalQty = Math.min(quantity, countFound);
    
    const msg = `Caderno BQNexus gerado com sucesso! Selecionamos as ${finalQty} melhores questões de ${selectedCycle} (${selectedModalidade}) para o seu nível.`;
    
    showModal(msg);
}

/**
 * Controle do Modal de Feedback
 */
function showModal(text) {
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modal-text');
    if (modal && modalText) {
        modalText.innerText = text;
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('hidden');
}

// Inicializa o processo ao carregar o script
carregarBancoDeQuestoes();
