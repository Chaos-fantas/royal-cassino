// Jogo de Dados (Craps Simplificado)
window.DiceGame = {
    // Configurações do jogo
    config: {
        minBet: 5,
        maxBet: 500,
        houseEdge: 0.014, // 1.4% vantagem da casa
        animationDuration: 2000
    },
    
    // Estado do jogo
    state: {
        currentBets: {},
        totalBet: 0,
        isRolling: false,
        lastRoll: null,
        rollHistory: [],
        gamePhase: 'betting',
        point: null,
        sessionStats: {
            totalRolls: 0,
            totalWins: 0,
            totalProfit: 0
        }
    },
    
    // Elementos DOM
    elements: {},
    
    // Tipos de apostas
    betTypes: {
        pass: { name: 'Pass Line', payout: 2, description: 'Ganha com 7 ou 11 no primeiro lance' },
        dontPass: { name: "Don't Pass", payout: 2, description: 'Ganha com 2 ou 3 no primeiro lance' },
        field: { name: 'Field', payout: 2, description: 'Ganha com 2,3,4,9,10,11,12' },
        any7: { name: 'Any 7', payout: 5, description: 'Ganha se somar 7' },
        any11: { name: 'Any 11', payout: 16, description: 'Ganha se somar 11' },
        hardWays: { name: 'Hard Ways', payout: 8, description: 'Ganha com pares (4,6,8,10)' },
        big6: { name: 'Big 6', payout: 2, description: 'Ganha se sair 6 antes de 7' },
        big8: { name: 'Big 8', payout: 2, description: 'Ganha se sair 8 antes de 7' }
    },
    
    init: function(container) {
        this.createGameInterface(container);
        this.setupEventListeners();
        this.updateDisplay();
    },
    
    createGameInterface: function(container) {
        container.innerHTML = `
            <div class="dice-game">
                <div class="game-header">
                    <h2>🎲 Dados - Craps</h2>
                    <div class="game-status">
                        <div class="phase-indicator" id="phaseIndicator">Fase: Apostas</div>
                        <div class="point-display" id="pointDisplay" style="display: none;">
                            Ponto: <span id="pointValue">-</span>
                        </div>
                    </div>
                </div>
                
                <div class="dice-table">
                    <div class="dice-area">
                        <div class="dice-container" id="diceContainer">
                            <div class="die" id="die1">
                                <div class="die-face" data-value="1">⚀</div>
                            </div>
                            <div class="die" id="die2">
                                <div class="die-face" data-value="1">⚀</div>
                            </div>
                        </div>
                        
                        <div class="roll-result">
                            <div class="last-roll" id="lastRoll">Último resultado: -</div>
                            <div class="roll-total" id="rollTotal">Total: -</div>
                        </div>
                        
                        <div class="roll-controls">
                            <button id="rollDiceBtn" class="roll-button">
                                🎲 Rolar Dados
                            </button>
                        </div>
                    </div>
                    
                    <div class="betting-layout">
                        <h3>Mesa de Apostas</h3>
                        
                        <div class="betting-grid">
                            <!-- Pass Line -->
                            <div class="bet-area pass-line" data-bet="pass">
                                <div class="bet-label">PASS LINE</div>
                                <div class="bet-payout">Paga 1:1</div>
                                <div class="bet-amount" id="passAmount">R$ 0</div>
                            </div>
                            
                            <!-- Don't Pass -->
                            <div class="bet-area dont-pass" data-bet="dontPass">
                                <div class="bet-label">DON'T PASS</div>
                                <div class="bet-payout">Paga 1:1</div>
                                <div class="bet-amount" id="dontPassAmount">R$ 0</div>
                            </div>
                            
                            <!-- Field -->
                            <div class="bet-area field" data-bet="field">
                                <div class="bet-label">FIELD</div>
                                <div class="bet-payout">2,3,4,9,10,11,12</div>
                                <div class="bet-amount" id="fieldAmount">R$ 0</div>
                            </div>
                            
                            <!-- Any 7 -->
                            <div class="bet-area any-seven" data-bet="any7">
                                <div class="bet-label">ANY 7</div>
                                <div class="bet-payout">Paga 4:1</div>
                                <div class="bet-amount" id="any7Amount">R$ 0</div>
                            </div>
                            
                            <!-- Any 11 -->
                            <div class="bet-area any-eleven" data-bet="any11">
                                <div class="bet-label">ANY 11</div>
                                <div class="bet-payout">Paga 15:1</div>
                                <div class="bet-amount" id="any11Amount">R$ 0</div>
                            </div>
                            
                            <!-- Hard Ways -->
                            <div class="bet-area hard-ways" data-bet="hardWays">
                                <div class="bet-label">HARD WAYS</div>
                                <div class="bet-payout">Pares: 7:1</div>
                                <div class="bet-amount" id="hardWaysAmount">R$ 0</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="game-controls">
                    <div class="bet-controls">
                        <h3>Controles de Aposta</h3>
                        
                        <div class="bet-amount-selector">
                            <label>Valor da Aposta:</label>
                            <div class="amount-chips">
                                <button class="chip" data-amount="5">R$ 5</button>
                                <button class="chip" data-amount="10">R$ 10</button>
                                <button class="chip" data-amount="25">R$ 25</button>
                                <button class="chip" data-amount="50">R$ 50</button>
                                <button class="chip" data-amount="100">R$ 100</button>
                            </div>
                            <div class="custom-amount">
                                <input type="number" id="customAmount" min="5" max="500" placeholder="Valor personalizado">
                            </div>
                        </div>
                        
                        <div class="selected-bet-info">
                            <div>Valor selecionado: <span id="selectedAmount">R$ 5</span></div>
                            <div>Total apostado: <span id="totalBetAmount">R$ 0</span></div>
                        </div>
                        
                        <div class="bet-actions">
                            <button id="clearBetsBtn" class="action-btn secondary">Limpar Apostas</button>
                            <button id="repeatBetsBtn" class="action-btn secondary">Repetir Apostas</button>
                        </div>
                    </div>
                    
                    <div class="game-info">
                        <div class="balance-section">
                            <div class="balance-item">
                                <span class="label">Saldo:</span>
                                <span class="value" id="playerBalance">${Utils.formatCurrency(window.AppState.userBalance)}</span>
                            </div>
                        </div>
                        
                        <div class="statistics">
                            <h4>Estatísticas da Sessão</h4>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-label">Rolagens:</span>
                                    <span class="stat-value" id="totalRolls">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Vitórias:</span>
                                    <span class="stat-value" id="totalWins">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Lucro:</span>
                                    <span class="stat-value" id="sessionProfit">R$ 0,00</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Taxa:</span>
                                    <span class="stat-value" id="winRate">0%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="roll-history">
                            <h4>Histórico de Rolagens</h4>
                            <div class="history-list" id="historyList">
                                <div class="no-history">Nenhuma rolagem ainda</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="rules-section">
                    <h3>Como Jogar</h3>
                    <div class="rules-content">
                        <div class="rule-item">
                            <strong>Pass Line:</strong> Ganha com 7 ou 11 no primeiro lance. Perde com 2, 3 ou 12.
                        </div>
                        <div class="rule-item">
                            <strong>Don't Pass:</strong> Oposto do Pass Line. Ganha com 2 ou 3, perde com 7 ou 11.
                        </div>
                        <div class="rule-item">
                            <strong>Field:</strong> Aposta de uma rolagem. Ganha com 2, 3, 4, 9, 10, 11 ou 12.
                        </div>
                        <div class="rule-item">
                            <strong>Any 7:</strong> Ganha se a próxima rolagem somar 7.
                        </div>
                        <div class="rule-item">
                            <strong>Any 11:</strong> Ganha se a próxima rolagem somar 11.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.addDiceStyles();
        this.cacheElements();
    },
    
    addDiceStyles: function() {
        if (document.querySelector('#dice-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'dice-styles';
        styles.textContent = `
            .dice-game {
                max-width: 1200px;
                margin: 0 auto;
                padding: 1rem;
            }
            
            .game-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #1a1a1a;
                padding: 1rem 2rem;
                border-radius: 10px;
                border: 2px solid #FFD700;
                margin-bottom: 2rem;
            }
            
            .game-header h2 {
                color: #FFD700;
                margin: 0;
                font-size: 2rem;
            }
            
            .game-status {
                display: flex;
                gap: 2rem;
                align-items: center;
            }
            
            .phase-indicator {
                background: #006400;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-weight: bold;
            }
            
            .point-display {
                background: #DC143C;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-weight: bold;
            }
            
            .dice-table {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .dice-area {
                background: #006400;
                border: 3px solid #FFD700;
                border-radius: 15px;
                padding: 2rem;
                text-align: center;
            }
            
            .dice-container {
                display: flex;
                justify-content: center;
                gap: 2rem;
                margin: 2rem 0;
            }
            
            .die {
                width: 80px;
                height: 80px;
                background: white;
                border: 3px solid #333;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3rem;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                transition: transform 0.1s ease;
            }
            
            .die.rolling {
                animation: diceRoll 0.1s linear infinite;
            }
            
            @keyframes diceRoll {
                0% { transform: rotate(0deg); }
                25% { transform: rotate(90deg); }
                50% { transform: rotate(180deg); }
                75% { transform: rotate(270deg); }
                100% { transform: rotate(360deg); }
            }
            
            .roll-result {
                margin: 1rem 0;
                color: white;
            }
            
            .last-roll {
                font-size: 1.2rem;
                margin-bottom: 0.5rem;
            }
            
            .roll-total {
                font-size: 2rem;
                font-weight: bold;
                color: #FFD700;
            }
            
            .roll-button {
                background: linear-gradient(135deg, #DC143C, #B22222);
                color: white;
                border: 3px solid #FFD700;
                border-radius: 15px;
                padding: 1rem 2rem;
                font-size: 1.3rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 1rem;
            }
            
            .roll-button:hover:not(:disabled) {
                background: linear-gradient(135deg, #FFD700, #FFA500);
                color: #000;
                transform: scale(1.05);
            }
            
            .roll-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .betting-layout {
                background: #333;
                border: 2px solid #FFD700;
                border-radius: 10px;
                padding: 1.5rem;
            }
            
            .betting-layout h3 {
                color: #FFD700;
                text-align: center;
                margin-bottom: 1rem;
            }
            
            .betting-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }
            
            .bet-area {
                background: #1a1a1a;
                border: 2px solid #666;
                border-radius: 8px;
                padding: 1rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-height: 80px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            
            .bet-area:hover {
                border-color: #FFD700;
                background: #2a2a2a;
            }
            
            .bet-area.has-bet {
                border-color: #FFD700;
                background: #2a2a2a;
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }
            
            .bet-area.winning {
                background: #006400;
                border-color: #00FF00;
                animation: winPulse 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes winPulse {
                from { box-shadow: 0 0 10px rgba(0, 255, 0, 0.5); }
                to { box-shadow: 0 0 20px rgba(0, 255, 0, 0.8); }
            }
            
            .bet-area.losing {
                background: #8B0000;
                border-color: #FF6B6B;
            }
            
            .bet-label {
                font-weight: bold;
                color: #FFD700;
                font-size: 0.9rem;
            }
            
            .bet-payout {
                color: #ccc;
                font-size: 0.8rem;
                margin: 0.25rem 0;
            }
            
            .bet-amount {
                color: #00FF00;
                font-weight: bold;
                font-size: 0.9rem;
            }
            
            .game-controls {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
            }
            
            .bet-controls {
                background: #333;
                border: 2px solid #FFD700;
                border-radius: 10px;
                padding: 1.5rem;
            }
            
            .bet-controls h3 {
                color: #FFD700;
                margin-bottom: 1rem;
                text-align: center;
            }
            
            .amount-chips {
                display: flex;
                gap: 0.5rem;
                margin: 1rem 0;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .chip {
                background: #DC143C;
                color: white;
                border: 2px solid #FFD700;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
            }
            
            .chip:hover,
            .chip.selected {
                background: #FFD700;
                color: #000;
                transform: scale(1.1);
            }
            
            .custom-amount {
                margin: 1rem 0;
            }
            
            #customAmount {
                width: 100%;
                background: #1a1a1a;
                color: white;
                border: 2px solid #FFD700;
                border-radius: 5px;
                padding: 0.5rem;
                text-align: center;
            }
            
            .selected-bet-info {
                background: #1a1a1a;
                padding: 1rem;
                border-radius: 5px;
                margin: 1rem 0;
            }
            
            .selected-bet-info div {
                margin-bottom: 0.5rem;
                color: #FFD700;
                font-weight: bold;
            }
            
            .bet-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .action-btn {
                flex: 1;
                background: #666;
                color: white;
                border: 2px solid #999;
                border-radius: 5px;
                padding: 0.75rem;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .action-btn:hover {
                background: #999;
            }
            
            .action-btn.secondary {
                background: #444;
                border-color: #666;
            }
            
            .game-info {
                background: #1a1a1a;
                border: 2px solid #FFD700;
                border-radius: 10px;
                padding: 1.5rem;
            }
            
            .balance-section {
                margin-bottom: 1.5rem;
            }
            
            .balance-item {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem;
                background: #333;
                border-radius: 5px;
                margin-bottom: 0.5rem;
            }
            
            .label {
                color: #ccc;
            }
            
            .value {
                color: #FFD700;
                font-weight: bold;
            }
            
            .statistics h4 {
                color: #FFD700;
                margin-bottom: 1rem;
                text-align: center;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.5rem;
                margin-bottom: 1.5rem;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem;
                background: #333;
                border-radius: 5px;
                font-size: 0.9rem;
            }
            
            .stat-label {
                color: #ccc;
            }
            
            .stat-value {
                color: #FFD700;
                font-weight: bold;
            }
            
            .roll-history h4 {
                color: #FFD700;
                margin-bottom: 1rem;
                text-align: center;
            }
            
            .history-list {
                max-height: 150px;
                overflow-y: auto;
                background: #333;
                border-radius: 5px;
                padding: 0.5rem;
            }
            
            .history-item {
                display: flex;
                justify-content: space-between;
                padding: 0.25rem 0.5rem;
                border-bottom: 1px solid #555;
                font-size: 0.9rem;
            }
            
            .history-item:last-child {
                border-bottom: none;
            }
            
            .history-dice {
                color: #FFD700;
            }
            
            .history-total {
                color: #00FF00;
                font-weight: bold;
            }
            
            .no-history {
                text-align: center;
                color: #666;
                padding: 1rem;
            }
            
            .rules-section {
                background: #333;
                border: 2px solid #FFD700;
                border-radius: 10px;
                padding: 1.5rem;
                margin-top: 2rem;
            }
            
            .rules-section h3 {
                color: #FFD700;
                text-align: center;
                margin-bottom: 1rem;
            }
            
            .rules-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1rem;
            }
            
            .rule-item {
                background: #1a1a1a;
                padding: 1rem;
                border-radius: 5px;
                border-left: 4px solid #FFD700;
            }
            
            .rule-item strong {
                color: #FFD700;
            }
            
            @media (max-width: 768px) {
                .dice-table {
                    grid-template-columns: 1fr;
                }
                
                .game-controls {
                    grid-template-columns: 1fr;
                }
                
                .betting-grid {
                    grid-template-columns: 1fr;
                }
                
                .amount-chips {
                    grid-template-columns: repeat(3, 1fr);
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .rules-content {
                    grid-template-columns: 1fr;
                }
                
                .game-header {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }
                
                .game-status {
                    flex-direction: column;
                    gap: 0.5rem;
                }
            }
        `;
        document.head.appendChild(styles);
    },
    
    cacheElements: function() {
        this.elements = {
            phaseIndicator: document.getElementById('phaseIndicator'),
            pointDisplay: document.getElementById('pointDisplay'),
            pointValue: document.getElementById('pointValue'),
            die1: document.getElementById('die1'),
            die2: document.getElementById('die2'),
            lastRoll: document.getElementById('lastRoll'),
            rollTotal: document.getElementById('rollTotal'),
            rollDiceBtn: document.getElementById('rollDiceBtn'),
            selectedAmount: document.getElementById('selectedAmount'),
            totalBetAmount: document.getElementById('totalBetAmount'),
            playerBalance: document.getElementById('playerBalance'),
            clearBetsBtn: document.getElementById('clearBetsBtn'),
            repeatBetsBtn: document.getElementById('repeatBetsBtn'),
            customAmount: document.getElementById('customAmount'),
            totalRolls: document.getElementById('totalRolls'),
            totalWins: document.getElementById('totalWins'),
            sessionProfit: document.getElementById('sessionProfit'),
            winRate: document.getElementById('winRate'),
            historyList: document.getElementById('historyList')
        };
    },
    
    setupEventListeners: function() {
        // Chips de aposta
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                this.selectedBetAmount = parseInt(chip.dataset.amount);
                this.elements.selectedAmount.textContent = Utils.formatCurrency(this.selectedBetAmount);
                Utils.playSound('click');
            });
        });
        
        // Valor personalizado
        this.elements.customAmount.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value >= this.config.minBet && value <= this.config.maxBet) {
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
                this.selectedBetAmount = value;
                this.elements.selectedAmount.textContent = Utils.formatCurrency(value);
            }
        });
        
        // Áreas de aposta
        document.querySelectorAll('.bet-area').forEach(area => {
            area.addEventListener('click', () => {
                const betType = area.dataset.bet;
                this.placeBet(betType);
            });
        });
        
        // Controles do jogo
        this.elements.rollDiceBtn.addEventListener('click', () => this.rollDice());
        this.elements.clearBetsBtn.addEventListener('click', () => this.clearBets());
        this.elements.repeatBetsBtn.addEventListener('click', () => this.repeatLastBets());
        
        // Inicializar valor de aposta
        this.selectedBetAmount = 5;
        document.querySelector('.chip[data-amount="5"]').classList.add('selected');
    },
    
    placeBet: function(betType) {
        if (this.state.isRolling) {
            Utils.showNotification('Aguarde o resultado da rolagem atual!', 'warning');
            return;
        }
        
        if (!BalanceManager.canAfford(this.selectedBetAmount)) {
            Utils.showNotification('Saldo insuficiente!', 'error');
            return;
        }
        
        // Adicionar ou somar aposta
        if (!this.state.currentBets[betType]) {
            this.state.currentBets[betType] = 0;
        }
        
        this.state.currentBets[betType] += this.selectedBetAmount;
        this.state.totalBet += this.selectedBetAmount;
        
        BalanceManager.deductFunds(this.selectedBetAmount);
        this.updateBetsDisplay();
        
        Utils.playSound('coin');
        Utils.showNotification(`Aposta de ${Utils.formatCurrency(this.selectedBetAmount)} em ${this.betTypes[betType].name}`, 'success');
    },
    
    clearBets: function() {
        // Devolver dinheiro das apostas
        BalanceManager.addFunds(this.state.totalBet);
        
        // Limpar estado
        this.state.currentBets = {};
        this.state.totalBet = 0;
        
        // Atualizar interface
        this.updateBetsDisplay();
        
        Utils.showNotification('Apostas canceladas e valores devolvidos', 'info');
        Utils.playSound('click');
    },
    
    repeatLastBets: function() {
        if (!this.lastBets || Object.keys(this.lastBets).length === 0) {
            Utils.showNotification('Nenhuma aposta anterior para repetir!', 'warning');
            return;
        }
        
        const totalNeeded = Object.values(this.lastBets).reduce((sum, amount) => sum + amount, 0);
        
        if (!BalanceManager.canAfford(totalNeeded)) {
            Utils.showNotification('Saldo insuficiente para repetir apostas!', 'error');
            return;
        }
        
        // Aplicar apostas anteriores
        this.state.currentBets = { ...this.lastBets };
        this.state.totalBet = totalNeeded;
        
        BalanceManager.deductFunds(totalNeeded);
        this.updateBetsDisplay();
        
        Utils.showNotification(`Apostas repetidas: ${Utils.formatCurrency(totalNeeded)}`, 'success');
        Utils.playSound('coin');
    },
    
    updateBetsDisplay: function() {
        // Atualizar valores nas áreas de aposta
        Object.keys(this.betTypes).forEach(betType => {
            const amount = this.state.currentBets[betType] || 0;
            const element = document.getElementById(`${betType}Amount`);
            if (element) {
                element.textContent = Utils.formatCurrency(amount);
            }
            
            // Destacar áreas com apostas
            const area = document.querySelector(`[data-bet="${betType}"]`);
            if (area) {
                if (amount > 0) {
                    area.classList.add('has-bet');
                } else {
                    area.classList.remove('has-bet');
                }
            }
        });
        
        // Atualizar total
        this.elements.totalBetAmount.textContent = Utils.formatCurrency(this.state.totalBet);
        this.updateDisplay();
    },
    
    updateDisplay: function() {
        this.elements.playerBalance.textContent = Utils.formatCurrency(window.AppState.userBalance);
        
        // Atualizar estatísticas
        this.elements.totalRolls.textContent = this.state.sessionStats.totalRolls;
        this.elements.totalWins.textContent = this.state.sessionStats.totalWins;
        this.elements.sessionProfit.textContent = Utils.formatCurrency(this.state.sessionStats.totalProfit);
        
        const winRate = this.state.sessionStats.totalRolls > 0 ? 
            Math.round((this.state.sessionStats.totalWins / this.state.sessionStats.totalRolls) * 100) : 0;
        this.elements.winRate.textContent = `${winRate}%`;
        
        // Atualizar histórico
        this.updateHistory();
    },
    
    rollDice: function() {
        if (this.state.isRolling) return;
        
        if (this.state.totalBet === 0) {
            Utils.showNotification('Faça pelo menos uma aposta!', 'warning');
            return;
        }
        
        this.state.isRolling = true;
        this.elements.rollDiceBtn.disabled = true;
        this.elements.rollDiceBtn.textContent = 'Rolando...';
        
        // Salvar apostas para repetir
        this.lastBets = { ...this.state.currentBets };
        
        // Animar dados
        this.animateDice();
        
        // Gerar resultado após animação
        setTimeout(() => {
            const result = this.generateDiceResult();
            this.showDiceResult(result);
            this.processResult(result);
        }, this.config.animationDuration);
        
        Utils.playSound('click');
    },
    
    animateDice: function() {
        this.elements.die1.classList.add('rolling');
        this.elements.die2.classList.add('rolling');
        
        // Mudar faces dos dados rapidamente durante animação
        const animationInterval = setInterval(() => {
            const face1 = Math.floor(Math.random() * 6) + 1;
            const face2 = Math.floor(Math.random() * 6) + 1;
            
            this.updateDieFace(this.elements.die1, face1);
            this.updateDieFace(this.elements.die2, face2);
        }, 100);
        
        setTimeout(() => {
            clearInterval(animationInterval);
            this.elements.die1.classList.remove('rolling');
            this.elements.die2.classList.remove('rolling');
        }, this.config.animationDuration);
    },
    
    updateDieFace: function(dieElement, value) {
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const faceElement = dieElement.querySelector('.die-face');
        faceElement.textContent = faces[value - 1];
        faceElement.dataset.value = value;
    },
    
    generateDiceResult: function() {
        // Implementar vantagem da casa
        const shouldWin = Math.random() > this.config.houseEdge;
        
        let die1, die2;
        
        // Verificar se há apostas que podem ser influenciadas
        const hasPassBet = this.state.currentBets.pass > 0;
        const hasDontPassBet = this.state.currentBets.dontPass > 0;
        const hasAny7Bet = this.state.currentBets.any7 > 0;
        const hasAny11Bet = this.state.currentBets.any11 > 0;
        
        if (!shouldWin && (hasPassBet || hasDontPassBet)) {
            // Favorecer a casa em apostas principais
            if (hasPassBet && Math.random() < 0.5) {
                // Gerar 2, 3 ou 12 (perde Pass Line)
                const losingTotals = [2, 3, 12];
                const targetTotal = losingTotals[Math.floor(Math.random() * losingTotals.length)];
                [die1, die2] = this.getDiceCombination(targetTotal);
            } else if (hasDontPassBet && Math.random() < 0.5) {
                // Gerar 7 ou 11 (perde Don't Pass)
                const losingTotals = [7, 11];
                const targetTotal = losingTotals[Math.floor(Math.random() * losingTotals.length)];
                [die1, die2] = this.getDiceCombination(targetTotal);
            } else {
                // Resultado aleatório normal
                die1 = Math.floor(Math.random() * 6) + 1;
                die2 = Math.floor(Math.random() * 6) + 1;
            }
        } else {
            // Resultado normal ou favorável ao jogador
            die1 = Math.floor(Math.random() * 6) + 1;
            die2 = Math.floor(Math.random() * 6) + 1;
        }
        
        return { die1, die2, total: die1 + die2 };
    },
    
    getDiceCombination: function(targetTotal) {
        const combinations = {
            2: [[1, 1]],
            3: [[1, 2], [2, 1]],
            4: [[1, 3], [2, 2], [3, 1]],
            5: [[1, 4], [2, 3], [3, 2], [4, 1]],
            6: [[1, 5], [2, 4], [3, 3], [4, 2], [5, 1]],
            7: [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]],
            8: [[2, 6], [3, 5], [4, 4], [5, 3], [6, 2]],
            9: [[3, 6], [4, 5], [5, 4], [6, 3]],
            10: [[4, 6], [5, 5], [6, 4]],
            11: [[5, 6], [6, 5]],
            12: [[6, 6]]
        };
        
        const validCombinations = combinations[targetTotal] || [[1, 1]];
        const randomCombination = validCombinations[Math.floor(Math.random() * validCombinations.length)];
        
        return randomCombination;
    },
    
    showDiceResult: function(result) {
        this.updateDieFace(this.elements.die1, result.die1);
        this.updateDieFace(this.elements.die2, result.die2);
        
        this.elements.lastRoll.textContent = `Último resultado: ${result.die1} + ${result.die2}`;
        this.elements.rollTotal.textContent = `Total: ${result.total}`;
        
        this.state.lastRoll = result;
        this.state.rollHistory.unshift(result);
        if (this.state.rollHistory.length > 20) {
            this.state.rollHistory.pop();
        }
        
        this.state.sessionStats.totalRolls++;
    },
    
    processResult: function(result) {
        const winnings = this.calculateWinnings(result);
        let totalWon = 0;
        let hasWins = false;
        
        // Processar cada tipo de aposta
        Object.entries(winnings).forEach(([betType, payout]) => {
            const betArea = document.querySelector(`[data-bet="${betType}"]`);
            
            if (payout > 0) {
                totalWon += payout;
                hasWins = true;
                if (betArea) betArea.classList.add('winning');
            } else if (this.state.currentBets[betType] > 0) {
                if (betArea) betArea.classList.add('losing');
            }
        });
        
        // Atualizar saldo
        if (totalWon > 0) {
            BalanceManager.addFunds(totalWon);
            this.state.sessionStats.totalWins++;
            this.state.sessionStats.totalProfit += (totalWon - this.state.totalBet);
            
            Utils.showNotification(`Parabéns! Você ganhou ${Utils.formatCurrency(totalWon)}!`, 'success');
            Utils.playSound('win');
        } else {
            this.state.sessionStats.totalProfit -= this.state.totalBet;
            Utils.showNotification(`Total: ${result.total}. Tente novamente!`, 'info');
            Utils.playSound('lose');
        }
        
        // Limpar apostas após resultado
        setTimeout(() => {
            this.clearBetHighlights();
            this.state.currentBets = {};
            this.state.totalBet = 0;
            this.updateBetsDisplay();
            
            this.state.isRolling = false;
            this.elements.rollDiceBtn.disabled = false;
            this.elements.rollDiceBtn.textContent = '🎲 Rolar Dados';
        }, 2000);
        
        this.updateDisplay();
    },
    
    calculateWinnings: function(result) {
        const winnings = {};
        const total = result.total;
        
        Object.entries(this.state.currentBets).forEach(([betType, betAmount]) => {
            if (betAmount === 0) return;
            
            let won = false;
            let payout = 0;
            
            switch (betType) {
                case 'pass':
                    if (this.state.gamePhase === 'betting') {
                        won = total === 7 || total === 11;
                        if (total === 2 || total === 3 || total === 12) won = false;
                    }
                    break;
                    
                case 'dontPass':
                    if (this.state.gamePhase === 'betting') {
                        won = total === 2 || total === 3;
                        if (total === 7 || total === 11 || total === 12) won = false;
                    }
                    break;
                    
                case 'field':
                    won = [2, 3, 4, 9, 10, 11, 12].includes(total);
                    break;
                    
                case 'any7':
                    won = total === 7;
                    break;
                    
                case 'any11':
                    won = total === 11;
                    break;
                    
                case 'hardWays':
                    won = (total === 4 || total === 6 || total === 8 || total === 10) && 
                          result.die1 === result.die2;
                    break;
                    
                case 'big6':
                    won = total === 6;
                    break;
                    
                case 'big8':
                    won = total === 8;
                    break;
            }
            
            if (won) {
                payout = betAmount * this.betTypes[betType].payout;
            }
            
            winnings[betType] = payout;
        });
        
        return winnings;
    },
    
    clearBetHighlights: function() {
        document.querySelectorAll('.bet-area').forEach(area => {
            area.classList.remove('winning', 'losing');
        });
    },
    
    updateHistory: function() {
        if (this.state.rollHistory.length === 0) {
            this.elements.historyList.innerHTML = '<div class="no-history">Nenhuma rolagem ainda</div>';
            return;
        }
        
        this.elements.historyList.innerHTML = this.state.rollHistory
            .map(roll => `
                <div class="history-item">
                    <span class="history-dice">${roll.die1} + ${roll.die2}</span>
                    <span class="history-total">${roll.total}</span>
                </div>
            `).join('');
    }
};

