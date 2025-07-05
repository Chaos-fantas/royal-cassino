"""
Rotas para processamento de pagamentos reais
Integração com gateways de pagamento
"""

from flask import Blueprint, jsonify, request
from src.database import db
from src.models.casino import Transaction
from src.models.anon_session import AnonymousSession
from src.payment_gateways import payment_manager
from datetime import datetime
import uuid

payments_bp = Blueprint('payments', __name__)

@payments_bp.route('/process', methods=['POST'])
def process_payment():
    """Processar pagamento real através do gateway"""
    try:
        data = request.get_json()
        
        # Validar dados de entrada
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        anon_id = data.get('anon_id')
        if not anon_id:
            return jsonify({'error': 'ID da sessão anônima é obrigatório'}), 400
        
        # Buscar sessão anônima
        anon_session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        if not anon_session:
            return jsonify({'error': 'Sessão anônima não encontrada'}), 404
        
        # Validar amount
        try:
            amount = float(data.get('amount', 0))
        except (ValueError, TypeError):
            return jsonify({'error': 'Valor deve ser um número válido'}), 400
        
        if amount <= 0:
            return jsonify({'error': 'Valor inválido'}), 400
        
        payment_method = data.get('payment_method', 'pix')
        
        # Preparar dados para o gateway
        payment_data = {
            'method': payment_method,
            'amount': amount,
            'customer': {
                'session_id': anon_id,
                'name': data.get('customer_name', 'Cliente Anônimo'),
                'email': data.get('customer_email', 'cliente@casino.com'),
                'cpf': data.get('customer_cpf', '00000000000')
            }
        }
        
        # Adicionar dados do cartão se necessário
        if payment_method in ['credit_card', 'debit_card']:
            card_data = data.get('card', {})
            if not all(key in card_data for key in ['number', 'holder_name', 'expiration_date', 'cvv']):
                return jsonify({'error': 'Dados do cartão incompletos'}), 400
            payment_data['card'] = card_data
        
        # Criar transação pendente no banco
        transaction = Transaction(
            anon_id=anon_id,
            transaction_type='deposit',
            amount=amount,
            status='pending',
            payment_method=payment_method,
            description=f'Depósito via {payment_method}',
            extra_data={'gateway_request': payment_data}
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        # Processar pagamento através do gateway
        result = payment_manager.process_payment(payment_data)
        
        # Atualizar transação com resultado do gateway
        if result.get('success'):
            transaction.status = 'processing'
            transaction.external_transaction_id = result.get('transaction_id')
            transaction.extra_data.update({
                'gateway_response': result,
                'processed_at': datetime.utcnow().isoformat()
            })
            
            # Se o pagamento foi aprovado imediatamente (cartão), atualizar saldo
            if result.get('status') == 'paid':
                transaction.status = 'completed'
                anon_session.balance += amount
                anon_session.last_activity = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'transaction_id': transaction.id,
                'gateway_transaction_id': result.get('transaction_id'),
                'status': result.get('status'),
                'amount': amount,
                'payment_method': payment_method,
                'pix_qr_code': result.get('pix_qr_code'),
                'pix_expiration_date': result.get('pix_expiration_date'),
                'message': result.get('message', 'Pagamento processado com sucesso'),
                'new_balance': float(anon_session.balance)
            })
        else:
            # Erro no processamento
            transaction.status = 'failed'
            transaction.extra_data.update({
                'gateway_error': result,
                'failed_at': datetime.utcnow().isoformat()
            })
            db.session.commit()
            
            return jsonify({
                'success': False,
                'error': result.get('error', 'Erro no processamento do pagamento'),
                'details': result.get('details')
            }), 400
            
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@payments_bp.route('/status/<int:transaction_id>', methods=['GET'])
def get_payment_status(transaction_id):
    """Obter status de um pagamento"""
    try:
        # Buscar transação no banco
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return jsonify({'error': 'Transação não encontrada'}), 404
        
        # Se a transação já está completa, retornar status local
        if transaction.status in ['completed', 'failed', 'cancelled']:
            return jsonify({
                'success': True,
                'transaction_id': transaction.id,
                'status': transaction.status,
                'amount': float(transaction.amount),
                'payment_method': transaction.payment_method,
                'created_at': transaction.created_at.isoformat(),
                'updated_at': transaction.updated_at.isoformat()
            })
        
        # Se está pendente ou processando, consultar gateway
        if transaction.external_transaction_id:
            gateway_result = payment_manager.get_payment_status(
                transaction.external_transaction_id
            )
            
            if gateway_result.get('success'):
                gateway_status = gateway_result.get('status')
                
                # Atualizar status local baseado no gateway
                if gateway_status == 'paid':
                    transaction.status = 'completed'
                    # Atualizar saldo se ainda não foi atualizado
                    anon_session = AnonymousSession.query.filter_by(
                        anon_id=transaction.anon_id
                    ).first()
                    if anon_session and transaction.status != 'completed':
                        anon_session.balance += transaction.amount
                        anon_session.last_activity = datetime.utcnow()
                elif gateway_status in ['refused', 'failed']:
                    transaction.status = 'failed'
                
                transaction.extra_data.update({
                    'gateway_status_check': gateway_result,
                    'status_checked_at': datetime.utcnow().isoformat()
                })
                
                db.session.commit()
        
        return jsonify({
            'success': True,
            'transaction_id': transaction.id,
            'gateway_transaction_id': transaction.external_transaction_id,
            'status': transaction.status,
            'amount': float(transaction.amount),
            'payment_method': transaction.payment_method,
            'created_at': transaction.created_at.isoformat(),
            'updated_at': transaction.updated_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@payments_bp.route('/webhook/pagarme', methods=['POST'])
def pagarme_webhook():
    """Webhook para receber notificações do Pagar.me"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Extrair informações do webhook
        event_type = data.get('event')
        transaction_data = data.get('transaction', {})
        transaction_id = transaction_data.get('id')
        status = transaction_data.get('status')
        
        if not transaction_id:
            return jsonify({'error': 'ID da transação não fornecido'}), 400
        
        # Buscar transação no banco pelo external_transaction_id
        transaction = Transaction.query.filter_by(
            external_transaction_id=str(transaction_id)
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transação não encontrada'}), 404
        
        # Atualizar status baseado no webhook
        if status == 'paid':
            transaction.status = 'completed'
            # Atualizar saldo da sessão anônima
            anon_session = AnonymousSession.query.filter_by(
                anon_id=transaction.anon_id
            ).first()
            if anon_session:
                anon_session.balance += transaction.amount
                anon_session.last_activity = datetime.utcnow()
        elif status in ['refused', 'failed']:
            transaction.status = 'failed'
        elif status == 'waiting_payment':
            transaction.status = 'processing'
        
        # Salvar dados do webhook
        transaction.extra_data.update({
            'webhook_data': data,
            'webhook_received_at': datetime.utcnow().isoformat()
        })
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Webhook processado com sucesso'})
        
    except Exception as e:
        return jsonify({'error': f'Erro no webhook: {str(e)}'}), 500

@payments_bp.route('/methods', methods=['GET'])
def get_payment_methods():
    """Obter métodos de pagamento disponíveis"""
    try:
        methods = [
            {
                'id': 'pix',
                'name': 'PIX',
                'description': 'Pagamento instantâneo via PIX',
                'min_amount': 10.0,
                'max_amount': 10000.0,
                'processing_time': 'Instantâneo',
                'fee': 0.0
            },
            {
                'id': 'credit_card',
                'name': 'Cartão de Crédito',
                'description': 'Pagamento com cartão de crédito',
                'min_amount': 10.0,
                'max_amount': 5000.0,
                'processing_time': 'Instantâneo',
                'fee': 3.99
            },
            {
                'id': 'debit_card',
                'name': 'Cartão de Débito',
                'description': 'Pagamento com cartão de débito',
                'min_amount': 10.0,
                'max_amount': 5000.0,
                'processing_time': 'Instantâneo',
                'fee': 2.99
            }
        ]
        
        return jsonify({
            'success': True,
            'methods': methods
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

