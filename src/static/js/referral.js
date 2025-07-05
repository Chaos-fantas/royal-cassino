// Sistema de Referência
window.ReferralSystem = {
    // Configurações do sistema
    config: {
        freeGameCredits: 50, // Créditos para jogo grátis
        referrerBonus: 25,   // Bônus para quem indicou
        referredBonus: 25,   // Bônus para quem foi indicado
        validGames: ['slots', 'roulette', 'dice'], // Jogos válidos para jogo grátis
        houseEdgeApplies: true // Vantagem da casa ainda se aplica
    },
    
    // Estado do sistema
    state: {
        userReferralCode: null,
        referralStats: {
            totalReferred: 0,
            totalEarned: 0,
            pendingRewards: 0
        },
        freeGameCredits: 0,
        usedReferralCode: null
    },
    
    // Elementos DOM
    elements: {},
    
    init: function() {
        this.generateUserReferralCode();
        this.checkUrlForReferralCode();
        this.createReferralInterface();
        this.loadReferralStats();
    },
    
    generateUserReferralCode: function() {
        // Gerar código único baseado no usuário
        const userId = window.Auth?.getCurrentUser()?.id || 'guest';
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        this.state.userReferralCode = `REF${userId}${timestamp}${random}`.toUpperCase();
    },
    
    checkUrlForReferralCode: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
        
        if (referralCode && !this.state.usedReferralCode) {
            this.processReferralCode(referralCode);
        }
    },
    
    processReferralCode: function(referralCode) {
        // Verificar se o código é válido e não é do próprio usuário
        if (referralCode === this.state.userReferralCode) {
            this.showNotification('Você não pode usar seu próprio código de referência!', 'warning');
            return;
        }
        
        // Simular verificação no backend
        this.validateReferralCode(referralCode).then(isValid => {
            if (isValid) {
                this.state.usedReferralCode = referralCode;
                this.grantReferralBonuses(referralCode);
                this.showNotification('Código de referência aplicado! Você ganhou créditos grátis!', 'success');
            } else {
                this.showNotification('Código de referência inválido.', 'error');
            }
        });
    },
    
    validateReferralCode: function(code) {
        // Simulação de validação - em produção seria uma chamada API
        return new Promise(resolve => {
            setTimeout(() => {
                // Simular 80% de chance de código válido para demonstração
                resolve(Math.random() > 0.2);
            }, 500);
        });
    },
    
    grantReferralBonuses: function(referralCode) {
        // Conceder bônus para o usuário referido
        this.state.freeGameCredits += this.config.referredBonus;
        
        // Simular concessão de bônus para quem indicou
        this.notifyReferrer(referralCode);
        
        // Atualizar interface
        this.updateReferralInterface();
        
        // Salvar no localStorage para persistência
        this.saveReferralData();
    },
    
    notifyReferrer: function(referralCode) {
        // Em produção, isso seria uma chamada API para creditar o referenciador
        console.log(`Creditando ${this.config.referrerBonus} créditos para o dono do código ${referralCode}`);
        
        // Simular atualização das estatísticas do referenciador
        this.state.referralStats.totalReferred += 1;
        this.state.referralStats.totalEarned += this.config.referrerBonus;
    },
    
    createReferralInterface: function() {
        // Criar seção de referência no menu da conta
        const accountSection = document.querySelector('#account') || document.body;
        
        const referralSection = document.createElement('div');
        referralSection.id = 'referral-section';
        referralSection.className = 'referral-section';
        referralSection.innerHTML = `
            <div class="referral-container">
                <h3>🎁 Sistema de Referência</h3>
                
                <div class="referral-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="total-referred">${this.state.referralStats.totalReferred}</div>
                        <div class="stat-label">Amigos Indicados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="total-earned">R$ ${this.state.referralStats.totalEarned}</div>
                        <div class="stat-label">Total Ganho</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="free-credits">${this.state.freeGameCredits}</div>
                        <div class="stat-label">Créditos Grátis</div>
                    </div>
                </div>
                
                <div class="referral-code-section">
                    <h4>Seu Código de Referência</h4>
                    <div class="code-display">
                        <input type="text" id="referral-code-input" value="${this.state.userReferralCode}" readonly>
                        <button id="copy-code-btn" class="btn btn-primary">Copiar</button>
                    </div>
                    <p class="code-description">
                        Compartilhe este código com seus amigos. Quando eles se registrarem usando seu código,
                        vocês dois ganharão créditos grátis para jogar!
                    </p>
                </div>
                
                <div class="referral-link-section">
                    <h4>Link de Referência</h4>
                    <div class="link-display">
                        <input type="text" id="referral-link-input" readonly>
                        <button id="copy-link-btn" class="btn btn-secondary">Copiar Link</button>
                    </div>
                    <div class="share-buttons">
                        <button id="share-whatsapp" class="btn btn-success">📱 WhatsApp</button>
                        <button id="share-telegram" class="btn btn-info">✈️ Telegram</button>
                        <button id="share-facebook" class="btn btn-primary">📘 Facebook</button>
                    </div>
                </div>
                
                <div class="free-game-section" id="free-game-section" style="display: ${this.state.freeGameCredits > 0 ? 'block' : 'none'}">
                    <h4>🎮 Jogos Grátis Disponíveis</h4>
                    <p>Você tem <strong>${this.state.freeGameCredits}</strong> créditos para jogos grátis!</p>
                    <div class="free-game-buttons">
                        <button class="btn btn-warning" onclick="ReferralSystem.playFreeGame('slots')">🎰 Slots Grátis</button>
                        <button class="btn btn-warning" onclick="ReferralSystem.playFreeGame('roulette')">🎯 Roleta Grátis</button>
                        <button class="btn btn-warning" onclick="ReferralSystem.playFreeGame('dice')">🎲 Dados Grátis</button>
                    </div>
                    <small>* A vantagem da casa ainda se aplica aos jogos grátis</small>
                </div>
                
                <div class="referral-rules">
                    <h4>Como Funciona</h4>
                    <ul>
                        <li>Compartilhe seu código ou link com amigos</li>
                        <li>Quando eles se registrarem, vocês dois ganham R$ ${this.config.referredBonus} em créditos grátis</li>
                        <li>Use os créditos grátis para jogar sem risco</li>
                        <li>Ganhos dos jogos grátis são creditados na sua conta</li>
                        <li>Não há limite para o número de referências</li>
                    </ul>
                </div>
            </div>
        `;
        
        // Adicionar estilos
        this.addReferralStyles();
        
        // Inserir na página (pode ser em um modal ou seção específica)
        if (!document.getElementById('referral-section')) {
            document.body.appendChild(referralSection);
        }
        
        // Configurar event listeners
        this.setupReferralEventListeners();
        
        // Atualizar link de referência
        this.updateReferralLink();
    },
    
    setupReferralEventListeners: function() {
        // Copiar código
        document.getElementById('copy-code-btn')?.addEventListener('click', () => {
            this.copyToClipboard(this.state.userReferralCode);
            this.showNotification('Código copiado!', 'success');
        });
        
        // Copiar link
        document.getElementById('copy-link-btn')?.addEventListener('click', () => {
            const link = document.getElementById('referral-link-input').value;
            this.copyToClipboard(link);
            this.showNotification('Link copiado!', 'success');
        });
        
        // Compartilhamento social
        document.getElementById('share-whatsapp')?.addEventListener('click', () => {
            this.shareOnWhatsApp();
        });
        
        document.getElementById('share-telegram')?.addEventListener('click', () => {
            this.shareOnTelegram();
        });
        
        document.getElementById('share-facebook')?.addEventListener('click', () => {
            this.shareOnFacebook();
        });
    },
    
    updateReferralLink: function() {
        const baseUrl = window.location.origin;
        const referralLink = `${baseUrl}?ref=${this.state.userReferralCode}`;
        const linkInput = document.getElementById('referral-link-input');
        if (linkInput) {
            linkInput.value = referralLink;
        }
    },
    
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    },
    
    shareOnWhatsApp: function() {
        const message = `🎰 Venha jogar no Royal Casino! Use meu código de referência ${this.state.userReferralCode} e ganhe créditos grátis! ${this.getReferralLink()}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },
    
    shareOnTelegram: function() {
        const message = `🎰 Venha jogar no Royal Casino! Use meu código de referência ${this.state.userReferralCode} e ganhe créditos grátis!`;
        const url = `https://t.me/share/url?url=${encodeURIComponent(this.getReferralLink())}&text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },
    
    shareOnFacebook: function() {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.getReferralLink())}`;
        window.open(url, '_blank');
    },
    
    getReferralLink: function() {
        return `${window.location.origin}?ref=${this.state.userReferralCode}`;
    },
    
    playFreeGame: function(gameType) {
        if (this.state.freeGameCredits <= 0) {
            this.showNotification('Você não tem créditos grátis disponíveis!', 'warning');
            return;
        }
        
        if (!this.config.validGames.includes(gameType)) {
            this.showNotification('Este jogo não está disponível para jogos grátis!', 'warning');
            return;
        }
        
        // Deduzir crédito
        this.state.freeGameCredits -= 1;
        this.updateReferralInterface();
        this.saveReferralData();
        
        // Iniciar jogo grátis
        this.startFreeGame(gameType);
        
        this.showNotification(`Jogo grátis iniciado! Créditos restantes: ${this.state.freeGameCredits}`, 'info');
    },
    
    startFreeGame: function(gameType) {
        // Marcar que é um jogo grátis
        window.isFreeGame = true;
        window.freeGameCredits = this.config.freeGameCredits;
        
        // Abrir o jogo
        if (window.openGame) {
            window.openGame(gameType);
        }
        
        // Configurar callback para quando o jogo terminar
        this.setupFreeGameCallback(gameType);
    },
    
    setupFreeGameCallback: function(gameType) {
        // Monitorar quando o jogo grátis termina
        const originalCloseGame = window.closeGameModal;
        window.closeGameModal = function(game) {
            if (window.isFreeGame && game === gameType) {
                // Processar resultado do jogo grátis
                ReferralSystem.processFreeGameResult();
                window.isFreeGame = false;
                window.freeGameCredits = 0;
            }
            if (originalCloseGame) {
                originalCloseGame(game);
            }
        };
    },
    
    processFreeGameResult: function() {
        // Aplicar vantagem da casa mesmo em jogos grátis
        if (window.freeGameWinnings > 0) {
            const houseEdge = 0.05; // 5% vantagem da casa
            const finalWinnings = Math.floor(window.freeGameWinnings * (1 - houseEdge));
            
            // Creditar ganhos na conta do usuário
            if (window.BalanceManager) {
                window.BalanceManager.addBalance(finalWinnings);
            }
            
            this.showNotification(`Jogo grátis finalizado! Você ganhou R$ ${finalWinnings}!`, 'success');
        } else {
            this.showNotification('Jogo grátis finalizado. Tente novamente!', 'info');
        }
        
        window.freeGameWinnings = 0;
    },
    
    updateReferralInterface: function() {
        // Atualizar estatísticas na interface
        const totalReferredEl = document.getElementById('total-referred');
        const totalEarnedEl = document.getElementById('total-earned');
        const freeCreditsEl = document.getElementById('free-credits');
        const freeGameSection = document.getElementById('free-game-section');
        
        if (totalReferredEl) totalReferredEl.textContent = this.state.referralStats.totalReferred;
        if (totalEarnedEl) totalEarnedEl.textContent = `R$ ${this.state.referralStats.totalEarned}`;
        if (freeCreditsEl) freeCreditsEl.textContent = this.state.freeGameCredits;
        
        if (freeGameSection) {
            freeGameSection.style.display = this.state.freeGameCredits > 0 ? 'block' : 'none';
            const creditsText = freeGameSection.querySelector('p strong');
            if (creditsText) {
                creditsText.textContent = this.state.freeGameCredits;
            }
        }
    },
    
    loadReferralStats: function() {
        // Carregar dados salvos do localStorage
        const savedData = localStorage.getItem('referralData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.state.referralStats = data.referralStats || this.state.referralStats;
            this.state.freeGameCredits = data.freeGameCredits || this.state.freeGameCredits;
            this.state.usedReferralCode = data.usedReferralCode || this.state.usedReferralCode;
        }
    },
    
    saveReferralData: function() {
        // Salvar dados no localStorage
        const dataToSave = {
            referralStats: this.state.referralStats,
            freeGameCredits: this.state.freeGameCredits,
            usedReferralCode: this.state.usedReferralCode,
            userReferralCode: this.state.userReferralCode
        };
        localStorage.setItem('referralData', JSON.stringify(dataToSave));
    },
    
    addReferralStyles: function() {
        if (document.getElementById('referral-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'referral-styles';
        styles.textContent = `
            .referral-section {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 15px;
                padding: 2rem;
                margin: 2rem 0;
                color: white;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            
            .referral-container h3 {
                text-align: center;
                color: #FFD700;
                margin-bottom: 2rem;
                font-size: 1.8rem;
            }
            
            .referral-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
                padding: 1.5rem;
                text-align: center;
                border: 1px solid rgba(255,215,0,0.3);
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                color: #FFD700;
                margin-bottom: 0.5rem;
            }
            
            .stat-label {
                font-size: 0.9rem;
                opacity: 0.8;
            }
            
            .referral-code-section, .referral-link-section {
                margin-bottom: 2rem;
                padding: 1.5rem;
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
            }
            
            .code-display, .link-display {
                display: flex;
                gap: 0.5rem;
                margin: 1rem 0;
            }
            
            .code-display input, .link-display input {
                flex: 1;
                padding: 0.75rem;
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 5px;
                background: rgba(255,255,255,0.1);
                color: white;
                font-family: monospace;
                font-size: 1.1rem;
            }
            
            .share-buttons {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
                flex-wrap: wrap;
            }
            
            .free-game-section {
                background: linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%);
                border-radius: 10px;
                padding: 1.5rem;
                margin-bottom: 2rem;
                border: 2px solid #4CAF50;
            }
            
            .free-game-buttons {
                display: flex;
                gap: 0.5rem;
                margin: 1rem 0;
                flex-wrap: wrap;
            }
            
            .referral-rules {
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
                padding: 1.5rem;
            }
            
            .referral-rules ul {
                list-style: none;
                padding: 0;
            }
            
            .referral-rules li {
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .referral-rules li:before {
                content: "✓ ";
                color: #4CAF50;
                font-weight: bold;
                margin-right: 0.5rem;
            }
            
            @media (max-width: 768px) {
                .referral-section {
                    padding: 1rem;
                    margin: 1rem 0;
                }
                
                .code-display, .link-display {
                    flex-direction: column;
                }
                
                .share-buttons, .free-game-buttons {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(styles);
    },
    
    showNotification: function(message, type = 'info') {
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, type);
        } else {
            alert(message);
        }
    },
    
    // Função para mostrar o modal de referência
    showReferralModal: function() {
        let modal = document.getElementById('referralModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'referralModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🎁 Sistema de Referência</h2>
                        <button class="close-btn" onclick="closeModal('referralModal')">&times;</button>
                    </div>
                    <div id="referral-modal-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Mover conteúdo para o modal
        const referralSection = document.getElementById('referral-section');
        const modalContent = document.getElementById('referral-modal-content');
        if (referralSection && modalContent) {
            modalContent.innerHTML = referralSection.innerHTML;
            this.setupReferralEventListeners();
        }
        
        modal.style.display = 'block';
    }
};

// Função global para fechar modais
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Inicializar sistema de referência quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    if (window.ReferralSystem) {
        window.ReferralSystem.init();
    }
});

// Exportar para uso global
window.ReferralSystem = ReferralSystem;

