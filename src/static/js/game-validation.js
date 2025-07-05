// Game validation system - ensures users must deposit before playing

// Minimum balance required to play any game
const MINIMUM_PLAY_BALANCE = 10.00;

// Validate if user can play games
function canUserPlay() {
    const balance = getPlayerBalance();
    return balance >= MINIMUM_PLAY_BALANCE;
}

// Check balance before starting any game
function validateGameStart(gameType, betAmount = 0) {
    const balance = getPlayerBalance();
    
    // Check if user has any balance
    if (balance <= 0) {
        showDepositRequiredMessage('Você precisa fazer um depósito para começar a jogar!');
        return false;
    }
    
    // Check if user has minimum balance
    if (balance < MINIMUM_PLAY_BALANCE) {
        showDepositRequiredMessage(`Saldo mínimo necessário: R$ ${MINIMUM_PLAY_BALANCE.toFixed(2)}. Faça um depósito para continuar jogando!`);
        return false;
    }
    
    // Check if user has enough balance for the bet
    if (betAmount > 0 && balance < betAmount) {
        showDepositRequiredMessage(`Saldo insuficiente para esta aposta. Faça um depósito para continuar!`);
        return false;
    }
    
    return true;
}

// Show deposit required message with call-to-action
function showDepositRequiredMessage(message) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    // Create message container
    const container = document.createElement('div');
    container.style.cssText = `
        background: linear-gradient(135deg, var(--elegant-dark) 0%, var(--deep-navy) 100%);
        padding: 3rem;
        border-radius: 20px;
        text-align: center;
        max-width: 500px;
        margin: 2rem;
        border: 2px solid var(--primary-red);
        box-shadow: 0 20px 40px rgba(220, 38, 38, 0.3);
        animation: slideIn 0.3s ease-out;
    `;
    
    container.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 1rem; color: var(--primary-red);">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2 style="color: var(--luxury-gold); margin-bottom: 1rem; font-family: var(--font-primary);">
            Depósito Necessário
        </h2>
        <p style="color: var(--gray-300); margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6;">
            ${message}
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button id="depositNowBtn" style="
                background: var(--gradient-passion);
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 10px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: var(--shadow-elegant);
            ">
                <i class="fas fa-credit-card"></i> Depositar Agora
            </button>
            <button id="closeDepositMsg" style="
                background: transparent;
                color: var(--gray-400);
                border: 2px solid var(--gray-600);
                padding: 1rem 2rem;
                border-radius: 10px;
                font-size: 1.1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            ">
                <i class="fas fa-times"></i> Fechar
            </button>
        </div>
    `;
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Add event listeners
    document.getElementById('depositNowBtn').addEventListener('click', function() {
        document.body.removeChild(overlay);
        showDepositModal();
    });
    
    document.getElementById('closeDepositMsg').addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
    
    // Close on ESC key
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Override game opening functions to include validation
const originalOpenGame = window.openGame;
window.openGame = function(gameType) {
    if (!validateGameStart(gameType)) {
        return false;
    }
    
    // Call original function if validation passes
    if (originalOpenGame) {
        return originalOpenGame(gameType);
    }
};

// Validate bet placement
function validateBet(amount) {
    const balance = getPlayerBalance();
    
    if (balance <= 0) {
        showDepositRequiredMessage('Você precisa fazer um depósito para apostar!');
        return false;
    }
    
    if (amount > balance) {
        showDepositRequiredMessage('Saldo insuficiente para esta aposta. Faça um depósito!');
        return false;
    }
    
    return true;
}

// Show balance warning when low
function checkLowBalance() {
    const balance = getPlayerBalance();
    
    if (balance > 0 && balance < MINIMUM_PLAY_BALANCE) {
        showNotification(
            `Saldo baixo! Você tem apenas R$ ${balance.toFixed(2)}. Faça um depósito para continuar jogando.`,
            'warning'
        );
    }
}

// Initialize validation system
document.addEventListener('DOMContentLoaded', function() {
    // Check balance periodically
    setInterval(checkLowBalance, 30000); // Check every 30 seconds
    
    // Add validation to all game buttons
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', function(e) {
            const gameType = this.getAttribute('onclick')?.match(/openGame\('(.+?)'\)/)?.[1];
            if (gameType && !validateGameStart(gameType)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    });
});

// Export functions for use in other scripts
window.validateGameStart = validateGameStart;
window.validateBet = validateBet;
window.canUserPlay = canUserPlay;
window.showDepositRequiredMessage = showDepositRequiredMessage;

