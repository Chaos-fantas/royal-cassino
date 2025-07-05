// Jogo de Baccarat
window.BaccaratGame = {
    // Configurações do jogo
    config: {
        minBet: 10,
        maxBet: 1000,
        houseEdge: {
            banker: 0.0106, // 1.06% vantagem da casa
            player: 0.0124, // 1.24% vantagem da casa
            tie: 0.1436     // 14.36% vantagem da casa
        },
        commission: 0.05, // 5% comissão em apostas no banker
        cardValues: {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
            '6': 6, '7': 7, '8': 8, '9': 9,
            '10': 0, 'J': 0, 'Q': 0, 'K': 0
        }
    },
    
    // Estado do jogo
    state: {
        currentBets: {
            player: 0,
            banker: 0,
            tie: 0
        },
        playerHand: [],
        bankerHand: [],
        playerScore: 0,
        bankerScore: 0,
        gameResult: null,
        isDealing: false,
        deck: [],
        totalGames: 0,
        gamesWon: 0,
        totalWagered: 0,
        totalWon: 0,
        biggestWin: 0,
        gameHistory: []
    },
    
    // Elementos DOM
    elements: {},
    
    // Baralho de cartas
    suits: ['♠', '♥', '♦', '♣'],
    ranks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    
    init: function(container) {
        this.createGameInterface(container);
        this.setupEventListeners();
        this.initializeDeck();
        this.updateDisplay();
    },
    
    createGameInterface: function(container) {
        container.innerHTML = `
            <div class="baccarat-game">
                <div class="game-header">
                    <h2>🎴 Baccarat</h2>
                    <div class="game-stats">
                        <div class="stat">
                            <span class="label">Jogos:</span>
                            <span class="value" id="games-played">${this.state.gamesWon}/${this.state.totalGames}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Apostado:</span>
                            <span class="value" id="total-wagered">R$ ${this.state.totalWagered}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Ganho:</span>
                            <span class="value" id="total-won">R$ ${this.state.totalWon}</span>
                        </div>
                    </div>
                </div>
                
                <div class="baccarat-table">
                    <div class="hands-area">
                        <div class="player-side">
                            <h3>Jogador</h3>
                            <div class="hand" id="player-hand">
                                <div class="card-slot">?</div>
                                <div class="card-slot">?</div>
                                <div class="card-slot">?</div>
                            </div>
                            <div class="score" id="player-score">0</div>
                        </div>
                        
                        <div class="vs-indicator">VS</div>
                        
                        <div class="banker-side">
                            <h3>Banco</h3>
                            <div class="hand" id="banker-hand">
                                <div class="card-slot">?</div>
                                <div class="card-slot">?</div>
                                <div class="card-slot">?</div>
                            </div>
                            <div class="score" id="banker-score">0</div>
                        </div>
                    </div>
                    
                    <div class="betting-area">
                        <div class="bet-section">
                            <h4>Suas Apostas</h4>
                            <div class="betting-options">
                                <div class="bet-option">
                                    <label>Jogador (1:1)</label>
                                    <div class="bet-controls">
                                        <input type="number" id="player-bet" min="0" max="${this.config.maxBet}" value="0" step="10">
                                        <button id="player-bet-btn" class="bet-btn">Apostar</button>
                                    </div>
                                    <div class="bet-amount" id="player-bet-amount">R$ 0</div>
                                </div>
                                
                                <div class="bet-option">
                                    <label>Banco (1:1 - 5% comissão)</label>
                                    <div class="bet-controls">
                                        <input type="number" id="banker-bet" min="0" max="${this.config.maxBet}" value="0" step="10">
                                        <button id="banker-bet-btn" class="bet-btn">Apostar</button>
                                    </div>
                                    <div class="bet-amount" id="banker-bet-amount">R$ 0</div>
                                </div>
                                
                                <div class="bet-option">
                                    <label>Empate (8:1)</label>
                                    <div class="bet-controls">
                                        <input type="number" id="tie-bet" min="0" max="${this.config.maxBet}" value="0" step="10">
                                        <button id="tie-bet-btn" class="bet-btn">Apostar</button>
                                    </div>
                                    <div class="bet-amount" id="tie-bet-amount">R$ 0</div>
                                </div>
                            </div>
                            
                            <div class="total-bet">
                                <strong>Total Apostado: R$ <span id="total-bet">0</span></strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="game-controls">
                    <button id="deal-btn" class="action-btn deal-btn">Distribuir Cartas</button>
                    <button id="clear-bets-btn" class="action-btn clear-btn">Limpar Apostas</button>
                    <button id="new-game-btn" class="action-btn new-game-btn">Novo Jogo</button>
                </div>
                
                <div class="game-info">
                    <div class="game-result" id="game-result"></div>
                    <div class="rules-summary">
                        <h4>Regras Rápidas:</h4>
                        <ul>
                            <li>Objetivo: Apostar na mão mais próxima de 9</li>
                            <li>Cartas: A=1, 2-9=valor, 10/J/Q/K=0</li>
                            <li>Pontuação: Soma das cartas (módulo 10)</li>
                            <li>Natural: 8 ou 9 com 2 cartas</li>
                        </ul>
                    </div>
                    
                    <div class="game-history">
                        <h4>Histórico (últimos 10)</h4>
                        <div id="history-list"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Armazenar referências dos elementos
        this.elements = {
            gamesPlayed: container.querySelector('#games-played'),
            totalWagered: container.querySelector('#total-wagered'),
            totalWon: container.querySelector('#total-won'),
            playerHand: container.querySelector('#player-hand'),
            bankerHand: container.querySelector('#banker-hand'),
            playerScore: container.querySelector('#player-score'),
            bankerScore: container.querySelector('#banker-score'),
            playerBet: container.querySelector('#player-bet'),
            bankerBet: container.querySelector('#banker-bet'),
            tieBet: container.querySelector('#tie-bet'),
            playerBetBtn: container.querySelector('#player-bet-btn'),
            bankerBetBtn: container.querySelector('#banker-bet-btn'),
            tieBetBtn: container.querySelector('#tie-bet-btn'),
            playerBetAmount: container.querySelector('#player-bet-amount'),
            bankerBetAmount: container.querySelector('#banker-bet-amount'),
            tieBetAmount: container.querySelector('#tie-bet-amount'),
            totalBet: container.querySelector('#total-bet'),
            dealBtn: container.querySelector('#deal-btn'),
            clearBetsBtn: container.querySelector('#clear-bets-btn'),
            newGameBtn: container.querySelector('#new-game-btn'),
            gameResult: container.querySelector('#game-result'),
            historyList: container.querySelector('#history-list')
        };
    },
    
    setupEventListeners: function() {
        // Botões de aposta
        this.elements.playerBetBtn.addEventListener('click', () => this.placeBet('player'));
        this.elements.bankerBetBtn.addEventListener('click', () => this.placeBet('banker'));
        this.elements.tieBetBtn.addEventListener('click', () => this.placeBet('tie'));
        
        // Controles do jogo
        this.elements.dealBtn.addEventListener('click', () => this.dealCards());
        this.elements.clearBetsBtn.addEventListener('click', () => this.clearBets());
        this.elements.newGameBtn.addEventListener('click', () => this.newGame());
        
        // Validação de inputs
        [this.elements.playerBet, this.elements.bankerBet, this.elements.tieBet].forEach(input => {
            input.addEventListener('input', (e) => {
                const value = Math.max(0, Math.min(this.config.maxBet, parseInt(e.target.value) || 0));
                e.target.value = value;
            });
        });
    },
    
    initializeDeck: function() {
        this.state.deck = [];
        // Usar 8 baralhos como no baccarat real
        for (let deckNum = 0; deckNum < 8; deckNum++) {
            for (let suit of this.suits) {
                for (let rank of this.ranks) {
                    this.state.deck.push({
                        suit,
                        rank,
                        value: this.config.cardValues[rank]
                    });
                }
            }
        }
        this.shuffleDeck();
    },
    
    shuffleDeck: function() {
        for (let i = this.state.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.deck[i], this.state.deck[j]] = [this.state.deck[j], this.state.deck[i]];
        }
    },
    
    dealCard: function() {
        if (this.state.deck.length < 20) {
            this.initializeDeck(); // Reembaralhar quando restam poucas cartas
        }
        return this.state.deck.pop();
    },
    
    placeBet: function(betType) {
        const inputElement = this.elements[betType + 'Bet'];
        const betAmount = parseInt(inputElement.value) || 0;
        
        if (betAmount < this.config.minBet) {
            alert(`Aposta mínima: R$ ${this.config.minBet}`);
            return;
        }
        
        if (betAmount > this.config.maxBet) {
            alert(`Aposta máxima: R$ ${this.config.maxBet}`);
            return;
        }
        
        // Verificar se o jogador tem saldo suficiente
        const totalCurrentBets = this.state.currentBets.player + this.state.currentBets.banker + this.state.currentBets.tie;
        if (totalCurrentBets + betAmount > window.userBalance) {
            alert('Saldo insuficiente!');
            return;
        }
        
        this.state.currentBets[betType] += betAmount;
        inputElement.value = 0;
        
        this.updateBetDisplay();
    },
    
    clearBets: function() {
        this.state.currentBets = { player: 0, banker: 0, tie: 0 };
        this.updateBetDisplay();
    },
    
    updateBetDisplay: function() {
        this.elements.playerBetAmount.textContent = `R$ ${this.state.currentBets.player}`;
        this.elements.bankerBetAmount.textContent = `R$ ${this.state.currentBets.banker}`;
        this.elements.tieBetAmount.textContent = `R$ ${this.state.currentBets.tie}`;
        
        const totalBet = this.state.currentBets.player + this.state.currentBets.banker + this.state.currentBets.tie;
        this.elements.totalBet.textContent = totalBet;
        
        // Habilitar/desabilitar botão de distribuir
        this.elements.dealBtn.disabled = totalBet === 0 || this.state.isDealing;
    },
    
    dealCards: function() {
        if (this.getTotalBets() === 0) {
            alert('Faça pelo menos uma aposta!');
            return;
        }
        
        this.state.isDealing = true;
        this.elements.gameResult.textContent = '';
        
        // Limpar mãos anteriores
        this.state.playerHand = [];
        this.state.bankerHand = [];
        
        // Distribuir cartas iniciais
        this.state.playerHand.push(this.dealCard());
        this.state.bankerHand.push(this.dealCard());
        this.state.playerHand.push(this.dealCard());
        this.state.bankerHand.push(this.dealCard());
        
        this.calculateScores();
        this.updateHandDisplay();
        
        // Verificar naturais (8 ou 9)
        if (this.state.playerScore >= 8 || this.state.bankerScore >= 8) {
            this.endGame();
            return;
        }
        
        // Regras de terceira carta
        setTimeout(() => {
            this.applyThirdCardRules();
            this.endGame();
        }, 1000);
    },
    
    applyThirdCardRules: function() {
        let playerThirdCard = null;
        
        // Regra do jogador para terceira carta
        if (this.state.playerScore <= 5) {
            playerThirdCard = this.dealCard();
            this.state.playerHand.push(playerThirdCard);
            this.calculateScores();
            this.updateHandDisplay();
        }
        
        // Regras do banco para terceira carta
        const bankerNeedsCard = this.bankerNeedsThirdCard(playerThirdCard);
        if (bankerNeedsCard) {
            this.state.bankerHand.push(this.dealCard());
            this.calculateScores();
            this.updateHandDisplay();
        }
    },
    
    bankerNeedsThirdCard: function(playerThirdCard) {
        const bankerScore = this.state.bankerScore;
        
        if (bankerScore >= 7) return false;
        if (bankerScore <= 2) return true;
        
        if (!playerThirdCard) {
            return bankerScore <= 5;
        }
        
        const playerThirdValue = playerThirdCard.value;
        
        switch (bankerScore) {
            case 3: return playerThirdValue !== 8;
            case 4: return [2, 3, 4, 5, 6, 7].includes(playerThirdValue);
            case 5: return [4, 5, 6, 7].includes(playerThirdValue);
            case 6: return [6, 7].includes(playerThirdValue);
            default: return false;
        }
    },
    
    calculateScores: function() {
        this.state.playerScore = this.calculateHandScore(this.state.playerHand);
        this.state.bankerScore = this.calculateHandScore(this.state.bankerHand);
    },
    
    calculateHandScore: function(hand) {
        const total = hand.reduce((sum, card) => sum + card.value, 0);
        return total % 10;
    },
    
    endGame: function() {
        this.state.isDealing = false;
        this.state.totalGames++;
        
        // Determinar vencedor
        let winner;
        if (this.state.playerScore > this.state.bankerScore) {
            winner = 'player';
        } else if (this.state.bankerScore > this.state.playerScore) {
            winner = 'banker';
        } else {
            winner = 'tie';
        }
        
        this.state.gameResult = winner;
        
        // Calcular ganhos
        const winnings = this.calculateWinnings(winner);
        const totalBet = this.getTotalBets();
        
        this.state.totalWagered += totalBet;
        this.state.totalWon += winnings;
        
        if (winnings > 0) {
            this.state.gamesWon++;
            if (winnings > this.state.biggestWin) {
                this.state.biggestWin = winnings;
            }
        }
        
        // Atualizar saldo do usuário
        window.userBalance = window.userBalance - totalBet + winnings;
        
        // Mostrar resultado
        this.showGameResult(winner, winnings, totalBet);
        
        // Adicionar ao histórico
        this.addToHistory(winner, winnings, totalBet);
        
        // Limpar apostas
        this.clearBets();
        this.updateDisplay();
    },
    
    calculateWinnings: function(winner) {
        let winnings = 0;
        
        if (winner === 'player' && this.state.currentBets.player > 0) {
            winnings += this.state.currentBets.player * 2; // 1:1 payout
        }
        
        if (winner === 'banker' && this.state.currentBets.banker > 0) {
            // 1:1 payout minus 5% commission
            const grossWin = this.state.currentBets.banker * 2;
            const commission = this.state.currentBets.banker * this.config.commission;
            winnings += grossWin - commission;
        }
        
        if (winner === 'tie' && this.state.currentBets.tie > 0) {
            winnings += this.state.currentBets.tie * 9; // 8:1 payout
        }
        
        return Math.floor(winnings);
    },
    
    getTotalBets: function() {
        return this.state.currentBets.player + this.state.currentBets.banker + this.state.currentBets.tie;
    },
    
    showGameResult: function(winner, winnings, totalBet) {
        let resultText = `Jogador: ${this.state.playerScore} | Banco: ${this.state.bankerScore} | `;
        
        switch (winner) {
            case 'player':
                resultText += 'JOGADOR VENCE!';
                break;
            case 'banker':
                resultText += 'BANCO VENCE!';
                break;
            case 'tie':
                resultText += 'EMPATE!';
                break;
        }
        
        if (winnings > 0) {
            resultText += ` | Você ganhou R$ ${winnings}!`;
        } else {
            resultText += ` | Você perdeu R$ ${totalBet}`;
        }
        
        this.elements.gameResult.textContent = resultText;
        this.elements.gameResult.className = `game-result ${winner}`;
    },
    
    addToHistory: function(winner, winnings, totalBet) {
        const result = winnings > 0 ? `+R$ ${winnings}` : `-R$ ${totalBet}`;
        const historyItem = `${winner.toUpperCase()}: ${result}`;
        
        this.state.gameHistory.unshift(historyItem);
        if (this.state.gameHistory.length > 10) {
            this.state.gameHistory.pop();
        }
        
        this.elements.historyList.innerHTML = this.state.gameHistory
            .map(item => `<div class="history-item">${item}</div>`)
            .join('');
    },
    
    updateHandDisplay: function() {
        this.updateHand('player');
        this.updateHand('banker');
        
        this.elements.playerScore.textContent = this.state.playerScore;
        this.elements.bankerScore.textContent = this.state.bankerScore;
    },
    
    updateHand: function(side) {
        const hand = this.state[side + 'Hand'];
        const handElement = this.elements[side + 'Hand'];
        const slots = handElement.querySelectorAll('.card-slot');
        
        slots.forEach((slot, index) => {
            if (hand[index]) {
                const card = hand[index];
                slot.textContent = `${card.rank}${card.suit}`;
                slot.className = 'card-slot revealed';
            } else {
                slot.textContent = '?';
                slot.className = 'card-slot';
            }
        });
    },
    
    newGame: function() {
        this.state.playerHand = [];
        this.state.bankerHand = [];
        this.state.playerScore = 0;
        this.state.bankerScore = 0;
        this.state.gameResult = null;
        this.state.isDealing = false;
        
        this.clearBets();
        this.updateDisplay();
        this.elements.gameResult.textContent = '';
        
        // Limpar display das mãos
        const allSlots = document.querySelectorAll('.card-slot');
        allSlots.forEach(slot => {
            slot.textContent = '?';
            slot.className = 'card-slot';
        });
        
        this.elements.playerScore.textContent = '0';
        this.elements.bankerScore.textContent = '0';
    },
    
    updateDisplay: function() {
        this.elements.gamesPlayed.textContent = `${this.state.gamesWon}/${this.state.totalGames}`;
        this.elements.totalWagered.textContent = `R$ ${this.state.totalWagered}`;
        this.elements.totalWon.textContent = `R$ ${this.state.totalWon}`;
        
        this.updateBetDisplay();
    }
};

