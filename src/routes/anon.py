from flask import Blueprint, jsonify, request
from src.database import db
from src.models.anon_session import AnonymousSession
from src.models.casino import Transaction, GameSession
import uuid
from datetime import datetime, timedelta
import re

anon_bp = Blueprint('anon', __name__)

# Cache simples para rate limiting (em produção, usar Redis)
_rate_limit_cache = {}

def check_rate_limit(ip_address, endpoint, limit=10, window=60):
    """Verificar rate limiting simples"""
    now = datetime.utcnow()
    key = f"{ip_address}:{endpoint}"
    
    # Limpar entradas antigas
    if key in _rate_limit_cache:
        _rate_limit_cache[key] = [
            timestamp for timestamp in _rate_limit_cache[key]
            if now - timestamp < timedelta(seconds=window)
        ]
    else:
        _rate_limit_cache[key] = []
    
    # Verificar limite
    if len(_rate_limit_cache[key]) >= limit:
        return False
    
    # Adicionar nova requisição
    _rate_limit_cache[key].append(now)
    return True

def validate_anon_id(anon_id):
    """Validar formato do ID anônimo"""
    if not anon_id:
        return False
    
    # Verificar se é um UUID válido
    try:
        uuid.UUID(anon_id)
        return True
    except ValueError:
        return False

@anon_bp.route('/generate-id', methods=['POST'])
def generate_anonymous_id():
    """Gerar um novo ID anônimo"""
    try:
        # Rate limiting para geração de IDs
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        if not check_rate_limit(client_ip, 'generate-id', limit=5, window=300):  # 5 por 5 minutos
            return jsonify({'error': 'Muitas tentativas. Tente novamente em alguns minutos.'}), 429
        
        # Gerar novo UUID
        anon_id = str(uuid.uuid4())
        
        # Verificar se já existe (muito improvável, mas por segurança)
        existing = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        if existing:
            # Gerar novo ID se houver colisão
            anon_id = str(uuid.uuid4())
        
        # Criar nova sessão anônima
        session = AnonymousSession(anon_id=anon_id, balance=0.0)
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'anon_id': anon_id,
            'balance': 0.0,
            'message': 'ID anônimo gerado com sucesso'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@anon_bp.route('/session/<anon_id>', methods=['GET'])
def get_session_info(anon_id):
    """Obter informações da sessão anônima"""
    try:
        # Validar formato do ID
        if not validate_anon_id(anon_id):
            return jsonify({'error': 'ID da sessão inválido'}), 400
        
        session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        
        if not session:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        # Atualizar última atividade
        session.last_activity = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'session': session.to_dict(),
            'message': 'Sessão encontrada'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@anon_bp.route('/session/<anon_id>/balance', methods=['GET'])
def get_balance(anon_id):
    """Obter saldo da sessão anônima"""
    try:
        # Validar formato do ID
        if not validate_anon_id(anon_id):
            return jsonify({'error': 'ID da sessão inválido'}), 400
        
        session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        
        if not session:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        # Atualizar última atividade
        session.last_activity = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'anon_id': anon_id,
            'balance': float(session.balance)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@anon_bp.route('/session/<anon_id>/transactions', methods=['GET'])
def get_transactions(anon_id):
    """Obter histórico de transações da sessão anônima"""
    try:
        # Validar formato do ID
        if not validate_anon_id(anon_id):
            return jsonify({'error': 'ID da sessão inválido'}), 400
        
        session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        
        if not session:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        # Validar parâmetros de paginação
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 20))
        except (ValueError, TypeError):
            page = 1
            per_page = 20
        
        # Limitar per_page para evitar sobrecarga
        per_page = min(max(per_page, 1), 100)
        page = max(page, 1)
        
        # Buscar transações com paginação
        transactions_query = Transaction.query.filter_by(anon_id=anon_id)\
            .order_by(Transaction.created_at.desc())
        
        transactions = transactions_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Atualizar última atividade
        session.last_activity = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'anon_id': anon_id,
            'transactions': [t.to_dict() for t in transactions.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': transactions.total,
                'pages': transactions.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@anon_bp.route('/session/<anon_id>/games', methods=['GET'])
def get_game_sessions(anon_id):
    """Obter histórico de jogos da sessão anônima"""
    try:
        # Validar formato do ID
        if not validate_anon_id(anon_id):
            return jsonify({'error': 'ID da sessão inválido'}), 400
        
        session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        
        if not session:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        # Validar parâmetros de paginação
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 20))
        except (ValueError, TypeError):
            page = 1
            per_page = 20
        
        # Limitar per_page para evitar sobrecarga
        per_page = min(max(per_page, 1), 50)
        page = max(page, 1)
        
        # Buscar sessões de jogo com paginação
        game_sessions_query = GameSession.query.filter_by(anon_id=anon_id)\
            .order_by(GameSession.created_at.desc())
        
        game_sessions = game_sessions_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Atualizar última atividade
        session.last_activity = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'anon_id': anon_id,
            'game_sessions': [gs.to_dict() for gs in game_sessions.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': game_sessions.total,
                'pages': game_sessions.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@anon_bp.route('/validate/<anon_id>', methods=['GET'])
def validate_session(anon_id):
    """Validar se uma sessão anônima existe"""
    try:
        # Validar formato do ID
        if not validate_anon_id(anon_id):
            return jsonify({
                'valid': False,
                'message': 'ID da sessão inválido'
            }), 400
        
        session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        
        if not session:
            return jsonify({
                'valid': False,
                'message': 'Sessão não encontrada'
            }), 404
        
        # Atualizar última atividade
        session.last_activity = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'valid': True,
            'anon_id': anon_id,
            'balance': float(session.balance),
            'last_activity': session.last_activity.isoformat(),
            'message': 'Sessão válida'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@anon_bp.route('/cleanup-old-sessions', methods=['POST'])
def cleanup_old_sessions():
    """Limpar sessões antigas (endpoint administrativo)"""
    try:
        # Verificar se é uma requisição administrativa (em produção, usar autenticação adequada)
        admin_key = request.headers.get('X-Admin-Key')
        if admin_key != 'admin-cleanup-key-2024':  # Em produção, usar chave segura
            return jsonify({'error': 'Não autorizado'}), 401
        
        # Definir limite de tempo (sessões inativas por mais de 30 dias)
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        # Buscar sessões antigas
        old_sessions = AnonymousSession.query.filter(
            AnonymousSession.last_activity < cutoff_date
        ).all()
        
        count = len(old_sessions)
        
        # Remover sessões antigas
        for session in old_sessions:
            db.session.delete(session)
        
        db.session.commit()
        
        return jsonify({
            'message': f'{count} sessões antigas removidas com sucesso',
            'removed_count': count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

