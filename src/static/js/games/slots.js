// Slots game implementation

let slotsGame = {
    isSpinning: false,
    currentBet: 1,
    reelResults: [],
    lastWin: 0,
    totalSpins: 0,
    totalWins: 0,
    biggestWin: 0,
    jackpotPool: 5000,
    symbols: [
        { symbol: '🍒', name: 'Cereja', value: 2, weight: 25 },
        { symbol: '🍋', name: 'Limão', value: 3, weight: 20 },
        { symbol: '🍊', name: 'Laranja', value: 4, weight: 18 },
        { symbol: '🍇', name: 'Uva', value: 5, weight: 15 },
        { symbol: '🔔', name: 'Sino', value: 8, weight: 10 },
        { symbol: '⭐', name: 'Estrela', value: 12, weight: 8 },
        { symbol: '💎', name: 'Diamante', value: 20, weight: 3 },
        { symbol: '🎰', name: 'Jackpot', value: 100, weight: 1 }
    ]
};

function initializeSlots(container) {
    container.innerHTML = `
        <div class="slots-game">
            <div class="game-header">
                <h2>🎰 Caça-níqueis Royal</h2>
                <div class="jackpot-display">
                    <div class="jackpot-label">JACKPOT</div>
                    <div class="jackpot-amount" id="jackpot-amount">R$ ${slotsGame.jackpotPool.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="slot-machine">
                <div class="machine-top">
                    <div class="lights">
                        <div class="light"></div>
                        <div class="light"></div>
                        <div class="light"></div>
                        <div class="light"></div>
                        <div class="light"></div>
                    </div>
                </div>
                
                <div class="reels-container">
                    <div class="reel" id="reel1">
                        <div class="reel-strip" id="strip1"></div>
                    </div>
                    <div class="reel" id="reel2">
                        <div class="reel-strip" id="strip2"></div>
                    </div>
                    <div class="reel" id="reel3">
                        <div class="reel-strip" id="strip3"></div>
                    </div>
                </div>
                
                <div class="win-line"></div>
                
                <div class="result-display">
                    <div class="last-win" id="last-win">Última vitória: R$ 0.00</div>
                    <div class="win-message" id="win-message"></div>
                </div>
            </div>
            
            <div class="game-controls">
                <div class="bet-controls">
                    <h3>Controles de Aposta</h3>
                    <div class="bet-amount">
                        <label>Valor da Aposta:</label>
                        <div class="bet-buttons">
                            <button class="bet-btn selected" onclick="setSlotsbet(1)">R$ 1</button>
                            <button class="bet-btn" onclick="setSlotsbet(5)">R$ 5</button>
                            <button class="bet-btn" onclick="setSlotsbet(10)">R$ 10</button>
                            <button class="bet-btn" onclick="setSlotsbet(25)">R$ 25</button>
                            <button class="bet-btn" onclick="setSlotsbet(50)">R$ 50</button>
                            <button class="bet-btn" onclick="setSlotsbet(100)">R$ 100</button>
                        </div>
                        <div class="custom-bet">
                            <input type="range" id="bet-slider" min="1" max="100" value="1" step="1" oninput="updateSlotsBet(this.value)">
                            <span id="bet-display">R$ 1</span>
                        </div>
                    </div>
                    
                    <div class="spin-controls">
                        <button id="spin-btn" class="spin-button" onclick="spinSlots()">
                            <span class="spin-icon">🎰</span>
                            GIRAR
                        </button>
                        <button id="max-bet-btn" class="max-bet-button" onclick="maxBetSpin()">
                            APOSTA MÁXIMA
                        </button>
                    </div>
                </div>
                
                <div class="game-info">
                    <div class="balance-info">
                        <div class="balance-item">
                            <span class="label">Saldo:</span>
                            <span class="value" id="slots-balance">R$ 0.00</span>
                        </div>
                        <div class="balance-item">
                            <span class="label">Aposta:</span>
                            <span class="value" id="slots-current-bet">R$ 1.00</span>
                        </div>
                    </div>
                    
                    <div class="stats-info">
                        <div class="stat-item">
                            <span class="label">Giros:</span>
                            <span class="value" id="slots-total-spins">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Vitórias:</span>
                            <span class="value" id="slots-total-wins">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Maior Prêmio:</span>
                            <span class="value" id="slots-biggest-win">R$ 0.00</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="pay-table">
                <h3>Tabela de Pagamentos</h3>
                <div class="pay-table-content" id="pay-table-content">
                    ${generatePayTable()}
                </div>
            </div>
        </div>
    `;
    
    addSlotsStyles();
    initializeSlotsReels();
    updateSlotsDisplay();
}

function addSlotsStyles() {
    if (document.querySelector('#slots-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'slots-styles';
    styles.textContent = `
        .slots-game {
            max-width: 800px;
            margin: 0 auto;
            padding: 1rem;
        }
        
        .game-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .game-header h2 {
            color: #FFD700;
            font-size: 2.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        .jackpot-display {
            background: linear-gradient(45deg, #FFD700, #FFA500);
            color: #000;
            padding: 1rem 2rem;
            border-radius: 15px;
            border: 3px solid #FF6B6B;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            animation: jackpotGlow 2s infinite alternate;
        }
        
        .jackpot-label {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .jackpot-amount {
            font-size: 2rem;
            font-weight: bold;
            font-family: 'Courier New', monospace;
        }
        
        @keyframes jackpotGlow {
            from { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
            to { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 107, 107, 0.3); }
        }
        
        .slot-machine {
            background: linear-gradient(135deg, #2c2c2c, #1a1a1a);
            border: 5px solid #FFD700;
            border-radius: 20px;
            padding: 2rem;
            margin: 2rem 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            position: relative;
        }
        
        .machine-top {
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .lights {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .light {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #FFD700;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
            animation: blink 1s infinite alternate;
        }
        
        .light:nth-child(2) { animation-delay: 0.2s; }
        .light:nth-child(3) { animation-delay: 0.4s; }
        .light:nth-child(4) { animation-delay: 0.6s; }
        .light:nth-child(5) { animation-delay: 0.8s; }
        
        @keyframes blink {
            from { opacity: 1; }
            to { opacity: 0.3; }
        }
        
        .reels-container {
            display: flex;
            justify-content: center;
            gap: 1rem;
            background: #000;
            padding: 1rem;
            border-radius: 10px;
            border: 3px solid #FFD700;
            position: relative;
            overflow: hidden;
        }
        
        .reel {
            width: 120px;
            height: 150px;
            background: #fff;
            border: 3px solid #333;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
        }
        
        .reel-strip {
            position: absolute;
            width: 100%;
            transition: transform 0.1s ease;
        }
        
        .symbol {
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            border-bottom: 1px solid #ddd;
            background: linear-gradient(135deg, #fff, #f0f0f0);
        }
        
        .symbol.winning {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            animation: symbolWin 0.5s ease-in-out infinite alternate;
        }
        
        @keyframes symbolWin {
            from { transform: scale(1); }
            to { transform: scale(1.1); }
        }
        
        .win-line {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 3px;
            background: #FF6B6B;
            transform: translateY(-50%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .win-line.active {
            opacity: 1;
            animation: winLinePulse 0.5s ease-in-out infinite alternate;
        }
        
        @keyframes winLinePulse {
            from { background: #FF6B6B; }
            to { background: #FFD700; }
        }
        
        .result-display {
            text-align: center;
            margin-top: 1rem;
        }
        
        .last-win {
            color: #00FF00;
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .win-message {
            color: #FFD700;
            font-size: 1.5rem;
            font-weight: bold;
            min-height: 2rem;
        }
        
        .game-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin: 2rem 0;
        }
        
        .bet-controls {
            background: #333;
            padding: 1.5rem;
            border-radius: 10px;
            border: 2px solid #FFD700;
        }
        
        .bet-controls h3 {
            color: #FFD700;
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .bet-buttons {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            margin: 1rem 0;
        }
        
        .bet-btn {
            background: #DC143C;
            color: white;
            border: 2px solid #FFD700;
            border-radius: 5px;
            padding: 0.5rem;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .bet-btn:hover,
        .bet-btn.selected {
            background: #FFD700;
            color: #000;
            transform: scale(1.05);
        }
        
        .custom-bet {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin: 1rem 0;
        }
        
        #bet-slider {
            flex: 1;
            height: 8px;
            background: #1a1a1a;
            border-radius: 5px;
            outline: none;
        }
        
        #bet-display {
            color: #FFD700;
            font-weight: bold;
            font-size: 1.1rem;
            min-width: 80px;
        }
        
        .spin-controls {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .spin-button {
            background: linear-gradient(135deg, #DC143C, #B22222);
            color: white;
            border: 3px solid #FFD700;
            border-radius: 15px;
            padding: 1rem 2rem;
            font-size: 1.5rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .spin-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
            transform: scale(1.05);
        }
        
        .spin-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .spin-button.spinning {
            animation: spinButtonPulse 0.5s ease-in-out infinite alternate;
        }
        
        @keyframes spinButtonPulse {
            from { transform: scale(1); }
            to { transform: scale(1.02); }
        }
        
        .spin-icon {
            font-size: 2rem;
            animation: spinIcon 2s linear infinite;
        }
        
        .spinning .spin-icon {
            animation-duration: 0.2s;
        }
        
        @keyframes spinIcon {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .max-bet-button {
            background: #006400;
            color: white;
            border: 2px solid #FFD700;
            border-radius: 8px;
            padding: 0.75rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .max-bet-button:hover {
            background: #008000;
            transform: scale(1.02);
        }
        
        .game-info {
            background: #1a1a1a;
            padding: 1.5rem;
            border-radius: 10px;
            border: 2px solid #FFD700;
        }
        
        .balance-info,
        .stats-info {
            margin-bottom: 1rem;
        }
        
        .balance-item,
        .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            background: #333;
            border-radius: 5px;
        }
        
        .label {
            color: #ccc;
        }
        
        .value {
            color: #FFD700;
            font-weight: bold;
        }
        
        .pay-table {
            background: #333;
            padding: 1.5rem;
            border-radius: 10px;
            border: 2px solid #FFD700;
            margin-top: 2rem;
        }
        
        .pay-table h3 {
            color: #FFD700;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .pay-table-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .pay-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem;
            background: #1a1a1a;
            border-radius: 5px;
            border: 1px solid #FFD700;
        }
        
        .pay-symbols {
            display: flex;
            gap: 0.25rem;
            font-size: 1.2rem;
        }
        
        .pay-multiplier {
            color: #FFD700;
            font-weight: bold;
        }
        
        .spinning-reel {
            animation: reelSpin 0.1s linear infinite;
        }
        
        @keyframes reelSpin {
            from { transform: translateY(0); }
            to { transform: translateY(-50px); }
        }
        
        @media (max-width: 768px) {
            .game-controls {
                grid-template-columns: 1fr;
            }
            
            .reels-container {
                gap: 0.5rem;
            }
            
            .reel {
                width: 80px;
                height: 120px;
            }
            
            .symbol {
                height: 40px;
                font-size: 1.8rem;
            }
            
            .bet-buttons {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .pay-table-content {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(styles);
}

function generatePayTable() {
    return slotsGame.symbols.map(symbol => `
        <div class="pay-item">
            <div class="pay-symbols">
                <span>${symbol.symbol}</span>
                <span>${symbol.symbol}</span>
                <span>${symbol.symbol}</span>
            </div>
            <div class="pay-multiplier">${symbol.value}x</div>
        </div>
    `).join('');
}

function initializeSlotsReels() {
    const reels = ['strip1', 'strip2', 'strip3'];
    
    reels.forEach(reelId => {
        const reel = document.getElementById(reelId);
        if (!reel) return;
        
        reel.innerHTML = '';
        
        // Create multiple symbols for scrolling effect
        for (let i = 0; i < 20; i++) {
            const symbol = getSlotsRandomSymbol();
            const symbolEl = document.createElement('div');
            symbolEl.className = 'symbol';
            symbolEl.textContent = symbol.symbol;
            symbolEl.dataset.value = symbol.value;
            symbolEl.dataset.name = symbol.name;
            reel.appendChild(symbolEl);
        }
    });
}

function getSlotsRandomSymbol() {
    const totalWeight = slotsGame.symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let symbol of slotsGame.symbols) {
        random -= symbol.weight;
        if (random <= 0) {
            return symbol;
        }
    }
    
    return slotsGame.symbols[0]; // Fallback
}

function setSlotsbet(amount) {
    if (amount < 1) amount = 1;
    if (amount > 100) amount = 100;
    
    slotsGame.currentBet = amount;
    document.getElementById('bet-slider').value = amount;
    updateSlotsDisplay();
    updateSlotsBetButtons(amount);
}

function updateSlotsBet(value) {
    setSlotsbet(parseInt(value));
}

function updateSlotsBetButtons(selectedAmount = null) {
    document.querySelectorAll('.bet-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (selectedAmount && btn.textContent.includes(selectedAmount.toString())) {
            btn.classList.add('selected');
        }
    });
}

function updateSlotsDisplay() {
    const balance = getPlayerBalance();
    document.getElementById('slots-balance').textContent = balance.toFixed(2);
    document.getElementById('slots-current-bet').textContent = slotsGame.currentBet.toFixed(2);
    document.getElementById('bet-display').textContent = `R$ ${slotsGame.currentBet}`;
    document.getElementById('last-win').textContent = `Última vitória: R$ ${slotsGame.lastWin.toFixed(2)}`;
    document.getElementById('slots-total-spins').textContent = slotsGame.totalSpins;
    document.getElementById('slots-total-wins').textContent = slotsGame.totalWins;
    document.getElementById('slots-biggest-win').textContent = slotsGame.biggestWin.toFixed(2);
    document.getElementById('jackpot-amount').textContent = `R$ ${slotsGame.jackpotPool.toFixed(2)}`;
}

function spinSlots() {
    if (slotsGame.isSpinning) return;
    
    const balance = getPlayerBalance();
    if (balance < slotsGame.currentBet) {
        showNotification('Saldo insuficiente!', 'error');
        return;
    }
    
    // Deduct bet
    if (!placeBet(slotsGame.currentBet)) {
        return;
    }
    
    // Add small part to jackpot
    slotsGame.jackpotPool += slotsGame.currentBet * 0.01;
    
    slotsGame.isSpinning = true;
    slotsGame.totalSpins++;
    
    // Update interface
    const spinBtn = document.getElementById('spin-btn');
    spinBtn.disabled = true;
    spinBtn.classList.add('spinning');
    document.getElementById('win-message').textContent = '';
    document.querySelector('.win-line').classList.remove('active');
    
    // Clear previous winning symbols
    document.querySelectorAll('.symbol.winning').forEach(symbol => {
        symbol.classList.remove('winning');
    });
    
    // Generate result
    const result = generateSlotsSpinResult();
    
    // Animate reels
    animateSlotsReels(result);
    
    // Process result after animation
    setTimeout(() => {
        processSlotsResult(result);
    }, 3000);
    
    updateSlotsDisplay();
}

function maxBetSpin() {
    setSlotsbet(100);
    spinSlots();
}

function generateSlotsSpinResult() {
    const result = [];
    
    // Check jackpot chance first
    if (Math.random() < 0.001) { // 0.1% chance
        const jackpotSymbol = slotsGame.symbols.find(s => s.symbol === '🎰');
        return [jackpotSymbol, jackpotSymbol, jackpotSymbol];
    }
    
    // Implement house edge (5%)
    const shouldWin = Math.random() > 0.05;
    
    if (shouldWin && Math.random() < 0.3) { // 30% chance of win when should win
        // Generate winning combination
        const winningSymbol = getSlotsRandomSymbol();
        
        if (Math.random() < 0.7) {
            // Three same symbols
            result.push(winningSymbol, winningSymbol, winningSymbol);
        } else {
            // Two same symbols
            result.push(winningSymbol, winningSymbol, getSlotsRandomSymbol());
        }
    } else {
        // Generate losing combination
        for (let i = 0; i < 3; i++) {
            result.push(getSlotsRandomSymbol());
        }
        
        // Ensure it's not accidentally winning
        if (checkSlotsWinningCombination(result).isWin) {
            result[2] = getSlotsRandomSymbol();
            // Check again and force difference if necessary
            if (checkSlotsWinningCombination(result).isWin) {
                do {
                    result[2] = getSlotsRandomSymbol();
                } while (result[2].symbol === result[0].symbol || result[2].symbol === result[1].symbol);
            }
        }
    }
    
    return result;
}

function animateSlotsReels(result) {
    const reels = ['strip1', 'strip2', 'strip3'];
    
    reels.forEach((reelId, index) => {
        const reel = document.getElementById(reelId);
        if (!reel) return;
        
        // Add spinning animation
        reel.classList.add('spinning-reel');
        
        // Stop each reel at different times
        setTimeout(() => {
            reel.classList.remove('spinning-reel');
            setSlotsReelResult(reel, result[index], index);
        }, 1000 + (index * 500));
    });
}

function setSlotsReelResult(reel, symbol, reelIndex) {
    // Clear reel
    reel.innerHTML = '';
    
    // Add symbols before result (for visual effect)
    for (let i = 0; i < 2; i++) {
        const symbolEl = document.createElement('div');
        symbolEl.className = 'symbol';
        symbolEl.textContent = getSlotsRandomSymbol().symbol;
        reel.appendChild(symbolEl);
    }
    
    // Add result symbol (in center)
    const resultSymbol = document.createElement('div');
    resultSymbol.className = 'symbol result-symbol';
    resultSymbol.textContent = symbol.symbol;
    resultSymbol.dataset.value = symbol.value;
    resultSymbol.dataset.name = symbol.name;
    reel.appendChild(resultSymbol);
    
    // Add symbols after result
    for (let i = 0; i < 2; i++) {
        const symbolEl = document.createElement('div');
        symbolEl.className = 'symbol';
        symbolEl.textContent = getSlotsRandomSymbol().symbol;
        reel.appendChild(symbolEl);
    }
    
    // Position to show result symbol in center
    reel.style.transform = 'translateY(-100px)';
    
    // Store result
    slotsGame.reelResults[reelIndex] = symbol;
}

function processSlotsResult(result) {
    slotsGame.isSpinning = false;
    const spinBtn = document.getElementById('spin-btn');
    spinBtn.disabled = false;
    spinBtn.classList.remove('spinning');
    
    const winInfo = checkSlotsWinningCombination(result);
    
    if (winInfo.isWin) {
        handleSlotsWin(winInfo);
    } else {
        handleSlotsLoss();
    }
    
    updateSlotsDisplay();
}

function checkSlotsWinningCombination(result) {
    const symbols = result.map(r => r.symbol);
    
    // Check jackpot
    if (symbols.every(s => s === '🎰')) {
        return {
            isWin: true,
            type: 'jackpot',
            symbol: '🎰',
            multiplier: slotsGame.jackpotPool / slotsGame.currentBet,
            payout: slotsGame.jackpotPool
        };
    }
    
    // Check three same symbols
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        const symbolData = slotsGame.symbols.find(s => s.symbol === symbols[0]);
        return {
            isWin: true,
            type: 'three',
            symbol: symbols[0],
            multiplier: symbolData.value,
            payout: slotsGame.currentBet * symbolData.value
        };
    }
    
    // Check two same symbols
    if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) {
        const matchingSymbol = symbols[0] === symbols[1] ? symbols[0] : 
                             symbols[1] === symbols[2] ? symbols[1] : symbols[0];
        const symbolData = slotsGame.symbols.find(s => s.symbol === matchingSymbol);
        const multiplier = Math.max(1, Math.floor(symbolData.value / 3));
        
        return {
            isWin: true,
            type: 'two',
            symbol: matchingSymbol,
            multiplier: multiplier,
            payout: slotsGame.currentBet * multiplier
        };
    }
    
    return { isWin: false };
}

function handleSlotsWin(winInfo) {
    slotsGame.totalWins++;
    slotsGame.lastWin = winInfo.payout;
    
    if (winInfo.payout > slotsGame.biggestWin) {
        slotsGame.biggestWin = winInfo.payout;
    }
    
    // Add winnings
    addWinnings(winInfo.payout);
    
    // Show win line
    document.querySelector('.win-line').classList.add('active');
    
    // Highlight winning symbols
    document.querySelectorAll('.result-symbol').forEach(symbol => {
        if (symbol.textContent === winInfo.symbol) {
            symbol.classList.add('winning');
        }
    });
    
    // Win message
    let message = '';
    if (winInfo.type === 'jackpot') {
        message = `🎉 JACKPOT! R$ ${winInfo.payout.toFixed(2)}! 🎉`;
        slotsGame.jackpotPool = 5000; // Reset jackpot
        showSlotsJackpotAnimation();
    } else if (winInfo.type === 'three') {
        message = `🎊 Três ${winInfo.symbol}! Ganhou R$ ${winInfo.payout.toFixed(2)}! 🎊`;
    } else {
        message = `✨ Dois ${winInfo.symbol}! Ganhou R$ ${winInfo.payout.toFixed(2)}! ✨`;
    }
    
    document.getElementById('win-message').textContent = message;
    showNotification(message, 'success');
}

function handleSlotsLoss() {
    slotsGame.lastWin = 0;
    document.getElementById('win-message').textContent = 'Tente novamente!';
}

function showSlotsJackpotAnimation() {
    // Create special jackpot animation
    const jackpotOverlay = document.createElement('div');
    jackpotOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
        animation: fadeIn 0.5s ease;
    `;
    
    jackpotOverlay.innerHTML = `
        <div style="
            text-align: center;
            color: #FFD700;
            font-size: 4rem;
            font-weight: bold;
            animation: jackpotBounce 1s ease-in-out infinite alternate;
        ">
            🎰 JACKPOT! 🎰<br>
            <div style="font-size: 2rem; margin-top: 1rem;">
                R$ ${slotsGame.lastWin.toFixed(2)}
            </div>
        </div>
    `;
    
    // Add animation styles
    if (!document.querySelector('#jackpot-animation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'jackpot-animation-styles';
        styles.textContent = `
            @keyframes jackpotBounce {
                from { transform: scale(1) rotate(-2deg); }
                to { transform: scale(1.1) rotate(2deg); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(jackpotOverlay);
    
    // Remove after 3 seconds
    setTimeout(() => {
        jackpotOverlay.remove();
    }, 3000);
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

// Export slots functions
window.SlotsGame = {
    initialize: initializeSlots,
    spin: spinSlots,
    setBet: setSlotsbet
};

