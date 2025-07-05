// Poker game implementation (simplified Texas Hold'em)

let pokerGame = {
    currentBet: 5,
    pot: 0,
    playerHand: [],
    dealerHand: [],
    communityCards: [],
    deck: [],
    gamePhase: 'waiting', // waiting, preflop, flop, turn, river, showdown
    playerChips: 1000,
    dealerChips: 10000,
    totalHands: 0,
    handsWon: 0,
    biggestPot: 0,
    suits: ['♠', '♥', '♦', '♣'],
    ranks: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
};

function initializePoker(container) {
    container.innerHTML = `
        <div class="poker-game">
            <div class="game-header">
                <h2>🃏 Texas Hold'em Poker</h2>
                <div class="game-stats">
                    <div class="stat">
                        <span class="label">Fichas:</span>
                        <span class="value" id="poker-chips">R$ ${pokerGame.playerChips}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Pote:</span>
                        <span class="value" id="poker-pot">R$ ${pokerGame.pot}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Mãos Ganhas:</span>
                        <span class="value" id="poker-wins">${pokerGame.handsWon}/${pokerGame.totalHands}</span>
                    </div>
                </div>
            </div>
            
            <div class="poker-table">
                <div class="community-cards">
                    <h3>Mesa</h3>
                    <div class="cards-container" id="poker-community-cards">
                        <div class="card-slot">?</div>
                        <div class="card-slot">?</div>
                        <div class="card-slot">?</div>
                        <div class="card-slot">?</div>
                        <div class="card-slot">?</div>
                    </div>
                    <div class="phase-indicator" id="poker-phase">Aguardando nova mão</div>
                </div>
                
                <div class="players-area">
                    <div class="dealer-area">
                        <h4>Dealer</h4>
                        <div class="hand" id="poker-dealer-hand">
                            <div class="card hidden">?</div>
                            <div class="card hidden">?</div>
                        </div>
                        <div class="dealer-chips">R$ ${pokerGame.dealerChips}</div>
                    </div>
                    
                    <div class="player-area">
                        <h4>Suas Cartas</h4>
                        <div class="hand" id="poker-player-hand">
                            <div class="card-slot">?</div>
                            <div class="card-slot">?</div>
                        </div>
                        <div class="hand-strength" id="poker-hand-strength">-</div>
                    </div>
                </div>
            </div>
            
            <div class="betting-controls">
                <div class="bet-input-group">
                    <label for="poker-bet-amount">Aposta:</label>
                    <input type="range" id="poker-bet-slider" min="5" max="500" value="5" step="5" oninput="updatePokerBet(this.value)">
                    <input type="number" id="poker-bet-amount" min="5" max="500" value="5" onchange="updatePokerBetInput(this.value)">
                    <span class="currency">R$</span>
                </div>
                
                <div class="action-buttons">
                    <button id="poker-fold-btn" class="action-btn fold-btn" onclick="pokerFold()" disabled>Desistir</button>
                    <button id="poker-call-btn" class="action-btn call-btn" onclick="pokerCall()" disabled>Pagar</button>
                    <button id="poker-raise-btn" class="action-btn raise-btn" onclick="pokerRaise()" disabled>Aumentar</button>
                    <button id="poker-all-in-btn" class="action-btn all-in-btn" onclick="pokerAllIn()" disabled>All-in</button>
                    <button id="poker-new-hand-btn" class="action-btn new-hand-btn" onclick="pokerNewHand()">Nova Mão</button>
                </div>
            </div>
            
            <div class="game-info">
                <div class="last-action" id="poker-last-action">Clique em "Nova Mão" para começar</div>
                <div class="hand-history">
                    <h4>Histórico</h4>
                    <div id="poker-history-list"></div>
                </div>
            </div>
        </div>
    `;
    
    addPokerStyles();
    updatePokerDisplay();
}

function addPokerStyles() {
    if (document.querySelector('#poker-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'poker-styles';
    styles.textContent = `
        .poker-game {
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
        
        .game-stats {
            display: flex;
            gap: 2rem;
        }
        
        .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .stat .label {
            color: #ccc;
            font-size: 0.9rem;
        }
        
        .stat .value {
            color: #FFD700;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .poker-table {
            background: #006400;
            border-radius: 20px;
            padding: 2rem;
            margin: 2rem 0;
            border: 3px solid #FFD700;
            min-height: 400px;
        }
        
        .community-cards {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .community-cards h3 {
            color: #FFD700;
            margin-bottom: 1rem;
        }
        
        .cards-container {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .card-slot,
        .card {
            width: 60px;
            height: 84px;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.9rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .card.hidden {
            background: #1a1a1a;
            color: #FFD700;
            border-color: #FFD700;
        }
        
        .card-slot.revealed,
        .card-slot.player-card {
            background: white;
            color: #000;
        }
        
        .phase-indicator {
            color: #FFD700;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .players-area {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .dealer-area,
        .player-area {
            text-align: center;
        }
        
        .dealer-area h4,
        .player-area h4 {
            color: #FFD700;
            margin-bottom: 1rem;
        }
        
        .hand {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            margin-bottom: 1rem;
        }
        
        .dealer-chips {
            color: #00FF00;
            font-weight: bold;
        }
        
        .hand-strength {
            color: #FFD700;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .betting-controls {
            background: #333;
            padding: 1.5rem;
            border-radius: 10px;
            border: 2px solid #FFD700;
            margin: 2rem 0;
        }
        
        .bet-input-group {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .bet-input-group label {
            color: #FFD700;
            font-weight: bold;
        }
        
        #poker-bet-slider {
            flex: 1;
            height: 8px;
            background: #1a1a1a;
            border-radius: 5px;
            outline: none;
        }
        
        #poker-bet-amount {
            width: 80px;
            background: #1a1a1a;
            color: white;
            border: 2px solid #FFD700;
            border-radius: 5px;
            padding: 0.5rem;
            text-align: center;
        }
        
        .currency {
            color: #FFD700;
            font-weight: bold;
        }
        
        .action-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .action-btn {
            padding: 0.75rem 1.5rem;
            border: 2px solid #FFD700;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 100px;
        }
        
        .fold-btn {
            background: #DC143C;
            color: white;
        }
        
        .call-btn {
            background: #006400;
            color: white;
        }
        
        .raise-btn {
            background: #FF8C00;
            color: white;
        }
        
        .all-in-btn {
            background: #8B0000;
            color: white;
        }
        
        .new-hand-btn {
            background: #1a1a1a;
            color: #FFD700;
        }
        
        .action-btn:hover:not(:disabled) {
            background: #FFD700;
            color: #000;
            transform: translateY(-2px);
        }
        
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .game-info {
            background: #1a1a1a;
            padding: 1.5rem;
            border-radius: 10px;
            border: 2px solid #FFD700;
        }
        
        .last-action {
            color: #FFD700;
            font-weight: bold;
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .hand-history h4 {
            color: #FFD700;
            margin-bottom: 1rem;
        }
        
        .history-item {
            padding: 0.5rem;
            background: #333;
            border-radius: 5px;
            margin-bottom: 0.5rem;
            color: #ccc;
        }
        
        @media (max-width: 768px) {
            .game-header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
            
            .game-stats {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .players-area {
                flex-direction: column;
                gap: 2rem;
            }
            
            .action-buttons {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;
    document.head.appendChild(styles);
}

function updatePokerBet(value) {
    pokerGame.currentBet = parseInt(value);
    document.getElementById('poker-bet-amount').value = pokerGame.currentBet;
}

function updatePokerBetInput(value) {
    const amount = Math.max(5, Math.min(500, parseInt(value) || 5));
    pokerGame.currentBet = amount;
    document.getElementById('poker-bet-slider').value = amount;
    document.getElementById('poker-bet-amount').value = amount;
}

function initializePokerDeck() {
    pokerGame.deck = [];
    for (let suit of pokerGame.suits) {
        for (let rank of pokerGame.ranks) {
            pokerGame.deck.push({ 
                suit, 
                rank, 
                value: getPokerCardValue(rank) 
            });
        }
    }
    shufflePokerDeck();
}

function getPokerCardValue(rank) {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank);
}

function shufflePokerDeck() {
    for (let i = pokerGame.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pokerGame.deck[i], pokerGame.deck[j]] = [pokerGame.deck[j], pokerGame.deck[i]];
    }
}

function dealPokerCard() {
    return pokerGame.deck.pop();
}

function pokerNewHand() {
    const balance = getPlayerBalance();
    if (balance < 10) {
        showNotification('Saldo insuficiente para nova mão! (mínimo R$ 10)', 'error');
        return;
    }
    
    // Deduct blinds
    if (!placeBet(10)) {
        return;
    }
    
    // Initialize new hand
    initializePokerDeck();
    pokerGame.playerHand = [];
    pokerGame.dealerHand = [];
    pokerGame.communityCards = [];
    pokerGame.pot = 10; // Small blind + big blind
    pokerGame.gamePhase = 'preflop';
    
    // Deal initial cards
    pokerGame.playerHand.push(dealPokerCard(), dealPokerCard());
    pokerGame.dealerHand.push(dealPokerCard(), dealPokerCard());
    
    updatePokerDisplay();
    updatePokerActionButtons();
    document.getElementById('poker-last-action').textContent = 'Nova mão iniciada. Suas cartas foram distribuídas.';
    
    showNotification('Nova mão iniciada! Blinds: R$ 10', 'info');
}

function pokerFold() {
    document.getElementById('poker-last-action').textContent = 'Você desistiu da mão.';
    endPokerHand(false);
}

function pokerCall() {
    const callAmount = Math.min(10, getPlayerBalance());
    if (!placeBet(callAmount)) {
        return;
    }
    
    pokerGame.pot += callAmount;
    document.getElementById('poker-last-action').textContent = `Você pagou R$ ${callAmount}.`;
    
    pokerNextPhase();
}

function pokerRaise() {
    const raiseAmount = Math.min(pokerGame.currentBet, getPlayerBalance());
    if (!placeBet(raiseAmount)) {
        return;
    }
    
    pokerGame.pot += raiseAmount;
    document.getElementById('poker-last-action').textContent = `Você aumentou para R$ ${raiseAmount}.`;
    
    // Dealer responds to raise (simple simulation)
    pokerDealerAction();
    pokerNextPhase();
}

function pokerAllIn() {
    const balance = getPlayerBalance();
    if (!placeBet(balance)) {
        return;
    }
    
    pokerGame.pot += balance;
    document.getElementById('poker-last-action').textContent = `Você foi All-in com R$ ${balance}!`;
    
    pokerDealerAction();
    pokerShowdown();
}

function pokerDealerAction() {
    // Simple dealer AI
    const dealerHandStrength = evaluatePokerHand([...pokerGame.dealerHand, ...pokerGame.communityCards]);
    const action = Math.random();
    
    if (dealerHandStrength.rank < 2 && action < 0.3) {
        // Dealer fold with weak hand
        document.getElementById('poker-last-action').textContent += ' Dealer desistiu.';
        endPokerHand(true);
        return;
    }
    
    // Dealer call/raise
    const dealerBet = Math.min(20, pokerGame.dealerChips);
    pokerGame.pot += dealerBet;
    pokerGame.dealerChips -= dealerBet;
    document.getElementById('poker-last-action').textContent += ` Dealer apostou R$ ${dealerBet}.`;
}

function pokerNextPhase() {
    switch (pokerGame.gamePhase) {
        case 'preflop':
            pokerFlop();
            break;
        case 'flop':
            pokerTurn();
            break;
        case 'turn':
            pokerRiver();
            break;
        case 'river':
            pokerShowdown();
            break;
    }
}

function pokerFlop() {
    pokerGame.gamePhase = 'flop';
    pokerGame.communityCards.push(dealPokerCard(), dealPokerCard(), dealPokerCard());
    updatePokerDisplay();
    document.getElementById('poker-phase').textContent = 'Flop';
}

function pokerTurn() {
    pokerGame.gamePhase = 'turn';
    pokerGame.communityCards.push(dealPokerCard());
    updatePokerDisplay();
    document.getElementById('poker-phase').textContent = 'Turn';
}

function pokerRiver() {
    pokerGame.gamePhase = 'river';
    pokerGame.communityCards.push(dealPokerCard());
    updatePokerDisplay();
    document.getElementById('poker-phase').textContent = 'River';
}

function pokerShowdown() {
    pokerGame.gamePhase = 'showdown';
    
    const playerBestHand = evaluatePokerHand([...pokerGame.playerHand, ...pokerGame.communityCards]);
    const dealerBestHand = evaluatePokerHand([...pokerGame.dealerHand, ...pokerGame.communityCards]);
    
    const playerWins = comparePokerHands(playerBestHand, dealerBestHand);
    
    // Reveal dealer cards
    updatePokerDisplay(true);
    
    endPokerHand(playerWins, playerBestHand, dealerBestHand);
}

function evaluatePokerHand(cards) {
    // Simplified hand evaluation
    const sortedCards = cards.sort((a, b) => b.value - a.value);
    
    // Check flush
    const suits = {};
    cards.forEach(card => suits[card.suit] = (suits[card.suit] || 0) + 1);
    const isFlush = Object.values(suits).some(count => count >= 5);
    
    // Check straight
    const values = [...new Set(cards.map(card => card.value))].sort((a, b) => b - a);
    let isStraight = false;
    for (let i = 0; i <= values.length - 5; i++) {
        if (values[i] - values[i + 4] === 4) {
            isStraight = true;
            break;
        }
    }
    
    // Count pairs, trips, etc.
    const valueCounts = {};
    cards.forEach(card => valueCounts[card.value] = (valueCounts[card.value] || 0) + 1);
    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    
    // Determine hand ranking
    let rank = 0;
    let description = 'Carta Alta';
    
    if (isStraight && isFlush) {
        rank = values[0] === 14 ? 9 : 8; // Royal Flush or Straight Flush
        description = values[0] === 14 ? 'Royal Flush' : 'Straight Flush';
    } else if (counts[0] === 4) {
        rank = 7;
        description = 'Quadra';
    } else if (counts[0] === 3 && counts[1] === 2) {
        rank = 6;
        description = 'Full House';
    } else if (isFlush) {
        rank = 5;
        description = 'Flush';
    } else if (isStraight) {
        rank = 4;
        description = 'Sequência';
    } else if (counts[0] === 3) {
        rank = 3;
        description = 'Trinca';
    } else if (counts[0] === 2 && counts[1] === 2) {
        rank = 2;
        description = 'Dois Pares';
    } else if (counts[0] === 2) {
        rank = 1;
        description = 'Par';
    }
    
    return { rank, description, highCard: values[0] };
}

function comparePokerHands(playerHand, dealerHand) {
    if (playerHand.rank > dealerHand.rank) return true;
    if (playerHand.rank < dealerHand.rank) return false;
    return playerHand.highCard > dealerHand.highCard;
}

function endPokerHand(playerWins, playerHand = null, dealerHand = null) {
    pokerGame.totalHands++;
    
    if (playerWins) {
        pokerGame.handsWon++;
        const winAmount = Math.floor(pokerGame.pot * 0.975); // 2.5% house edge
        addWinnings(winAmount);
        document.getElementById('poker-last-action').textContent = `Você ganhou R$ ${winAmount}!`;
        
        if (playerHand && dealerHand) {
            document.getElementById('poker-last-action').textContent += ` Sua mão: ${playerHand.description}. Dealer: ${dealerHand.description}.`;
        }
        
        showNotification(`Você ganhou R$ ${winAmount}!`, 'success');
    } else {
        document.getElementById('poker-last-action').textContent += ' Você perdeu a mão.';
        showNotification('Você perdeu a mão.', 'info');
    }
    
    if (pokerGame.pot > pokerGame.biggestPot) {
        pokerGame.biggestPot = pokerGame.pot;
    }
    
    // Add to history
    addPokerToHistory(playerWins, pokerGame.pot);
    
    pokerGame.pot = 0;
    pokerGame.gamePhase = 'waiting';
    updatePokerDisplay();
    updatePokerActionButtons();
}

function addPokerToHistory(won, amount) {
    const result = won ? 'Ganhou' : 'Perdeu';
    const historyItem = `${result} - R$ ${amount}`;
    
    if (!pokerGame.handHistory) {
        pokerGame.handHistory = [];
    }
    
    pokerGame.handHistory.unshift(historyItem);
    if (pokerGame.handHistory.length > 10) {
        pokerGame.handHistory.pop();
    }
    
    const historyList = document.getElementById('poker-history-list');
    if (historyList) {
        historyList.innerHTML = pokerGame.handHistory
            .map(item => `<div class="history-item">${item}</div>`)
            .join('');
    }
}

function updatePokerDisplay(showDealerCards = false) {
    // Update stats
    const balance = getPlayerBalance();
    document.getElementById('poker-chips').textContent = `R$ ${balance.toFixed(2)}`;
    document.getElementById('poker-pot').textContent = `R$ ${pokerGame.pot}`;
    document.getElementById('poker-wins').textContent = `${pokerGame.handsWon}/${pokerGame.totalHands}`;
    
    // Update community cards
    updatePokerCommunityCards();
    
    // Update hands
    updatePokerPlayerHand();
    updatePokerDealerHand(showDealerCards);
    
    // Update hand strength
    if (pokerGame.playerHand.length > 0) {
        const handStrength = evaluatePokerHand([...pokerGame.playerHand, ...pokerGame.communityCards]);
        document.getElementById('poker-hand-strength').textContent = handStrength.description;
    } else {
        document.getElementById('poker-hand-strength').textContent = '-';
    }
}

function updatePokerCommunityCards() {
    const slots = document.querySelectorAll('#poker-community-cards .card-slot');
    slots.forEach((slot, index) => {
        if (pokerGame.communityCards[index]) {
            const card = pokerGame.communityCards[index];
            slot.textContent = `${card.rank}${card.suit}`;
            slot.className = 'card-slot revealed';
        } else {
            slot.textContent = '?';
            slot.className = 'card-slot';
        }
    });
}

function updatePokerPlayerHand() {
    const slots = document.querySelectorAll('#poker-player-hand .card-slot');
    slots.forEach((slot, index) => {
        if (pokerGame.playerHand[index]) {
            const card = pokerGame.playerHand[index];
            slot.textContent = `${card.rank}${card.suit}`;
            slot.className = 'card-slot player-card';
        } else {
            slot.textContent = '?';
            slot.className = 'card-slot';
        }
    });
}

function updatePokerDealerHand(showCards = false) {
    const cards = document.querySelectorAll('#poker-dealer-hand .card');
    cards.forEach((cardEl, index) => {
        if (pokerGame.dealerHand[index]) {
            if (showCards) {
                const card = pokerGame.dealerHand[index];
                cardEl.textContent = `${card.rank}${card.suit}`;
                cardEl.className = 'card revealed';
            } else {
                cardEl.textContent = '?';
                cardEl.className = 'card hidden';
            }
        }
    });
}

function updatePokerActionButtons() {
    const inHand = pokerGame.gamePhase !== 'showdown' && pokerGame.gamePhase !== 'waiting' && pokerGame.playerHand.length > 0;
    const balance = getPlayerBalance();
    
    document.getElementById('poker-fold-btn').disabled = !inHand;
    document.getElementById('poker-call-btn').disabled = !inHand || balance < 10;
    document.getElementById('poker-raise-btn').disabled = !inHand || balance < pokerGame.currentBet;
    document.getElementById('poker-all-in-btn').disabled = !inHand || balance === 0;
    document.getElementById('poker-new-hand-btn').disabled = inHand;
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

// Export poker functions
window.PokerGame = {
    initialize: initializePoker,
    newHand: pokerNewHand,
    fold: pokerFold,
    call: pokerCall,
    raise: pokerRaise,
    allIn: pokerAllIn
};

