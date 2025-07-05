// Main JavaScript file for Casino Online

// Global variables
let currentGame = null;
let gameData = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize anonymous session if not exists
    if (typeof initializeAnonymousSession === 'function') {
        initializeAnonymousSession();
    }
    
    // Update balance display
    updateBalanceDisplay();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('Casino Online initialized successfully');
}

function setupEventListeners() {
    // Navigation smooth scroll
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const depositModal = document.getElementById('deposit-modal');
        if (event.target === depositModal) {
            closeDepositModal();
        }
    });

    // Handle escape key to close modals and games
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeDepositModal();
            closeGame();
        }
    });
}

// Game functions
function openGame(gameType) {
    const gameContainer = document.getElementById('game-container');
    const gameTitle = document.getElementById('game-title');
    const gameContent = document.getElementById('game-content');
    
    if (!gameContainer || !gameTitle || !gameContent) {
        console.error('Game container elements not found');
        return;
    }
    
    currentGame = gameType;
    
    // Set game title
    const gameTitles = {
        'roulette': 'Roleta',
        'blackjack': 'Blackjack',
        'slots': 'Caça-níqueis',
        'poker': 'Poker'
    };
    
    gameTitle.textContent = gameTitles[gameType] || 'Jogo';
    
    // Clear previous game content
    gameContent.innerHTML = '';
    
    // Load game content
    loadGameContent(gameType, gameContent);
    
    // Show game container
    gameContainer.style.display = 'block';
    gameContainer.scrollIntoView({ behavior: 'smooth' });
}

function loadGameContent(gameType, container) {
    switch(gameType) {
        case 'roulette':
            if (typeof initializeRoulette === 'function') {
                initializeRoulette(container);
            } else {
                container.innerHTML = '<p>Jogo da roleta em desenvolvimento...</p>';
            }
            break;
        case 'blackjack':
            if (typeof initializeBlackjack === 'function') {
                initializeBlackjack(container);
            } else {
                container.innerHTML = '<p>Jogo de blackjack em desenvolvimento...</p>';
            }
            break;
        case 'slots':
            if (typeof initializeSlots === 'function') {
                initializeSlots(container);
            } else {
                container.innerHTML = '<p>Caça-níqueis em desenvolvimento...</p>';
            }
            break;
        case 'poker':
            if (typeof initializePoker === 'function') {
                initializePoker(container);
            } else {
                container.innerHTML = '<p>Jogo de poker em desenvolvimento...</p>';
            }
            break;
        default:
            container.innerHTML = '<p>Jogo não encontrado.</p>';
    }
}

function closeGame() {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    
    // Clean up current game
    if (currentGame && typeof cleanupGame === 'function') {
        cleanupGame(currentGame);
    }
    
    currentGame = null;
}

// Utility functions
function scrollToGames() {
    const gamesSection = document.getElementById('games');
    if (gamesSection) {
        gamesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function updateBalanceDisplay() {
    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
        const balance = getPlayerBalance();
        balanceElement.textContent = balance.toFixed(2);
    }
}

function getPlayerBalance() {
    // Get balance from anonymous session or return default
    if (typeof getAnonymousBalance === 'function') {
        return getAnonymousBalance();
    }
    return 0.00;
}

function updatePlayerBalance(amount) {
    if (typeof updateAnonymousBalance === 'function') {
        updateAnonymousBalance(amount);
        updateBalanceDisplay();
        return true;
    }
    return false;
}

// Deposit modal functions
function showDepositModal() {
    const modal = document.getElementById('deposit-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeDepositModal() {
    const modal = document.getElementById('deposit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form
    const form = document.getElementById('deposit-form');
    if (form) {
        form.reset();
        hideAllPaymentInfo();
    }
}

function hideAllPaymentInfo() {
    const paymentInfos = document.querySelectorAll('.payment-info');
    paymentInfos.forEach(info => {
        info.style.display = 'none';
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Game utility functions
function placeBet(amount) {
    const balance = getPlayerBalance();
    if (balance >= amount) {
        updatePlayerBalance(-amount);
        return true;
    } else {
        showNotification('Saldo insuficiente para esta aposta!', 'error');
        return false;
    }
}

function addWinnings(amount) {
    updatePlayerBalance(amount);
    showNotification(`Parabéns! Você ganhou R$ ${amount.toFixed(2)}!`, 'success');
}

// Export functions for use in other scripts
window.CasinoMain = {
    openGame,
    closeGame,
    showDepositModal,
    closeDepositModal,
    updateBalanceDisplay,
    getPlayerBalance,
    updatePlayerBalance,
    showNotification,
    placeBet,
    addWinnings
};

