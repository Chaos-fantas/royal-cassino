from src.database import db
from datetime import datetime

class SystemPaymentMethod(db.Model):
    """Modelo para métodos de pagamento disponíveis no sistema"""
    __tablename__ = 'system_payment_methods'
    
    id = db.Column(db.Integer, primary_key=True)
    method_name = db.Column(db.String(50), unique=True, nullable=False)  # paypal, pix, credit_card
    display_name = db.Column(db.String(100), nullable=False)  # "PayPal", "PIX", "Cartão de Crédito"
    description = db.Column(db.Text)
    
    # Configurações do método
    is_active = db.Column(db.Boolean, default=True)
    supports_deposit = db.Column(db.Boolean, default=True)
    supports_withdrawal = db.Column(db.Boolean, default=True)
    
    # Limites específicos do método
    min_deposit = db.Column(db.Float)
    max_deposit = db.Column(db.Float)
    min_withdrawal = db.Column(db.Float)
    max_withdrawal = db.Column(db.Float)
    
    # Taxas
    deposit_fee_percentage = db.Column(db.Float, default=0.0)
    deposit_fee_fixed = db.Column(db.Float, default=0.0)
    withdrawal_fee_percentage = db.Column(db.Float, default=0.0)
    withdrawal_fee_fixed = db.Column(db.Float, default=0.0)
    
    # Tempo de processamento (em minutos)
    deposit_processing_time = db.Column(db.Integer, default=0)  # 0 = instantâneo
    withdrawal_processing_time = db.Column(db.Integer, default=1440)  # 24 horas
    
    # Configurações adicionais (JSON)
    config_data = db.Column(db.Text)  # JSON com configurações específicas
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<SystemPaymentMethod {self.method_name}: {self.display_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'method_name': self.method_name,
            'display_name': self.display_name,
            'description': self.description,
            'is_active': self.is_active,
            'supports_deposit': self.supports_deposit,
            'supports_withdrawal': self.supports_withdrawal,
            'min_deposit': self.min_deposit,
            'max_deposit': self.max_deposit,
            'min_withdrawal': self.min_withdrawal,
            'max_withdrawal': self.max_withdrawal,
            'deposit_fee_percentage': self.deposit_fee_percentage,
            'deposit_fee_fixed': self.deposit_fee_fixed,
            'withdrawal_fee_percentage': self.withdrawal_fee_percentage,
            'withdrawal_fee_fixed': self.withdrawal_fee_fixed,
            'deposit_processing_time': self.deposit_processing_time,
            'withdrawal_processing_time': self.withdrawal_processing_time
        }
    
    def calculate_deposit_fee(self, amount):
        """Calcular taxa de depósito"""
        percentage_fee = amount * (self.deposit_fee_percentage / 100)
        total_fee = percentage_fee + self.deposit_fee_fixed
        return round(total_fee, 2)
    
    def calculate_withdrawal_fee(self, amount):
        """Calcular taxa de saque"""
        percentage_fee = amount * (self.withdrawal_fee_percentage / 100)
        total_fee = percentage_fee + self.withdrawal_fee_fixed
        return round(total_fee, 2)
    
    @staticmethod
    def get_active_methods(operation_type=None):
        """Obter métodos de pagamento ativos"""
        query = SystemPaymentMethod.query.filter_by(is_active=True)
        
        if operation_type == 'deposit':
            query = query.filter_by(supports_deposit=True)
        elif operation_type == 'withdrawal':
            query = query.filter_by(supports_withdrawal=True)
        
        return query.all()
    
    @staticmethod
    def initialize_default_methods():
        """Inicializar métodos de pagamento padrão"""
        default_methods = [
            {
                'method_name': 'paypal',
                'display_name': 'PayPal',
                'description': 'Pagamento via PayPal',
                'is_active': True,
                'supports_deposit': True,
                'supports_withdrawal': True,
                'min_deposit': 10.0,
                'max_deposit': 5000.0,
                'min_withdrawal': 20.0,
                'max_withdrawal': 2000.0,
                'deposit_fee_percentage': 3.5,
                'withdrawal_fee_percentage': 2.0,
                'deposit_processing_time': 0,
                'withdrawal_processing_time': 1440
            },
            {
                'method_name': 'pix',
                'display_name': 'PIX',
                'description': 'Pagamento instantâneo via PIX',
                'is_active': True,
                'supports_deposit': True,
                'supports_withdrawal': True,
                'min_deposit': 5.0,
                'max_deposit': 10000.0,
                'min_withdrawal': 10.0,
                'max_withdrawal': 5000.0,
                'deposit_fee_percentage': 0.0,
                'withdrawal_fee_percentage': 0.0,
                'deposit_processing_time': 0,
                'withdrawal_processing_time': 30
            },
            {
                'method_name': 'credit_card',
                'display_name': 'Cartão de Crédito',
                'description': 'Pagamento via cartão de crédito',
                'is_active': True,
                'supports_deposit': True,
                'supports_withdrawal': False,
                'min_deposit': 20.0,
                'max_deposit': 3000.0,
                'deposit_fee_percentage': 4.0,
                'deposit_processing_time': 0
            }
        ]
        
        try:
            for method_data in default_methods:
                existing = SystemPaymentMethod.query.filter_by(
                    method_name=method_data['method_name']
                ).first()
                
                if not existing:
                    method = SystemPaymentMethod(**method_data)
                    db.session.add(method)
            
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            return False

