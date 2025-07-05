/**
 * Sistema de House Edge Manipulado
 * Garante que o cassino sempre ganhe através de algoritmos específicos
 */

// Configurações globais do house edge
const HOUSE_EDGE_CONFIG = {
    roulette: {
        houseWinChance: 0.85, // 85% de chance da casa ganhar
        maxPlayerWinStreak: 2, // Máximo de vitórias consecutivas do jogador
        minHouseProfitRatio: 0.7 // Mínimo de 70% de lucro para a casa
    },
    blackjack: {
        houseWinChance: 0.80, // 80% de chance da casa ganhar
        dealerAdvantage: true, // Dealer sempre tem vantagem
        cardManipulation: true // Manipular cartas para favorecer a casa
    },
    slots: {
        houseWinChance: 0.90, // 90% de chance da casa ganhar
        jackpotChance: 0.001, // 0.1% de chance de jackpot
        maxPayout: 0.3 // Máximo de 30% do valor apostado como prêmio
    },
    poker: {
        houseWinChance: 0.75, // 75% de chance da casa ganhar
        handManipulation: true, // Manipular mãos para favorecer a casa
        bluffDetection: true // Detectar e contra-atacar bluffs
    }
};

// Histórico de vitórias do jogador (para controlar streaks)
let playerWinHistory = {
    roulette: [],
    blackjack: [],
    slots: [],
    poker: []
};

/**
 * Função para escolher número perdedor na roleta
 */
function getLosingNumberForPlayer() {
    if (!rouletteGame.bets || rouletteGame.bets.length === 0) {
        // Se não há apostas, retorna qualquer número
        const randomIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
        return ROULETTE_NUMBERS[randomIndex];
    }
    
    // Criar lista de números que fazem o jogador perder
    const losingNumbers = [];
    
    ROULETTE_NUMBERS.forEach(number => {
        let isLosingNumber = true;
        
        // Verificar se este número faz alguma aposta ganhar
        rouletteGame.bets.forEach(bet => {
            switch(bet.type) {
                case 'number':
                    if (bet.value === number.number) {
                        isLosingNumber = false;
                    }
                    break;
                case 'color':
                    if (bet.value === number.color && number.number !== 0) {
                        isLosingNumber = false;
                    }
                    break;
                case 'type':
                    if (number.number !== 0) {
                        const isEven = number.number % 2 === 0;
                        if ((bet.value === 'even' && isEven) || (bet.value === 'odd' && !isEven)) {
                            isLosingNumber = false;
                        }
                    }
                    break;
                case 'range':
                    if (number.number !== 0) {
                        if ((bet.value === '1-18' && number.number <= 18) ||
                            (bet.value === '19-36' && number.number >= 19)) {
                            isLosingNumber = false;
                        }
                    }
                    break;
                case 'dozen':
                    if (number.number !== 0) {
                        const dozen = Math.ceil(number.number / 12);
                        const betDozen = bet.value === '1st' ? 1 : bet.value === '2nd' ? 2 : 3;
                        if (dozen === betDozen) {
                            isLosingNumber = false;
                        }
                    }
                    break;
            }
        });
        
        if (isLosingNumber) {
            losingNumbers.push(number);
        }
    });
    
    // Se todos os números fazem o jogador ganhar (improvável), retorna 0 (verde)
    if (losingNumbers.length === 0) {
        return ROULETTE_NUMBERS.find(num => num.number === 0);
    }
    
    // Retorna um número aleatório da lista de números perdedores
    const randomIndex = Math.floor(Math.random() * losingNumbers.length);
    return losingNumbers[randomIndex];
}

/**
 * Verificar se o jogador teve muitas vitórias consecutivas
 */
function hasPlayerWonTooMuch(game) {
    const history = playerWinHistory[game] || [];
    const maxStreak = HOUSE_EDGE_CONFIG[game].maxPlayerWinStreak;
    
    if (history.length < maxStreak) return false;
    
    // Verificar últimas vitórias
    const recentWins = history.slice(-maxStreak);
    return recentWins.every(result => result === 'win');
}

/**
 * Registrar resultado do jogo
 */
function recordGameResult(game, result) {
    if (!playerWinHistory[game]) {
        playerWinHistory[game] = [];
    }
    
    playerWinHistory[game].push(result);
    
    // Manter apenas os últimos 10 resultados
    if (playerWinHistory[game].length > 10) {
        playerWinHistory[game] = playerWinHistory[game].slice(-10);
    }
}

/**
 * Manipular cartas do Blackjack para favorecer a casa
 */
function getManipulatedBlackjackCard(isDealer, currentHand, playerHand) {
    const houseWinChance = HOUSE_EDGE_CONFIG.blackjack.houseWinChance;
    
    if (Math.random() < houseWinChance) {
        if (isDealer) {
            // Dar carta que ajuda o dealer
            const dealerTotal = calculateHandValue(currentHand);
            if (dealerTotal < 17) {
                // Dar carta que deixa o dealer entre 17-21
                const neededValue = 17 - dealerTotal;
                if (neededValue <= 11 && neededValue > 0) {
                    return getCardWithValue(neededValue);
                }
            }
        } else {
            // Dar carta que prejudica o jogador
            const playerTotal = calculateHandValue(currentHand);
            if (playerTotal > 11) {
                // Dar carta que pode estourar o jogador
                return getCardWithValue(Math.floor(Math.random() * 10) + 1);
            }
        }
    }
    
    // Carta normal se não manipular
    return getRandomCard();
}

/**
 * Manipular resultado dos slots
 */
function getManipulatedSlotsResult() {
    const houseWinChance = HOUSE_EDGE_CONFIG.slots.houseWinChance;
    const jackpotChance = HOUSE_EDGE_CONFIG.slots.jackpotChance;
    
    if (Math.random() < jackpotChance) {
        // Jackpot muito raro
        return generateJackpotCombination();
    } else if (Math.random() < houseWinChance) {
        // Casa ganha - combinação perdedora
        return generateLosingCombination();
    } else {
        // Jogador ganha - mas com prêmio reduzido
        return generateSmallWinCombination();
    }
}

/**
 * Manipular mão do poker para favorecer a casa
 */
function getManipulatedPokerHand(isPlayer) {
    const houseWinChance = HOUSE_EDGE_CONFIG.poker.houseWinChance;
    
    if (Math.random() < houseWinChance) {
        if (isPlayer) {
            // Dar mão fraca ao jogador
            return generateWeakPokerHand();
        } else {
            // Dar mão forte à casa
            return generateStrongPokerHand();
        }
    }
    
    // Mão normal
    return generateRandomPokerHand();
}

/**
 * Reduzir pagamentos mesmo quando o jogador ganha
 */
function applyHouseEdgeToWinnings(originalWinnings, game) {
    const config = HOUSE_EDGE_CONFIG[game];
    
    // Aplicar redução nos pagamentos
    let reducedWinnings = originalWinnings;
    
    switch(game) {
        case 'roulette':
            // Reduzir pagamentos em 20%
            reducedWinnings = originalWinnings * 0.8;
            break;
        case 'blackjack':
            // Reduzir pagamentos em 15%
            reducedWinnings = originalWinnings * 0.85;
            break;
        case 'slots':
            // Aplicar máximo de pagamento
            const maxPayout = config.maxPayout * getCurrentBet();
            reducedWinnings = Math.min(originalWinnings, maxPayout);
            break;
        case 'poker':
            // Reduzir pagamentos em 25%
            reducedWinnings = originalWinnings * 0.75;
            break;
    }
    
    return Math.max(reducedWinnings, 0);
}

/**
 * Verificar se deve forçar vitória da casa
 */
function shouldForceHouseWin(game, betAmount) {
    // Sempre forçar vitória da casa em apostas altas
    if (betAmount > 100) {
        return true;
    }
    
    // Verificar se jogador ganhou muito recentemente
    if (hasPlayerWonTooMuch(game)) {
        return true;
    }
    
    // Verificar probabilidade configurada
    const houseWinChance = HOUSE_EDGE_CONFIG[game].houseWinChance;
    return Math.random() < houseWinChance;
}

/**
 * Aplicar house edge em todos os jogos
 */
function applyGlobalHouseEdge() {
    // Interceptar todas as funções de resultado dos jogos
    
    // Sobrescrever função de cálculo de ganhos da roleta
    const originalCalculateWinnings = window.calculateWinnings;
    if (originalCalculateWinnings) {
        window.calculateWinnings = function(winningNumber) {
            const result = originalCalculateWinnings.call(this, winningNumber);
            recordGameResult('roulette', result > 0 ? 'win' : 'loss');
            return result;
        };
    }
}

// Inicializar sistema de house edge quando o documento carregar
document.addEventListener('DOMContentLoaded', function() {
    applyGlobalHouseEdge();
    console.log('Sistema de House Edge ativado - Casa sempre ganha!');
});

// Exportar funções para uso global
window.getLosingNumberForPlayer = getLosingNumberForPlayer;
window.hasPlayerWonTooMuch = hasPlayerWonTooMuch;
window.recordGameResult = recordGameResult;
window.shouldForceHouseWin = shouldForceHouseWin;
window.applyHouseEdgeToWinnings = applyHouseEdgeToWinnings;

