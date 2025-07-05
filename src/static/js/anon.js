// Anonymous session management for Casino Online

// Session configuration
const SESSION_CONFIG = {
    storageKey: 'casino_anon_session',
    defaultBalance: 0.00,   // Starting balance for new users - MUST DEPOSIT TO PLAY
    maxBalance: 50000.00,   // Maximum balance limit
    sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

let anonymousSession = null;

// Initialize anonymous session
function initializeAnonymousSession() {
    try {
        loadSession();
        
        if (!anonymousSession || isSessionExpired()) {
            createNewSession();
        } else {
            updateLastActivity();
        }
        
        console.log('Anonymous session initialized:', anonymousSession.id);
        return anonymousSession;
    } catch (error) {
        console.error('Error initializing anonymous session:', error);
        createNewSession();
        return anonymousSession;
    }
}

function createNewSession() {
    anonymousSession = {
        id: generateSessionId(),
        balance: SESSION_CONFIG.defaultBalance,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        gamesPlayed: 0,
        totalWagered: 0,
        totalWon: 0,
        transactions: []
    };
    
    saveSession();
    console.log('New anonymous session created:', anonymousSession.id);
}

function loadSession() {
    const sessionData = localStorage.getItem(SESSION_CONFIG.storageKey);
    if (sessionData) {
        try {
            anonymousSession = JSON.parse(sessionData);
        } catch (error) {
            console.error('Error parsing session data:', error);
            anonymousSession = null;
        }
    }
}

function saveSession() {
    if (anonymousSession) {
        try {
            localStorage.setItem(SESSION_CONFIG.storageKey, JSON.stringify(anonymousSession));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }
}

function isSessionExpired() {
    if (!anonymousSession || !anonymousSession.lastActivity) {
        return true;
    }
    
    const lastActivity = new Date(anonymousSession.lastActivity);
    const now = new Date();
    const timeDiff = now.getTime() - lastActivity.getTime();
    
    return timeDiff > SESSION_CONFIG.sessionTimeout;
}

function updateLastActivity() {
    if (anonymousSession) {
        anonymousSession.lastActivity = new Date().toISOString();
        saveSession();
    }
}

function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `ANON_${timestamp}_${randomStr}`.toUpperCase();
}

// Balance management functions
function getAnonymousBalance() {
    if (!anonymousSession) {
        initializeAnonymousSession();
    }
    return anonymousSession ? anonymousSession.balance : 0;
}

function updateAnonymousBalance(amount) {
    if (!anonymousSession) {
        initializeAnonymousSession();
    }
    
    if (!anonymousSession) {
        console.error('No anonymous session available');
        return false;
    }
    
    const newBalance = anonymousSession.balance + amount;
    
    // Validate balance limits
    if (newBalance < 0) {
        console.warn('Insufficient balance for transaction');
        return false;
    }
    
    if (newBalance > SESSION_CONFIG.maxBalance) {
        console.warn('Balance exceeds maximum limit');
        return false;
    }
    
    // Update balance
    anonymousSession.balance = newBalance;
    updateLastActivity();
    saveSession();
    
    // Log transaction
    logBalanceTransaction(amount, newBalance);
    
    return true;
}

function logBalanceTransaction(amount, newBalance) {
    if (!anonymousSession) return;
    
    const transaction = {
        id: generateTransactionId(),
        type: amount > 0 ? 'credit' : 'debit',
        amount: Math.abs(amount),
        balanceAfter: newBalance,
        timestamp: new Date().toISOString()
    };
    
    if (!anonymousSession.transactions) {
        anonymousSession.transactions = [];
    }
    
    anonymousSession.transactions.push(transaction);
    
    // Keep only last 50 transactions
    if (anonymousSession.transactions.length > 50) {
        anonymousSession.transactions = anonymousSession.transactions.slice(-50);
    }
    
    saveSession();
}

function generateTransactionId() {
    return 'BAL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// Game statistics functions
function updateGameStats(gameType, wagered, won) {
    if (!anonymousSession) {
        initializeAnonymousSession();
    }
    
    if (anonymousSession) {
        anonymousSession.gamesPlayed = (anonymousSession.gamesPlayed || 0) + 1;
        anonymousSession.totalWagered = (anonymousSession.totalWagered || 0) + wagered;
        anonymousSession.totalWon = (anonymousSession.totalWon || 0) + won;
        
        updateLastActivity();
        saveSession();
    }
}

function getGameStats() {
    if (!anonymousSession) {
        initializeAnonymousSession();
    }
    
    return anonymousSession ? {
        gamesPlayed: anonymousSession.gamesPlayed || 0,
        totalWagered: anonymousSession.totalWagered || 0,
        totalWon: anonymousSession.totalWon || 0,
        netResult: (anonymousSession.totalWon || 0) - (anonymousSession.totalWagered || 0)
    } : null;
}

// Session management functions
function getSessionInfo() {
    if (!anonymousSession) {
        initializeAnonymousSession();
    }
    
    return anonymousSession ? {
        id: anonymousSession.id,
        balance: anonymousSession.balance,
        createdAt: anonymousSession.createdAt,
        lastActivity: anonymousSession.lastActivity,
        isExpired: isSessionExpired()
    } : null;
}

function resetSession() {
    if (anonymousSession) {
        localStorage.removeItem(SESSION_CONFIG.storageKey);
        anonymousSession = null;
        initializeAnonymousSession();
        
        // Update balance display if function exists
        if (typeof updateBalanceDisplay === 'function') {
            updateBalanceDisplay();
        } else if (typeof window.CasinoMain !== 'undefined' && window.CasinoMain.updateBalanceDisplay) {
            window.CasinoMain.updateBalanceDisplay();
        }
        
        console.log('Session reset successfully');
        return true;
    }
    return false;
}

function extendSession() {
    if (anonymousSession) {
        updateLastActivity();
        console.log('Session extended');
        return true;
    }
    return false;
}

// Utility functions
function formatBalance(balance) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(balance);
}

function getTransactionHistory() {
    return anonymousSession && anonymousSession.transactions ? 
           [...anonymousSession.transactions].reverse() : [];
}

// Auto-save session periodically
setInterval(() => {
    if (anonymousSession) {
        updateLastActivity();
    }
}, 60000); // Update every minute

// Export functions for global access
window.AnonymousSession = {
    initialize: initializeAnonymousSession,
    getBalance: getAnonymousBalance,
    updateBalance: updateAnonymousBalance,
    getStats: getGameStats,
    updateStats: updateGameStats,
    getInfo: getSessionInfo,
    reset: resetSession,
    extend: extendSession,
    formatBalance: formatBalance,
    getTransactionHistory: getTransactionHistory
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAnonymousSession();
});

