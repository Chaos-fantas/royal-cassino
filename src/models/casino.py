from src.database import db
from datetime import datetime
from sqlalchemy import func
import bcrypt
import jwt
import os

class CasinoUser(db.Model):
    """Modelo para usuários do cassino"""
    __tablename__ = 'casino_users'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), unique=True, nullable=False)  # ID do usuário (pode ser demo)
    
    # Campos de autenticação
    username = db.Column(db.String(50), unique=True, nullable=True)
    email = db.Column(db.String(100), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    full_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    
    balance = db.Column(db.Float, default=0.0, nullable=False)
    total_deposited = db.Column(db.Float, default=0.0, nullable=False)
    total_withdrawn = db.Column(db.Float, default=0.0, nullable=False)
    total_bet = db.Column(db.Float, default=0.0, nullable=False)
    total_won = db.Column(db.Float, default=0.0, nullable=False)
    
    # Configurações do usuário
    preferred_currency = db.Column(db.String(3), default='BRL')
    risk_level = db.Column(db.String(20), default='medium')  # low, medium, high
    
    # Limites de segurança
    daily_deposit_limit = db.Column(db.Float, default=1000.0)
    daily_loss_limit = db.Column(db.Float, default=500.0)
    session_time_limit = db.Column(db.Integer, default=240)  # minutos
    
    # Status da conta
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    verification_level = db.Column(db.String(20), default='basic')  # basic, verified, premium
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relacionamentos
    transactions = db.relationship('Transaction', backref='casino_user', lazy=True, cascade='all, delete-orphan')
    game_sessions = db.relationship('GameSession', backref='casino_user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash e armazenar senha"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Verificar senha"""
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def generate_token(self):
        """Gerar token JWT"""
        payload = {
            'user_id': self.id,
            'username': self.username,
            'exp': datetime.utcnow().timestamp() + 86400  # 24 horas
        }
        return jwt.encode(payload, os.getenv('APP_KEY', 'default-secret'), algorithm='HS256')
    
    @staticmethod
    def verify_token(token):
        """Verificar token JWT"""
        try:
            payload = jwt.decode(token, os.getenv('APP_KEY', 'default-secret'), algorithms=['HS256'])
            return CasinoUser.query.get(payload['user_id'])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def __repr__(self):
        return f'<CasinoUser {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'balance': self.balance,
            'total_deposited': self.total_deposited,
            'total_withdrawn': self.total_withdrawn,
            'total_bet': self.total_bet,
            'total_won': self.total_won,
            'net_result': self.total_won - self.total_bet,
            'preferred_currency': self.preferred_currency,
            'risk_level': self.risk_level,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'verification_level': self.verification_level,
            'daily_loss_limit': self.daily_loss_limit,
            'session_time_limit': self.session_time_limit,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def get_daily_stats(self, date=None):
        """Obter estatísticas do dia"""
        if date is None:
            date = datetime.utcnow().date()
        
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())
        
        daily_transactions = Transaction.query.filter(
            Transaction.user_id == self.user_id,
            Transaction.created_at >= start_of_day,
            Transaction.created_at <= end_of_day
        ).all()
        
        daily_deposits = sum(t.amount for t in daily_transactions if t.transaction_type == 'deposit')
        daily_withdrawals = sum(t.amount for t in daily_transactions if t.transaction_type == 'withdraw')
        daily_bets = sum(t.amount for t in daily_transactions if t.transaction_type == 'bet')
        daily_wins = sum(t.amount for t in daily_transactions if t.transaction_type == 'win')
        
        return {
            'date': date.isoformat(),
            'deposits': daily_deposits,
            'withdrawals': daily_withdrawals,
            'bets': daily_bets,
            'wins': daily_wins,
            'net_result': daily_wins - daily_bets
        }

class Transaction(db.Model):
    """Modelo para transações financeiras"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=True)  # Tornado opcional para sessões anônimas
    anon_id = db.Column(db.String(36), nullable=True)  # ID da sessão anônima
    
    # Tipo de transação
    transaction_type = db.Column(db.String(20), nullable=False)  # deposit, withdraw, bet, win, bonus
    amount = db.Column(db.Float, nullable=False)
    balance_after = db.Column(db.Float, nullable=False)
    
    # Descrição e detalhes
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # game, payment, bonus, adjustment
    
    # Status da transação
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, cancelled
    
    # Referências externas
    external_transaction_id = db.Column(db.String(100))  # ID do PayPal, etc.
    game_session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id'))
    
    # Metadados
    extra_data = db.Column(db.JSON)  # Dados adicionais em JSON
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<Transaction {self.id}: {self.transaction_type} {self.amount}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'anon_id': self.anon_id,
            'transaction_type': self.transaction_type,
            'amount': self.amount,
            'balance_after': self.balance_after,
            'description': self.description,
            'category': self.category,
            'status': self.status,
            'external_transaction_id': self.external_transaction_id,
            'game_session_id': self.game_session_id,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }

class GameSession(db.Model):
    """Modelo para sessões de jogo"""
    __tablename__ = 'game_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=True)  # Tornado opcional para sessões anônimas
    anon_id = db.Column(db.String(36), nullable=True)  # ID da sessão anônima
    
    # Informações do jogo
    game_type = db.Column(db.String(50), nullable=False)  # roulette, blackjack, slots, dice
    game_variant = db.Column(db.String(50))  # european_roulette, classic_blackjack, etc.
    
    # Saldos e apostas
    initial_balance = db.Column(db.Float, nullable=False)
    current_balance = db.Column(db.Float, nullable=False)
    total_bet = db.Column(db.Float, default=0.0)
    total_won = db.Column(db.Float, default=0.0)
    
    # Estatísticas da sessão
    rounds_played = db.Column(db.Integer, default=0)
    rounds_won = db.Column(db.Integer, default=0)
    biggest_win = db.Column(db.Float, default=0.0)
    longest_streak = db.Column(db.Integer, default=0)
    current_streak = db.Column(db.Integer, default=0)
    
    # Tempo de jogo
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Float)
    
    # Status da sessão
    status = db.Column(db.String(20), default='active')  # active, completed, abandoned
    
    # Configurações da sessão
    auto_play = db.Column(db.Boolean, default=False)
    max_loss_limit = db.Column(db.Float)
    max_win_target = db.Column(db.Float)
    
    # Metadados do jogo
    game_data = db.Column(db.JSON)  # Dados específicos do jogo
    
    # Relacionamentos
    transactions = db.relationship('Transaction', backref='game_session', lazy=True)
    
    def __repr__(self):
        return f'<GameSession {self.id}: {self.game_type} by {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'anon_id': self.anon_id,
            'game_type': self.game_type,
            'game_variant': self.game_variant,
            'initial_balance': self.initial_balance,
            'current_balance': self.current_balance,
            'total_bet': self.total_bet,
            'total_won': self.total_won,
            'net_result': self.total_won - self.total_bet,
            'rounds_played': self.rounds_played,
            'rounds_won': self.rounds_won,
            'win_rate': (self.rounds_won / self.rounds_played * 100) if self.rounds_played > 0 else 0,
            'biggest_win': self.biggest_win,
            'longest_streak': self.longest_streak,
            'current_streak': self.current_streak,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'auto_play': self.auto_play,
            'max_loss_limit': self.max_loss_limit,
            'max_win_target': self.max_win_target,
            'game_data': self.game_data
        }
    
    def update_streak(self, won):
        """Atualizar sequência de vitórias/derrotas"""
        if won:
            self.rounds_won += 1
            self.current_streak = max(0, self.current_streak) + 1
            self.longest_streak = max(self.longest_streak, self.current_streak)
        else:
            self.current_streak = min(0, self.current_streak) - 1

class GameRound(db.Model):
    """Modelo para rodadas individuais de jogo"""
    __tablename__ = 'game_rounds'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id'), nullable=False)
    user_id = db.Column(db.String(100), nullable=False)
    
    # Informações da rodada
    round_number = db.Column(db.Integer, nullable=False)
    bet_amount = db.Column(db.Float, nullable=False)
    win_amount = db.Column(db.Float, default=0.0)
    
    # Detalhes do jogo
    bet_type = db.Column(db.String(50))
    game_result = db.Column(db.JSON)  # Resultado específico do jogo
    
    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relacionamento
    session = db.relationship('GameSession', backref='rounds')
    
    def __repr__(self):
        return f'<GameRound {self.id}: Session {self.session_id} Round {self.round_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'round_number': self.round_number,
            'bet_amount': self.bet_amount,
            'win_amount': self.win_amount,
            'net_result': self.win_amount - self.bet_amount,
            'bet_type': self.bet_type,
            'game_result': self.game_result,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class PaymentMethod(db.Model):
    """Modelo para métodos de pagamento do usuário"""
    __tablename__ = 'payment_methods'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('casino_users.user_id'), nullable=False)
    
    # Tipo e detalhes do método
    method_type = db.Column(db.String(20), nullable=False)  # paypal, credit_card, bank_transfer
    provider = db.Column(db.String(50))  # PayPal, Visa, Mastercard, etc.
    
    # Informações mascaradas (sem dados sensíveis)
    masked_identifier = db.Column(db.String(100))  # email mascarado, últimos 4 dígitos do cartão
    display_name = db.Column(db.String(100))
    
    # Status e configurações
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_default = db.Column(db.Boolean, default=False)
    
    # Limites
    daily_limit = db.Column(db.Float)
    monthly_limit = db.Column(db.Float)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime)
    last_used = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<PaymentMethod {self.id}: {self.method_type} for {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'method_type': self.method_type,
            'provider': self.provider,
            'masked_identifier': self.masked_identifier,
            'display_name': self.display_name,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'is_default': self.is_default,
            'daily_limit': self.daily_limit,
            'monthly_limit': self.monthly_limit,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'last_used': self.last_used.isoformat() if self.last_used else None
        }

class CasinoSettings(db.Model):
    """Modelo para configurações globais do cassino"""
    __tablename__ = 'casino_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False)
    setting_value = db.Column(db.Text)
    setting_type = db.Column(db.String(20), default='string')  # string, number, boolean, json
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # game, payment, security, etc.
    
    # Controle de acesso
    is_public = db.Column(db.Boolean, default=False)
    requires_admin = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<CasinoSettings {self.setting_key}: {self.setting_value}>'
    
    def get_value(self):
        """Obter valor tipado da configuração"""
        if self.setting_type == 'boolean':
            return self.setting_value.lower() in ('true', '1', 'yes')
        elif self.setting_type == 'number':
            try:
                return float(self.setting_value)
            except (ValueError, TypeError):
                return 0
        elif self.setting_type == 'json':
            try:
                import json
                return json.loads(self.setting_value)
            except (ValueError, TypeError):
                return {}
        else:
            return self.setting_value
    
    def to_dict(self):
        return {
            'id': self.id,
            'setting_key': self.setting_key,
            'setting_value': self.get_value(),
            'setting_type': self.setting_type,
            'description': self.description,
            'category': self.category,
            'is_public': self.is_public,
            'requires_admin': self.requires_admin,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

