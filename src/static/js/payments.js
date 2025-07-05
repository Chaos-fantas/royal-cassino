// Payment system for Casino Online - Real Gateway Integration

// Payment configuration
const PAYMENT_CONFIG = {
    apiBaseUrl: '/api/payments',
    supportedMethods: ['pix', 'credit_card', 'debit_card'],
    minAmount: 10.0,
    maxAmount: 10000.0
};

// Process real payment through gateway
async function processDeposit(amount, paymentMethod, additionalData = {}) {
    try {
        // Validate amount
        if (amount < PAYMENT_CONFIG.minAmount || amount > PAYMENT_CONFIG.maxAmount) {
            throw new Error(`Valor deve estar entre R$ ${PAYMENT_CONFIG.minAmount} e R$ ${PAYMENT_CONFIG.maxAmount}`);
        }

        // Get anonymous session ID
        const anonId = getAnonymousId();
        if (!anonId) {
            throw new Error('Sessão não encontrada');
        }

        // Prepare payment data
        const paymentData = {
            anon_id: anonId,
            amount: amount,
            payment_method: paymentMethod,
            customer_name: additionalData.customerName || 'Cliente Anônimo',
            customer_email: additionalData.customerEmail || 'cliente@casino.com',
            customer_cpf: additionalData.customerCpf || '00000000000'
        };

        // Add card data if needed
        if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
            if (!additionalData.card) {
                throw new Error('Dados do cartão são obrigatórios');
            }
            paymentData.card = additionalData.card;
        }

        // Show processing state
        showProcessingState(true);

        // Send request to backend
        const response = await fetch(`${PAYMENT_CONFIG.apiBaseUrl}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (result.success) {
            // Handle successful payment initiation
            if (paymentMethod === 'pix') {
                // Show PIX QR Code
                showPixPayment(result);
            } else {
                // Card payment processed immediately
                showPaymentSuccess(result);
                updateBalanceDisplay();
            }
            
            return result;
        } else {
            throw new Error(result.error || 'Erro no processamento do pagamento');
        }

    } catch (error) {
        console.error('Payment error:', error);
        showPaymentError(error.message);
        throw error;
    } finally {
        showProcessingState(false);
    }
}

// Show PIX payment interface
function showPixPayment(paymentResult) {
    const modal = document.getElementById('deposit-modal');
    if (!modal) return;

    // Create PIX interface
    const pixInterface = `
        <div class="pix-payment-container">
            <h3>Pagamento PIX</h3>
            <p>Escaneie o QR Code abaixo ou copie o código PIX:</p>
            
            <div class="qr-code-container">
                <div class="qr-placeholder">QR CODE PIX</div>
            </div>
            
            <div class="pix-code-container">
                <input type="text" id="pix-code" value="PIX_CODE_${paymentResult.transaction_id}" readonly>
                <button onclick="copyPixCode()" class="btn-copy">Copiar Código</button>
            </div>
            
            <div class="payment-info">
                <p><strong>Valor:</strong> R$ ${paymentResult.amount.toFixed(2)}</p>
                <p><strong>Status:</strong> Aguardando pagamento</p>
                <p><strong>Expira em:</strong> 30 minutos</p>
            </div>
            
            <div class="payment-actions">
                <button onclick="checkPaymentStatus(${paymentResult.transaction_id})" class="btn-check">Verificar Pagamento</button>
                <button onclick="closeDepositModal()" class="btn-cancel">Cancelar</button>
            </div>
        </div>
    `;

    // Replace modal content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = pixInterface;
    }

    // Start checking payment status periodically
    startPaymentStatusCheck(paymentResult.transaction_id);
}

// Copy PIX code to clipboard
function copyPixCode() {
    const pixCodeInput = document.getElementById('pix-code');
    if (pixCodeInput) {
        pixCodeInput.select();
        document.execCommand('copy');
        showNotification('Código PIX copiado!', 'success');
    }
}

// Check payment status
async function checkPaymentStatus(transactionId) {
    try {
        const response = await fetch(`${PAYMENT_CONFIG.apiBaseUrl}/status/${transactionId}`);
        const result = await response.json();

        if (result.success) {
            if (result.status === 'completed') {
                showPaymentSuccess(result);
                updateBalanceDisplay();
                closeDepositModal();
                stopPaymentStatusCheck();
            } else if (result.status === 'failed') {
                showPaymentError('Pagamento falhou ou foi recusado');
                closeDepositModal();
                stopPaymentStatusCheck();
            }
            // If still processing, continue checking
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
    }
}

// Start periodic payment status checking
let paymentStatusInterval;
function startPaymentStatusCheck(transactionId) {
    stopPaymentStatusCheck(); // Clear any existing interval
    
    paymentStatusInterval = setInterval(() => {
        checkPaymentStatus(transactionId);
    }, 5000); // Check every 5 seconds
    
    // Stop checking after 10 minutes
    setTimeout(() => {
        stopPaymentStatusCheck();
    }, 600000);
}

// Stop payment status checking
function stopPaymentStatusCheck() {
    if (paymentStatusInterval) {
        clearInterval(paymentStatusInterval);
        paymentStatusInterval = null;
    }
}

// Show payment success
function showPaymentSuccess(result) {
    showNotification(`Pagamento aprovado! R$ ${result.amount.toFixed(2)} adicionado ao seu saldo.`, 'success');
}

// Show payment error
function showPaymentError(message) {
    showNotification(`Erro no pagamento: ${message}`, 'error');
}

// Show processing state
function showProcessingState(isProcessing) {
    const submitButton = document.querySelector('#deposit-modal .btn-submit');
    if (submitButton) {
        submitButton.disabled = isProcessing;
        submitButton.textContent = isProcessing ? 'Processando...' : 'Confirmar Depósito';
    }
}

// Format expiration date
function formatExpirationDate(dateString) {
    if (!dateString) return 'Não especificado';
    
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

// Validate deposit form
function validateDepositForm() {
    const amount = parseFloat(document.getElementById('deposit-amount')?.value || 0);
    const paymentMethod = document.getElementById('payment-method')?.value;

    if (!amount || amount < PAYMENT_CONFIG.minAmount) {
        throw new Error(`Valor mínimo é R$ ${PAYMENT_CONFIG.minAmount.toFixed(2)}`);
    }

    if (amount > PAYMENT_CONFIG.maxAmount) {
        throw new Error(`Valor máximo é R$ ${PAYMENT_CONFIG.maxAmount.toFixed(2)}`);
    }

    if (!paymentMethod || !PAYMENT_CONFIG.supportedMethods.includes(paymentMethod)) {
        throw new Error('Método de pagamento inválido');
    }

    return { amount, paymentMethod };
}

// Handle deposit form submission
async function handleDepositSubmit() {
    try {
        const { amount, paymentMethod } = validateDepositForm();
        
        let additionalData = {};
        
        // Get card data if needed
        if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
            const cardNumber = document.getElementById('card-number')?.value;
            const cardHolder = document.getElementById('card-holder')?.value;
            const cardExpiry = document.getElementById('card-expiry')?.value;
            const cardCvv = document.getElementById('card-cvv')?.value;
            
            if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
                throw new Error('Todos os campos do cartão são obrigatórios');
            }
            
            additionalData.card = {
                number: cardNumber.replace(/\s/g, ''),
                holder_name: cardHolder,
                expiration_date: cardExpiry.replace('/', ''),
                cvv: cardCvv
            };
        }
        
        await processDeposit(amount, paymentMethod, additionalData);
        
    } catch (error) {
        showPaymentError(error.message);
    }
}

// Update balance display after successful payment
function updateBalanceDisplay() {
    const balance = getAnonymousBalance();
    const balanceElement = document.getElementById('balance-amount');
    if (balanceElement) {
        balanceElement.textContent = balance.toFixed(2);
    }
}

// Export functions for global use
window.processDeposit = processDeposit;
window.handleDepositSubmit = handleDepositSubmit;
window.checkPaymentStatus = checkPaymentStatus;
window.copyPixCode = copyPixCode;

