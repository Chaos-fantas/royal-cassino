// Roulette game implementation

let rouletteGame = {
    isSpinning: false,
    currentBet: 0,
    selectedNumbers: [],
    selectedColors: [],
    selectedTypes: [],
    wheel: null,
    ballPosition: 0,
    spinDuration: 3000
};

// Roulette numbers and colors
const ROULETTE_NUMBERS = [
    { number: 0, color: 'green' },
    { number: 32, color: 'red' }, { number: 15, color: 'black' }, { number: 19, color: 'red' },
    { number: 4, color: 'black' }, { number: 21, color: 'red' }, { number: 2, color: 'black' },
    { number: 25, color: 'red' }, { number: 17, color: 'black' }, { number: 34, color: 'red' },
    { number: 6, color: 'black' }, { number: 27, color: 'red' }, { number: 13, color: 'black' },
    { number: 36, color: 'red' }, { number: 11, color: 'black' }, { number: 30, color: 'red' },
    { number: 8, color: 'black' }, { number: 23, color: 'red' }, { number: 10, color: 'black' },
    { number: 5, color: 'red' }, { number: 24, color: 'black' }, { number: 16, color: 'red' },
    { number: 33, color: 'black' }, { number: 1, color: 'red' }, { number: 20, color: 'black' },
    { number: 14, color: 'red' }, { number: 31, color: 'black' }, { number: 9, color: 'red' },
    { number: 22, color: 'black' }, { number: 18, color: 'red' }, { number: 29, color: 'black' },
    { number: 7, color: 'red' }, { number: 28, color: 'black' }, { number: 12, color: 'red' },
    { number: 35, color: 'black' }, { number: 3, color: 'red' }, { number: 26, color: 'black' }
];

function initializeRoulette(container) {
    container.innerHTML = `
        <div class="roulette-game">
            <div class="roulette-wheel-container">
                <div class="roulette-wheel" id="roulette-wheel">
                    <div class="wheel-center"></div>
                    <div class="wheel-ball" id="wheel-ball"></div>
                </div>
                <div class="winning-number" id="winning-number" style="display: none;">
                    <span id="winning-number-text">0</span>
                </div>
            </div>
            
            <div class="roulette-controls">
                <div class="bet-controls">
                    <label for="bet-amount">Valor da Aposta:</label>
                    <input type="number" id="bet-amount" min="1" max="1000" value="10" step="1">
                    <button onclick="clearBets()" class="btn-secondary">Limpar Apostas</button>
                    <button onclick="spinWheel()" id="spin-button" class="btn-primary">Girar Roleta</button>
                </div>
                
                <div class="current-bets" id="current-bets">
                    <h4>Apostas Atuais: R$ <span id="total-bet">0.00</span></h4>
                </div>
            </div>
            
            <div class="roulette-table">
                <div class="numbers-grid">
                    <div class="number-cell zero" onclick="placeBet('number', 0)">0</div>
                    ${generateNumberGrid()}
                </div>
                
                <div class="outside-bets">
                    <div class="bet-row">
                        <div class="bet-cell" onclick="placeBet('color', 'red')">Vermelho</div>
                        <div class="bet-cell" onclick="placeBet('color', 'black')">Preto</div>
                        <div class="bet-cell" onclick="placeBet('type', 'even')">Par</div>
                        <div class="bet-cell" onclick="placeBet('type', 'odd')">Ímpar</div>
                    </div>
                    <div class="bet-row">
                        <div class="bet-cell" onclick="placeBet('range', '1-18')">1-18</div>
                        <div class="bet-cell" onclick="placeBet('range', '19-36')">19-36</div>
                    </div>
                    <div class="bet-row">
                        <div class="bet-cell" onclick="placeBet('dozen', '1st')">1º Dúzia</div>
                        <div class="bet-cell" onclick="placeBet('dozen', '2nd')">2º Dúzia</div>
                        <div class="bet-cell" onclick="placeBet('dozen', '3rd')">3º Dúzia</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    initializeRouletteWheel();
    updateBetDisplay();
}

function generateNumberGrid() {
    let grid = '';
    for (let i = 1; i <= 36; i++) {
        const numberData = ROULETTE_NUMBERS.find(n => n.number === i);
        const colorClass = numberData ? numberData.color : 'black';
        grid += `<div class="number-cell ${colorClass}" onclick="placeBet('number', ${i})">${i}</div>`;
    }
    return grid;
}

function initializeRouletteWheel() {
    const wheel = document.getElementById('roulette-wheel');
    if (!wheel) return;
    
    // Create wheel segments
    const segmentAngle = 360 / ROULETTE_NUMBERS.length;
    
    ROULETTE_NUMBERS.forEach((numberData, index) => {
        const segment = document.createElement('div');
        segment.className = `wheel-segment ${numberData.color}`;
        segment.style.transform = `rotate(${index * segmentAngle}deg)`;
        segment.innerHTML = `<span class="segment-number">${numberData.number}</span>`;
        wheel.appendChild(segment);
    });
}

function placeBet(type, value) {
    if (rouletteGame.isSpinning) {
        showNotification('Aguarde a roleta parar antes de fazer nova aposta!', 'warning');
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('bet-amount').value) || 10;
    
    // Validate bet using the global validation system
    if (!validateBet(betAmount)) {
        return false;
    }
    
    // Add bet to current bets
    const bet = {
        type: type,
        value: value,
        amount: betAmount
    };
    
    // Store bet
    if (!rouletteGame.bets) {
        rouletteGame.bets = [];
    }
    rouletteGame.bets.push(bet);
    
    // Update total bet
    rouletteGame.currentBet += betAmount;
    
    // Update display
    updateBetDisplay();
    
    showNotification(`Aposta de R$ ${betAmount.toFixed(2)} em ${getBetDescription(type, value)}`, 'info');
}

function getBetDescription(type, value) {
    switch(type) {
        case 'number': return `número ${value}`;
        case 'color': return value === 'red' ? 'vermelho' : 'preto';
        case 'type': return value === 'even' ? 'par' : 'ímpar';
        case 'range': return value;
        case 'dozen': 
            const dozens = { '1st': '1ª dúzia', '2nd': '2ª dúzia', '3rd': '3ª dúzia' };
            return dozens[value];
        default: return value;
    }
}

function clearBets() {
    if (rouletteGame.isSpinning) {
        showNotification('Não é possível limpar apostas durante o giro!', 'warning');
        return;
    }
    
    rouletteGame.bets = [];
    rouletteGame.currentBet = 0;
    updateBetDisplay();
    showNotification('Apostas limpas!', 'info');
}

function updateBetDisplay() {
    const totalBetElement = document.getElementById('total-bet');
    if (totalBetElement) {
        totalBetElement.textContent = rouletteGame.currentBet.toFixed(2);
    }
}

function spinWheel() {
    if (rouletteGame.isSpinning) {
        showNotification('A roleta já está girando!', 'warning');
        return;
    }
    
    if (!rouletteGame.bets || rouletteGame.bets.length === 0) {
        showNotification('Faça pelo menos uma aposta antes de girar!', 'warning');
        return;
    }
    
    // Deduct bet amount from balance
    if (!placeBet(rouletteGame.currentBet)) {
        return;
    }
    
    rouletteGame.isSpinning = true;
    
    // Disable spin button
    const spinButton = document.getElementById('spin-button');
    if (spinButton) {
        spinButton.disabled = true;
        spinButton.textContent = 'Girando...';
    }
    
    // Generate winning number with house edge manipulation
    // 85% chance of house winning, 15% chance of player winning
    const houseWinChance = 0.85;
    let winningNumber;
    
    if (Math.random() < houseWinChance) {
        // House wins - choose a number that doesn't match any player bets
        winningNumber = getLosingNumberForPlayer();
    } else {
        // Player wins - choose randomly (but still with reduced payouts)
        const winningIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
        winningNumber = ROULETTE_NUMBERS[winningIndex];
    }
    
    // Calculate spin rotation
    const segmentAngle = 360 / ROULETTE_NUMBERS.length;
    const winningIndex = ROULETTE_NUMBERS.findIndex(num => num.number === winningNumber.number);
    const finalRotation = (winningIndex * segmentAngle) + (Math.random() * segmentAngle);
    const totalRotation = 1800 + finalRotation; // Multiple full rotations plus final position
    
    // Animate wheel
    const wheel = document.getElementById('roulette-wheel');
    const ball = document.getElementById('wheel-ball');
    
    if (wheel) {
        wheel.style.transition = `transform ${rouletteGame.spinDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        wheel.style.transform = `rotate(${totalRotation}deg)`;
    }
    
    if (ball) {
        ball.style.transition = `transform ${rouletteGame.spinDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        ball.style.transform = `rotate(${-totalRotation}deg)`;
    }
    
    // Show result after spin
    setTimeout(() => {
        showWinningNumber(winningNumber);
        calculateWinnings(winningNumber);
        resetGame();
    }, rouletteGame.spinDuration);
}

function showWinningNumber(winningNumber) {
    const winningNumberElement = document.getElementById('winning-number');
    const winningNumberText = document.getElementById('winning-number-text');
    
    if (winningNumberElement && winningNumberText) {
        winningNumberText.textContent = winningNumber.number;
        winningNumberElement.className = `winning-number ${winningNumber.color}`;
        winningNumberElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            winningNumberElement.style.display = 'none';
        }, 5000);
    }
}

function calculateWinnings(winningNumber) {
    let totalWinnings = 0;
    let winningBets = [];
    
    if (!rouletteGame.bets) return;
    
    rouletteGame.bets.forEach(bet => {
        let isWinning = false;
        let payout = 0;
        
        switch(bet.type) {
            case 'number':
                if (bet.value === winningNumber.number) {
                    isWinning = true;
                    payout = 35; // 35:1 payout
                }
                break;
                
            case 'color':
                if (bet.value === winningNumber.color && winningNumber.number !== 0) {
                    isWinning = true;
                    payout = 1; // 1:1 payout
                }
                break;
                
            case 'type':
                if (winningNumber.number !== 0) {
                    const isEven = winningNumber.number % 2 === 0;
                    if ((bet.value === 'even' && isEven) || (bet.value === 'odd' && !isEven)) {
                        isWinning = true;
                        payout = 1; // 1:1 payout
                    }
                }
                break;
                
            case 'range':
                if (winningNumber.number !== 0) {
                    if ((bet.value === '1-18' && winningNumber.number <= 18) ||
                        (bet.value === '19-36' && winningNumber.number >= 19)) {
                        isWinning = true;
                        payout = 1; // 1:1 payout
                    }
                }
                break;
                
            case 'dozen':
                if (winningNumber.number !== 0) {
                    const dozen = Math.ceil(winningNumber.number / 12);
                    const betDozen = bet.value === '1st' ? 1 : bet.value === '2nd' ? 2 : 3;
                    if (dozen === betDozen) {
                        isWinning = true;
                        payout = 2; // 2:1 payout
                    }
                }
                break;
        }
        
        if (isWinning) {
            const winAmount = bet.amount * (payout + 1); // Include original bet
            totalWinnings += winAmount;
            winningBets.push({
                description: getBetDescription(bet.type, bet.value),
                amount: bet.amount,
                winAmount: winAmount
            });
        }
    });
    
    // Update balance with winnings
    if (totalWinnings > 0) {
        addWinnings(totalWinnings);
        
        let message = `Parabéns! Número vencedor: ${winningNumber.number} (${winningNumber.color})\n`;
        message += `Total ganho: R$ ${totalWinnings.toFixed(2)}\n`;
        message += 'Apostas vencedoras:\n';
        winningBets.forEach(bet => {
            message += `- ${bet.description}: R$ ${bet.winAmount.toFixed(2)}\n`;
        });
        
        showNotification(message, 'success');
    } else {
        showNotification(`Número vencedor: ${winningNumber.number} (${winningNumber.color})\nNenhuma aposta vencedora desta vez.`, 'info');
    }
    
    // Update game statistics
    if (typeof updateGameStats === 'function') {
        updateGameStats('roulette', rouletteGame.currentBet, totalWinnings);
    }
}

function resetGame() {
    rouletteGame.isSpinning = false;
    rouletteGame.bets = [];
    rouletteGame.currentBet = 0;
    
    // Reset spin button
    const spinButton = document.getElementById('spin-button');
    if (spinButton) {
        spinButton.disabled = false;
        spinButton.textContent = 'Girar Roleta';
    }
    
    // Update display
    updateBetDisplay();
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

function updateGameStats(game, wagered, won) {
    if (typeof window.AnonymousSession !== 'undefined' && window.AnonymousSession.updateStats) {
        window.AnonymousSession.updateStats(game, wagered, won);
    }
}

// Export roulette functions
window.RouletteGame = {
    initialize: initializeRoulette,
    placeBet: placeBet,
    spin: spinWheel,
    clear: clearBets
};

