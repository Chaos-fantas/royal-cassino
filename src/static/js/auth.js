// Sistema de Autenticação
window.Auth = {
    token: localStorage.getItem('casino_token'),
    user: JSON.parse(localStorage.getItem('casino_user') || 'null'),
    
    // Verificar se usuário está logado
    isLoggedIn() {
        return this.token && this.user;
    },
    
    // Fazer login
    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('casino_token', this.token);
                localStorage.setItem('casino_user', JSON.stringify(this.user));
                
                // Atualizar interface
                this.updateUI();
                this.showNotification('Login realizado com sucesso!', 'success');
                return true;
            } else {
                this.showNotification(data.error || 'Erro no login', 'error');
                return false;
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showNotification('Erro de conexão', 'error');
            return false;
        }
    },
    
    // Fazer registro
    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('casino_token', this.token);
                localStorage.setItem('casino_user', JSON.stringify(this.user));
                
                // Atualizar interface
                this.updateUI();
                this.showNotification('Conta criada com sucesso! Bônus de R$ 1.000 adicionado!', 'success');
                return true;
            } else {
                this.showNotification(data.error || 'Erro no registro', 'error');
                return false;
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showNotification('Erro de conexão', 'error');
            return false;
        }
    },
    
    // Fazer logout
    async logout() {
        try {
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            this.token = null;
            this.user = null;
            localStorage.removeItem('casino_token');
            localStorage.removeItem('casino_user');
            this.updateUI();
            this.showNotification('Logout realizado com sucesso!', 'success');
        }
    },
    
    // Obter perfil atualizado
    async getProfile() {
        if (!this.token) return null;
        
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('casino_user', JSON.stringify(this.user));
                this.updateUI();
                return this.user;
            } else if (response.status === 401) {
                // Token expirado
                this.logout();
                return null;
            }
        } catch (error) {
            console.error('Erro ao obter perfil:', error);
        }
        return null;
    },
    
    // Fazer requisição autenticada
    async authenticatedRequest(url, options = {}) {
        if (!this.token) {
            throw new Error('Usuário não autenticado');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            // Token expirado
            this.logout();
            throw new Error('Sessão expirada');
        }
        
        return response;
    },
    
    // Atualizar interface do usuário
    updateUI() {
        const balanceElement = document.getElementById('user-balance');
        const usernameElement = document.getElementById('username-display');
        const loginSection = document.getElementById('login-section');
        const userSection = document.getElementById('user-section');
        
        if (this.isLoggedIn()) {
            // Usuário logado
            if (balanceElement) {
                balanceElement.textContent = `R$ ${this.user.balance.toFixed(2)}`;
            }
            if (usernameElement) {
                usernameElement.textContent = this.user.username;
            }
            if (loginSection) {
                loginSection.style.display = 'none';
            }
            if (userSection) {
                userSection.style.display = 'block';
            }
        } else {
            // Usuário não logado
            if (balanceElement) {
                balanceElement.textContent = 'R$ 0,00';
            }
            if (usernameElement) {
                usernameElement.textContent = 'Visitante';
            }
            if (loginSection) {
                loginSection.style.display = 'block';
            }
            if (userSection) {
                userSection.style.display = 'none';
            }
        }
    },
    
    // Mostrar notificação
    showNotification(message, type = 'info') {
        // Remover notificação existente
        const existing = document.querySelector('.auth-notification');
        if (existing) {
            existing.remove();
        }
        
        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Adicionar estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        // Cores por tipo
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },
    
    // Inicializar sistema de autenticação
    init() {
        // Atualizar UI inicial
        this.updateUI();
        
        // Verificar token periodicamente
        setInterval(() => {
            if (this.isLoggedIn()) {
                this.getProfile();
            }
        }, 300000); // 5 minutos
        
        // Adicionar event listeners para formulários
        this.setupEventListeners();
    },
    
    // Configurar event listeners
    setupEventListeners() {
        // Formulário de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                const username = formData.get('username');
                const password = formData.get('password');
                
                if (await this.login(username, password)) {
                    // Fechar modal de login
                    const modal = document.querySelector('.modal.show');
                    if (modal) {
                        modal.style.display = 'none';
                        modal.classList.remove('show');
                    }
                }
            });
        }
        
        // Formulário de registro
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                
                const userData = {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    full_name: formData.get('full_name'),
                    phone: formData.get('phone') || ''
                };
                
                // Verificar se senhas coincidem
                const confirmPassword = formData.get('confirm_password');
                if (userData.password !== confirmPassword) {
                    this.showNotification('Senhas não coincidem', 'error');
                    return;
                }
                
                if (await this.register(userData)) {
                    // Fechar modal de registro
                    const modal = document.querySelector('.modal.show');
                    if (modal) {
                        modal.style.display = 'none';
                        modal.classList.remove('show');
                    }
                }
            });
        }
        
        // Botão de logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.Auth.init();
});

