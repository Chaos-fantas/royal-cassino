// Blackjack game implementation

let blackjackGame = {
    isPlaying: false,
    currentBet: 0,
    playerHand: [],
    dealerHand: [],
    deck: [],
    gamePhase: 'betting', // betting, playing, dealer, finished
    sessionStats: {
        gamesPlayed: 0,
        gamesWon: 0,
        blackjacks: 0,
        totalProfit: 0
    }
};

// Card configuration
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function initializeBlackjack(container) {
    container.innerHTML = `
        <div class="blackjack-game">
            <div class="game-header">
                <h2>🃏 Blackjack</h2>
                <div class="game-info">
                    <div class="balance-display">
                        Saldo: <span id="bj-balance">R$ 0.00</span>
                    </div>
                    <div class="current-bet">
                        Aposta: <span id="bj-current-bet">R$ 0.00</span>
                    </div>
                </div>
            </div>
            
            <div class="game-table">
                <div class="dealer-area">
                    <h3>Dealer</h3>
                    <div class="hand-info">
                        <span class="hand-value" id="dealer-score">0</span>
                    </div>
                    <div class="cards-container" id="dealer-cards"></div>
                </div>
                
                <div class="player-area">
                    <h3>Suas Cartas</h3>
                    <div class="hand-info">
                        <span class="hand-value" id="player-score">0</span>
                        <span class="hand-status" id="hand-status"></span>
                    </div>
                    <div class="cards-container" id="player-cards"></div>
                </div>
            </div>
            
            <div class="betting-controls" id="betting-controls">
                <h3>Fazer Aposta</h3>
                <div class="bet-amounts">
                    <button class="bet-btn" onclick="placeBjBet(10)">R$ 10</button>
                    <button class="bet-btn" onclick="placeBjBet(25)">R$ 25</button>
                    <button class="bet-btn" onclick="placeBjBet(50)">R$ 50</button>
                    <button class="bet-btn" onclick="placeBjBet(100)">R$ 100</button>
                </div>
                <div class="custom-bet">
                    <input type="number" id="custom-bet-amount" min="10" max="1000" placeholder="Valor personalizado">
                    <button onclick="placeBjCustomBet()">Apostar</button>
                </div>
            </div>
            
            <div class="game-controls" id="game-controls" style="display: none;">
                <button id="hit-btn" class="action-btn" onclick="bjHit()">
                    <span class="btn-icon">👆</span>
                    Pedir Carta
                </button>
                <button id="stand-btn" class="action-btn" onclick="bjStand()">
                    <span class="btn-icon">✋</span>
                    Parar
                </button>
                <button id="double-btn" class="action-btn" onclick="bjDouble()" disabled>
                    <span class="btn-icon">⬆️</span>
                    Dobrar
                </button>
            </div>
            
            <div class="game-result" id="game-result" style="display: none;">
                <div class="result-content">
                    <h3 id="result-title"></h3>
                    <div id="result-message"></div>
                    <div class="result-payout" id="result-payout"></div>
                    <button onclick="bjNewGame()" class="btn-primary">Nova Rodada</button>
                </div>
            </div>
            
            <div class="game-stats">
                <h4>Estatísticas da Sessão</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Jogos:</span>
                        <span class="stat-value" id="bj-games-played">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Vitórias:</span>
                        <span class="stat-value" id="bj-games-won">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Blackjacks:</span>
                        <span class="stat-value" id="bj-blackjacks">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Lucro:</span>
                        <span class="stat-value" id="bj-session-profit">R$ 0.00</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    addBlackjackStyles();
    initializeBjDeck();
    updateBjDisplay();
}

function addBlackjackStyles() {
    if (document.querySelector('#blackjack-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'blackjack-styles';
    styles.textContent = `
        .blackjack-game {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
        }
        
        .game-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding: 1rem;
            background: #1a1a1a;
            border-radius: 10px;
            border: 2px solid #FFD700;
        }
        
        .game-header h2 {
            color: #FFD700;
            margin: 0;
            font-size: 2rem;
        }
        
        .game-info {
            display: flex;
            gap: 2rem;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .balance-display {
            color: #00FF00;
        }
        
        .current-bet {
            color: #FFD700;
        }
        
        .game-table {
            background: #006400;
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
            border: 3px solid #FFD700;
            min-height: 400px;
        }
        
        .dealer-area,
        .player-area {
            margin: 2rem 0;
            text-align: center;
        }
        
        .dealer-area h3,
        .player-area h3 {
            color: #FFD700;
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .hand-info {
            margin-bottom: 1rem;
        }
        
        .hand-value {
            background: #1a1a1a;
            color: #FFD700;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            font-size: 1.2rem;
            font-weight: bold;
            border: 2px solid #FFD700;
        }
        
        .hand-status {
            margin-left: 1rem;
            color: #FF6B6B;
            font-weight: bold;
        }
        
        .cards-container {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            flex-wrap: wrap;
            min-height: 120px;
            align-items: center;
        }
        
        .card {
            width: 80px;
            height: 112px;
            background: white;
            border-radius: 8px;
            border: 2px solid #333;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 0.5rem;
            font-weight: bold;
            font-size: 1rem;
            position: relative;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card.red {
            color: #DC143C;
        }
        
        .card.black {
            color: #000;
        }
        
        .card.hidden {
            background: #1a1a1a;
            color: #FFD700;
            border-color: #FFD700;
        }
        
        .card .rank {
            font-size: 1.2rem;
        }
        
        .card .suit {
            font-size: 1.5rem;
            text-align: center;
        }
        
        .betting-controls {
            background: #333;
            padding: 1.5rem;
            border-radius: 10px;
            border: 2px solid #FFD700;
            margin: 1rem 0;
        }
        
        .betting-controls h3 {
            color: #FFD700;
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .bet-amounts {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }
        
        .bet-btn {
            background: #DC143C;
            color: white;
            border: 2px solid #FFD700;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 80px;
        }
        
        .bet-btn:hover {
            background: #FFD700;
            color: #000;
            transform: translateY(-2px);
        }
        
        .custom-bet {
            display: flex;
            gap: 1rem;
            justify-content: center;
            align-items: center;
        }
        
        #custom-bet-amount {
            background: #1a1a1a;
            color: white;
            border: 2px solid #FFD700;
            border-radius: 5px;
            padding: 0.5rem;
            width: 150px;
            text-align: center;
        }
        
        .custom-bet button {
            background: #006400;
            color: white;
            border: 2px solid #FFD700;
            border-radius: 5px;
            padding: 0.5rem 1rem;
            cursor: pointer;
            font-weight: bold;
        }
        
        .custom-bet button:hover {
            background: #008000;
        }
        
        .game-controls {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        
        .action-btn {
            background: #1a1a1a;
            color: white;
            border: 2px solid #FFD700;
            border-radius: 10px;
            padding: 1rem 1.5rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            min-width: 120px;
        }
        
        .action-btn:hover:not(:disabled) {
            background: #FFD700;
            color: #000;
            transform: translateY(-3px);
        }
        
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-icon {
            font-size: 1.5rem;
        }
        
        .game-result {
            background: #1a1a1a;
            border: 3px solid #FFD700;
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            margin: 2rem 0;
        }
        
        .result-content h3 {
            color: #FFD700;
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        
        .result-payout {
            color: #00FF00;
            font-size: 1.5rem;
            font-weight: bold;
            margin: 1rem 0;
        }
        
        .game-stats {
            background: #333;
            padding: 1.5rem;
            border-radius: 10px;
            border: 2px solid #FFD700;
            margin-top: 2rem;
        }
        
        .game-stats h4 {
            color: #FFD700;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem;
            background: #1a1a1a;
            border-radius: 5px;
        }
        
        .stat-label {
            color: #ccc;
        }
        
        .stat-value {
            color: #FFD700;
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .game-header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
            
            .game-info {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .card {
                width: 60px;
                height: 84px;
                font-size: 0.8rem;
            }
        }
    `;
    document.head.appendChild(styles);
}

function initializeBjDeck() {
    blackjackGame.deck = [];
    
    // Create 6 decks
    for (let d = 0; d < 6; d++) {
        for (let suit of CARD_SUITS) {
            for (let rank of CARD_RANKS) {
                blackjackGame.deck.push({
                    suit: suit,
                    rank: rank,
                    value: getBjCardValue(rank),
                    color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
                });
            }
        }
    }
    
    shuffleBjDeck();
}

function shuffleBjDeck() {
    for (let i = blackjackGame.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [blackjackGame.deck[i], blackjackGame.deck[j]] = [blackjackGame.deck[j], blackjackGame.deck[i]];
    }
}

function getBjCardValue(rank) {
    if (rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank);
}

function dealBjCard(hand) {
    if (blackjackGame.deck.length < 20) {
        initializeBjDeck(); // Reshuffle when few cards remain
    }
    
    const card = blackjackGame.deck.pop();
    hand.push(card);
    return card;
}

function calculateBjScore(hand) {
    let score = 0;
    let aces = 0;
    
    for (let card of hand) {
        if (card.rank === 'A') {
            aces++;
            score += 11;
        } else {
            score += card.value;
        }
    }
    
    // Adjust aces
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

function createBjCardElement(card, hidden = false) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.color}`;
    
    if (hidden) {
        cardEl.className += ' hidden';
        cardEl.innerHTML = `
            <div class="rank">?</div>
            <div class="suit">🂠</div>
        `;
    } else {
        cardEl.innerHTML = `
            <div class="rank">${card.rank}</div>
            <div class="suit">${card.suit}</div>
        `;
    }
    
    return cardEl;
}

function updateBjDisplay() {
    const playerScore = calculateBjScore(blackjackGame.playerHand);
    const dealerScore = calculateBjScore(blackjackGame.dealerHand);
    
    document.getElementById('player-score').textContent = playerScore;
    
    // Show dealer score only if not in playing phase
    if (blackjackGame.gamePhase !== 'playing') {
        document.getElementById('dealer-score').textContent = dealerScore;
    } else {
        // During play, show only visible card
        const visibleCard = blackjackGame.dealerHand[0];
        document.getElementById('dealer-score').textContent = visibleCard ? visibleCard.value : '?';
    }
    
    // Update hand status
    const statusEl = document.getElementById('hand-status');
    let status = '';
    if (playerScore === 21 && blackjackGame.playerHand.length === 2) {
        status = 'BLACKJACK!';
        statusEl.style.color = '#FFD700';
    } else if (playerScore > 21) {
        status = 'ESTOUROU!';
        statusEl.style.color = '#FF6B6B';
    } else if (playerScore === 21) {
        status = '21!';
        statusEl.style.color = '#00FF00';
    }
    statusEl.textContent = status;
    
    // Update balance and bet
    const balance = getPlayerBalance();
    document.getElementById('bj-balance').textContent = balance.toFixed(2);
    document.getElementById('bj-current-bet').textContent = blackjackGame.currentBet.toFixed(2);
    
    // Update game options
    updateBjGameOptions();
}

function updateBjGameOptions() {
    if (blackjackGame.gamePhase !== 'playing') return;
    
    const doubleBtn = document.getElementById('double-btn');
    const balance = getPlayerBalance();
    
    // Double Down: only on first two cards and if player has enough balance
    doubleBtn.disabled = !(
        blackjackGame.playerHand.length === 2 && 
        balance >= blackjackGame.currentBet
    );
}

function placeBjBet(amount) {
    if (blackjackGame.gamePhase !== 'betting') {
        showNotification('Termine a rodada atual primeiro!', 'warning');
        return;
    }
    
    const balance = getPlayerBalance();
    if (balance < amount) {
        showNotification('Saldo insuficiente!', 'error');
        return;
    }
    
    if (!placeBet(amount)) {
        return;
    }
    
    blackjackGame.currentBet = amount;
    updateBjDisplay();
    
    showNotification(`Aposta de R$ ${amount.toFixed(2)} realizada!`, 'success');
    
    // Start the game
    dealBjInitialCards();
}

function placeBjCustomBet() {
    const amount = parseFloat(document.getElementById('custom-bet-amount').value);
    if (amount >= 10 && amount <= 1000) {
        placeBjBet(amount);
    } else {
        showNotification('Aposta deve ser entre R$ 10 e R$ 1000', 'warning');
    }
}

function dealBjInitialCards() {
    blackjackGame.gamePhase = 'playing';
    blackjackGame.playerHand = [];
    blackjackGame.dealerHand = [];
    
    // Clear cards from table
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('dealer-cards').innerHTML = '';
    
    // Show game controls
    document.getElementById('betting-controls').style.display = 'none';
    document.getElementById('game-controls').style.display = 'flex';
    document.getElementById('game-result').style.display = 'none';
    
    // Deal cards (player, dealer, player, dealer)
    setTimeout(() => {
        const card1 = dealBjCard(blackjackGame.playerHand);
        document.getElementById('player-cards').appendChild(createBjCardElement(card1));
    }, 200);
    
    setTimeout(() => {
        const card2 = dealBjCard(blackjackGame.dealerHand);
        document.getElementById('dealer-cards').appendChild(createBjCardElement(card2));
    }, 600);
    
    setTimeout(() => {
        const card3 = dealBjCard(blackjackGame.playerHand);
        document.getElementById('player-cards').appendChild(createBjCardElement(card3));
    }, 1000);
    
    setTimeout(() => {
        const card4 = dealBjCard(blackjackGame.dealerHand);
        document.getElementById('dealer-cards').appendChild(createBjCardElement(card4, true)); // Hidden card
        
        // Update display and check for blackjack
        updateBjDisplay();
        checkBjForBlackjack();
    }, 1400);
}

function checkBjForBlackjack() {
    const playerScore = calculateBjScore(blackjackGame.playerHand);
    const dealerScore = calculateBjScore(blackjackGame.dealerHand);
    const playerBlackjack = playerScore === 21;
    const dealerBlackjack = dealerScore === 21;
    
    if (playerBlackjack || dealerBlackjack) {
        revealBjDealerCard();
        
        if (playerBlackjack && dealerBlackjack) {
            endBjGame('push', 'Empate - Ambos têm Blackjack!');
        } else if (playerBlackjack) {
            endBjGame('blackjack', 'BLACKJACK! Você ganhou!');
        } else {
            endBjGame('lose', 'Dealer tem Blackjack!');
        }
    }
}

function bjHit() {
    if (blackjackGame.gamePhase !== 'playing') return;
    
    const card = dealBjCard(blackjackGame.playerHand);
    document.getElementById('player-cards').appendChild(createBjCardElement(card));
    updateBjDisplay();
    
    const playerScore = calculateBjScore(blackjackGame.playerHand);
    if (playerScore > 21) {
        setTimeout(() => {
            endBjGame('bust', 'Você estourou!');
        }, 500);
    } else if (playerScore === 21) {
        bjStand(); // Automatically stand on 21
    }
}

function bjStand() {
    if (blackjackGame.gamePhase !== 'playing') return;
    
    blackjackGame.gamePhase = 'dealer';
    document.getElementById('game-controls').style.display = 'none';
    
    revealBjDealerCard();
    bjDealerPlay();
}

function bjDouble() {
    if (blackjackGame.gamePhase !== 'playing' || blackjackGame.playerHand.length !== 2) return;
    
    const balance = getPlayerBalance();
    if (balance < blackjackGame.currentBet) {
        showNotification('Saldo insuficiente para dobrar!', 'error');
        return;
    }
    
    if (!placeBet(blackjackGame.currentBet)) {
        return;
    }
    
    blackjackGame.currentBet *= 2;
    updateBjDisplay();
    
    // Deal one card and stand
    const card = dealBjCard(blackjackGame.playerHand);
    document.getElementById('player-cards').appendChild(createBjCardElement(card));
    updateBjDisplay();
    
    showNotification('Aposta dobrada!', 'info');
    
    const playerScore = calculateBjScore(blackjackGame.playerHand);
    if (playerScore > 21) {
        setTimeout(() => {
            endBjGame('bust', 'Você estourou após dobrar!');
        }, 500);
    } else {
        setTimeout(() => bjStand(), 1000);
    }
}

function revealBjDealerCard() {
    const hiddenCard = document.querySelector('#dealer-cards .hidden');
    if (hiddenCard) {
        const card = blackjackGame.dealerHand[1];
        hiddenCard.className = `card ${card.color}`;
        hiddenCard.innerHTML = `
            <div class="rank">${card.rank}</div>
            <div class="suit">${card.suit}</div>
        `;
    }
    updateBjDisplay();
}

function bjDealerPlay() {
    const dealerTurn = () => {
        const dealerScore = calculateBjScore(blackjackGame.dealerHand);
        
        if (dealerScore < 17) {
            setTimeout(() => {
                const card = dealBjCard(blackjackGame.dealerHand);
                document.getElementById('dealer-cards').appendChild(createBjCardElement(card));
                updateBjDisplay();
                dealerTurn();
            }, 1000);
        } else {
            setTimeout(() => determineBjWinner(), 1000);
        }
    };
    
    dealerTurn();
}

function determineBjWinner() {
    const playerScore = calculateBjScore(blackjackGame.playerHand);
    const dealerScore = calculateBjScore(blackjackGame.dealerHand);
    
    if (dealerScore > 21) {
        endBjGame('win', 'Dealer estourou! Você ganhou!');
    } else if (playerScore > dealerScore) {
        endBjGame('win', 'Você ganhou!');
    } else if (playerScore < dealerScore) {
        endBjGame('lose', 'Dealer ganhou!');
    } else {
        endBjGame('push', 'Empate!');
    }
}

function endBjGame(result, message) {
    blackjackGame.gamePhase = 'finished';
    
    let payout = 0;
    let payoutMessage = '';
    
    switch (result) {
        case 'blackjack':
            payout = Math.floor(blackjackGame.currentBet * 2.5);
            payoutMessage = `Ganhou: R$ ${payout.toFixed(2)}`;
            updateBjStats('blackjack');
            break;
        case 'win':
            payout = blackjackGame.currentBet * 2;
            payoutMessage = `Ganhou: R$ ${payout.toFixed(2)}`;
            updateBjStats('win');
            break;
        case 'push':
            payout = blackjackGame.currentBet;
            payoutMessage = `Devolvido: R$ ${payout.toFixed(2)}`;
            updateBjStats('push');
            break;
        case 'lose':
        case 'bust':
            payout = 0;
            payoutMessage = `Perdeu: R$ ${blackjackGame.currentBet.toFixed(2)}`;
            updateBjStats('lose');
            break;
    }
    
    if (payout > 0) {
        addWinnings(payout);
    }
    
    // Show result
    const playerScore = calculateBjScore(blackjackGame.playerHand);
    const dealerScore = calculateBjScore(blackjackGame.dealerHand);
    
    document.getElementById('result-title').textContent = message;
    document.getElementById('result-message').textContent = `Sua pontuação: ${playerScore} | Dealer: ${dealerScore}`;
    document.getElementById('result-payout').textContent = payoutMessage;
    document.getElementById('game-result').style.display = 'block';
    
    updateBjDisplay();
}

function updateBjStats(result) {
    blackjackGame.sessionStats.gamesPlayed++;
    
    switch (result) {
        case 'win':
            blackjackGame.sessionStats.gamesWon++;
            blackjackGame.sessionStats.totalProfit += blackjackGame.currentBet;
            break;
        case 'blackjack':
            blackjackGame.sessionStats.gamesWon++;
            blackjackGame.sessionStats.blackjacks++;
            blackjackGame.sessionStats.totalProfit += Math.floor(blackjackGame.currentBet * 1.5);
            break;
        case 'lose':
        case 'bust':
            blackjackGame.sessionStats.totalProfit -= blackjackGame.currentBet;
            break;
    }
    
    // Update stats display
    document.getElementById('bj-games-played').textContent = blackjackGame.sessionStats.gamesPlayed;
    document.getElementById('bj-games-won').textContent = blackjackGame.sessionStats.gamesWon;
    document.getElementById('bj-blackjacks').textContent = blackjackGame.sessionStats.blackjacks;
    document.getElementById('bj-session-profit').textContent = blackjackGame.sessionStats.totalProfit.toFixed(2);
}

function bjNewGame() {
    blackjackGame.gamePhase = 'betting';
    blackjackGame.currentBet = 0;
    blackjackGame.playerHand = [];
    blackjackGame.dealerHand = [];
    
    // Clear interface
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('dealer-cards').innerHTML = '';
    document.getElementById('hand-status').textContent = '';
    
    // Show betting controls
    document.getElementById('betting-controls').style.display = 'block';
    document.getElementById('game-controls').style.display = 'none';
    document.getElementById('game-result').style.display = 'none';
    
    updateBjDisplay();
    
    showNotification('Nova rodada iniciada!', 'info');
}

// Utility functions
function getPlayerBalance() {
    if (typeof window.CasinoMain !== 'undefined' && window.CasinoMain.getPlayerBalance) {
        return window.CasinoMain.getPlayerBalance();
    }
    if (typeof getAnonymousBalance === 'function') {
        return getAnonymousBalance();
    }
    return 0;
}

function placeBet(amount) {
    if (typeof window.CasinoMain !== 'undefined' && window.CasinoMain.placeBet) {
        return window.CasinoMain.placeBet(amount);
    }
    return false;
}

function addWinnings(amount) {
    if (typeof window.CasinoMain !== 'undefined' && window.CasinoMain.addWinnings) {
        window.CasinoMain.addWinnings(amount);
    }
}

function showNotification(message, type) {
    if (typeof window.CasinoMain !== 'undefined' && window.CasinoMain.showNotification) {
        window.CasinoMain.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Export blackjack functions
window.BlackjackGame = {
    initialize: initializeBlackjack,
    placeBet: placeBjBet,
    hit: bjHit,
    stand: bjStand,
    double: bjDouble,
    newGame: bjNewGame
};

