from src.database import db
from datetime import datetime
import uuid

class AnonymousSession(db.Model):
    __tablename__ = 'anonymous_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    anon_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def __init__(self, **kwargs):
        super(AnonymousSession, self).__init__(**kwargs)
        if not self.anon_id:
            self.anon_id = str(uuid.uuid4())
    
    def to_dict(self):
        return {
            'id': self.id,
            'anon_id': self.anon_id,
            'balance': self.balance,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'is_active': self.is_active
        }
    
    def update_activity(self):
        """Atualizar última atividade"""
        self.last_activity = datetime.utcnow()
        db.session.commit()
    
    def add_balance(self, amount):
        """Adicionar saldo"""
        self.balance += amount
        self.update_activity()
        db.session.commit()
    
    def subtract_balance(self, amount):
        """Subtrair saldo"""
        if self.balance >= amount:
            self.balance -= amount
            self.update_activity()
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def get_or_create(anon_id):
        """Obter ou criar sessão anônima"""
        session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        if not session:
            session = AnonymousSession(anon_id=anon_id)
            db.session.add(session)
            db.session.commit()
        return session

