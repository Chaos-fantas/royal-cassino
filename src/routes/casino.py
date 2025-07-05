from flask import Blueprint, jsonify, request
from src.database import db
from src.models.casino import Transaction, GameSession, GameRound, CasinoSettings
from src.models.anon_session import AnonymousSession
from src.models.payment_methods import SystemPaymentMethod
from src.config import Config
from datetime import datetime
import random
import os

casino_bp = Blueprint('casino', __name__)

@casino_bp.route('/deposit', methods=['POST'])
def deposit():
    """Processar depósito"""
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
        
        payment_method = data.get('payment_method', 'paypal')
        external_transaction_id = data.get('external_transaction_id')
        
        if amount <= 0:
            return jsonify({'error': 'Valor inválido'}), 400
        
        # Obter limites de depósito das configurações
        deposit_limits = Config.get_deposit_limits()
        min_deposit = deposit_limits['min_amount']
        max_deposit = deposit_limits['max_amount']
        
        if amount < min_deposit:
            return jsonify({'error': f'Valor mínimo de depósito é R$ {min_deposit:.2f}'}), 400
        
        if amount > max_deposit:
            return jsonify({'error': f'Valor máximo de depósito é R$ {max_deposit:.2f}'}), 400
        
        # Validar método de pagamento
        payment_method_obj = SystemPaymentMethod.query.filter_by(
            method_name=payment_method,
            is_active=True,
            supports_deposit=True
        ).first()
        
        if not payment_method_obj:
            return jsonify({'error': 'Método de pagamento inválido ou não disponível para depósitos'}), 400
        
        # Verificar limites específicos do método de pagamento
        if payment_method_obj.min_deposit and amount < payment_method_obj.min_deposit:
            return jsonify({'error': f'Valor mínimo para {payment_method_obj.display_name} é R$ {payment_method_obj.min_deposit:.2f}'}), 400
        
        if payment_method_obj.max_deposit and amount > payment_method_obj.max_deposit:
            return jsonify({'error': f'Valor máximo para {payment_method_obj.display_name} é R$ {payment_method_obj.max_deposit:.2f}'}), 400
        
        # Calcular taxa de depósito
        deposit_fee = payment_method_obj.calculate_deposit_fee(amount)
        net_amount = amount - deposit_fee
        
        # Criar transação
        transaction = Transaction(
            anon_id=anon_id,
            transaction_type='deposit',
            amount=amount,
            status='completed',
            payment_method=payment_method,
            external_transaction_id=external_transaction_id,
            description=f'Depósito via {payment_method}',
            extra_data=data.get('paypal_order')
        )
        
        # Atualizar saldo da sessão anônima (valor líquido após taxa)
        anon_session.balance += net_amount
        anon_session.last_activity = datetime.utcnow()
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Depósito realizado com sucesso',
            'amount': amount,
            'fee': deposit_fee,
            'net_amount': net_amount,
            'new_balance': float(anon_session.balance),
            'transaction_id': transaction.id,
            'payment_method': payment_method_obj.display_name
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@casino_bp.route('/withdraw', methods=['POST'])
def withdraw():
    """Processar saque"""
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
        
        payment_method = data.get('payment_method', 'paypal')
        paypal_email = data.get('paypal_email')
        
        if amount <= 0:
            return jsonify({'error': 'Valor inválido'}), 400
        
        # Obter limite mínimo de saque das configurações
        withdraw_limits = Config.get_withdraw_limits()
        min_withdraw = withdraw_limits['min_amount']
        
        if amount < min_withdraw:
            return jsonify({'error': f'Valor mínimo de saque é R$ {min_withdraw:.2f}'}), 400
        
        if amount > anon_session.balance:
            return jsonify({'error': 'Saldo insuficiente'}), 400
        
        if not paypal_email:
            return jsonify({'error': 'Email do PayPal é obrigatório'}), 400
        
        # Validar método de pagamento
        payment_method_obj = SystemPaymentMethod.query.filter_by(
            method_name=payment_method,
            is_active=True,
            supports_withdrawal=True
        ).first()
        
        if not payment_method_obj:
            return jsonify({'error': 'Método de pagamento inválido ou não disponível para saques'}), 400
        
        # Verificar limites específicos do método de pagamento
        if payment_method_obj.min_withdrawal and amount < payment_method_obj.min_withdrawal:
            return jsonify({'error': f'Valor mínimo para saque via {payment_method_obj.display_name} é R$ {payment_method_obj.min_withdrawal:.2f}'}), 400
        
        if payment_method_obj.max_withdrawal and amount > payment_method_obj.max_withdrawal:
            return jsonify({'error': f'Valor máximo para saque via {payment_method_obj.display_name} é R$ {payment_method_obj.max_withdrawal:.2f}'}), 400
        
        # Calcular taxa de saque
        withdrawal_fee = payment_method_obj.calculate_withdrawal_fee(amount)
        net_amount = amount - withdrawal_fee
        
        if net_amount <= 0:
            return jsonify({'error': 'Valor insuficiente após dedução da taxa'}), 400
        
        # Criar transação
        transaction = Transaction(
            anon_id=anon_id,
            transaction_type='withdraw',
            amount=amount,
            status='pending',
            payment_method=payment_method,
            description=f'Saque via {payment_method}',
            extra_data={'paypal_email': paypal_email}
        )
        
        # Atualizar saldo da sessão anônima
        anon_session.balance -= amount
        anon_session.last_activity = datetime.utcnow()
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Saque solicitado com sucesso',
            'amount': amount,
            'new_balance': float(anon_session.balance),
            'transaction_id': transaction.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@casino_bp.route('/bet', methods=['POST'])
def place_bet():
    """Processar aposta"""
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
        
        game_type = data.get('game_type')
        if not game_type:
            return jsonify({'error': 'Tipo de jogo é obrigatório'}), 400
        
        # Validar bet_amount
        try:
            bet_amount = float(data.get('bet_amount', 0))
        except (ValueError, TypeError):
            return jsonify({'error': 'Valor da aposta deve ser um número válido'}), 400
        
        bet_data = data.get('bet_data', {})
        
        if bet_amount <= 0:
            return jsonify({'error': 'Valor de aposta inválido'}), 400
        
        if bet_amount > anon_session.balance:
            return jsonify({'error': 'Saldo insuficiente'}), 400
        
        # Verificar limites mínimos por jogo (configuráveis)
        bet_limits = Config.get_bet_limits()
        min_bet = bet_limits.get(game_type, 1)
        
        if bet_amount < min_bet:
            return jsonify({'error': f'Aposta mínima para {game_type} é R$ {min_bet:.2f}'}), 400
        
        # Criar sessão de jogo se não existir
        game_session = GameSession.query.filter_by(
            anon_id=anon_id,
            game_type=game_type,
            status='active'
        ).first()
        
        if not game_session:
            game_session = GameSession(
                anon_id=anon_id,
                game_type=game_type,
                status='active'
            )
            db.session.add(game_session)
            db.session.flush()
        
        # Processar resultado do jogo
        result = process_game_result(game_type, bet_data, bet_amount)
        
        # Criar round do jogo
        game_round = GameRound(
            game_session_id=game_session.id,
            bet_amount=bet_amount,
            result_data=result,
            payout_amount=result['payout'],
            house_edge=result['house_edge']
        )
        
        # Atualizar saldo da sessão anônima
        anon_session.balance -= bet_amount  # Deduzir aposta
        anon_session.balance += result['payout']  # Adicionar ganhos (se houver)
        anon_session.last_activity = datetime.utcnow()
        
        # Criar transações
        bet_transaction = Transaction(
            anon_id=anon_id,
            transaction_type='bet',
            amount=bet_amount,
            status='completed',
            description=f'Aposta em {game_type}',
            game_session_id=game_session.id
        )
        
        if result['payout'] > 0:
            win_transaction = Transaction(
                anon_id=anon_id,
                transaction_type='win',
                amount=result['payout'],
                status='completed',
                description=f'Ganho em {game_type}',
                game_session_id=game_session.id
            )
            db.session.add(win_transaction)
        
        # Calcular lucro do cassino
        if result["payout"] < bet_amount:
            casino_profit = bet_amount - result["payout"]
            enviar_lucro_para_operador(casino_profit)

        db.session.add(game_round)
        db.session.add(bet_transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Aposta processada com sucesso',
            'result': result,
            'new_balance': float(anon_session.balance),
            'round_id': game_round.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

def process_game_result(game_type, bet_data, bet_amount):
    """Processar resultado do jogo com vantagem da casa"""
    
    # Obter configurações de vantagem da casa
    house_edges = {
        'roulette': 0.027,  # 2.7%
        'blackjack': 0.005,  # 0.5%
        'slots': 0.05,      # 5%
        'dice': 0.014       # 1.4%
    }
    
    house_edge = house_edges.get(game_type, 0.05)
    
    if game_type == 'roulette':
        return process_roulette_result(bet_data, bet_amount, house_edge)
    elif game_type == 'blackjack':
        return process_blackjack_result(bet_data, bet_amount, house_edge)
    elif game_type == 'slots':
        return process_slots_result(bet_data, bet_amount, house_edge)
    elif game_type == 'dice':
        return process_dice_result(bet_data, bet_amount, house_edge)
    else:
        return {'payout': 0, 'house_edge': house_edge, 'result': 'unknown'}

def process_roulette_result(bet_data, bet_amount, house_edge):
    """Processar resultado da roleta"""
    # Gerar número vencedor (0-36)
    winning_number = random.randint(0, 36)
    
    # Definir cor do número
    red_numbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
    winning_color = 'red' if winning_number in red_numbers else 'black' if winning_number != 0 else 'green'
    
    payout = 0
    bet_type = bet_data.get('type')
    bet_value = bet_data.get('value')
    
    # Calcular pagamento baseado no tipo de aposta
    if bet_type == 'number' and bet_value == winning_number:
        payout = bet_amount * 35  # 35:1
    elif bet_type == 'color' and bet_value == winning_color and winning_number != 0:
        payout = bet_amount * 2  # 1:1
    elif bet_type == 'even_odd':
        if bet_value == 'even' and winning_number % 2 == 0 and winning_number != 0:
            payout = bet_amount * 2
        elif bet_value == 'odd' and winning_number % 2 == 1:
            payout = bet_amount * 2
    elif bet_type == 'high_low':
        if bet_value == 'low' and 1 <= winning_number <= 18:
            payout = bet_amount * 2
        elif bet_value == 'high' and 19 <= winning_number <= 36:
            payout = bet_amount * 2
    
    # Aplicar vantagem da casa
    if payout > bet_amount:
        house_cut = (payout - bet_amount) * house_edge
        payout -= house_cut
    
    return {
        'payout': round(payout, 2),
        'house_edge': house_edge,
        'result': {
            'winning_number': winning_number,
            'winning_color': winning_color,
            'bet_type': bet_type,
            'bet_value': bet_value,
            'won': payout > 0
        }
    }

def process_blackjack_result(bet_data, bet_amount, house_edge):
    """Processar resultado do blackjack"""
    # Simular jogo de blackjack
    player_cards = bet_data.get('player_cards', [])
    dealer_cards = bet_data.get('dealer_cards', [])
    
    player_total = sum(card['value'] for card in player_cards)
    dealer_total = sum(card['value'] for card in dealer_cards)
    
    payout = 0
    result_type = 'lose'
    
    if player_total > 21:
        result_type = 'bust'
    elif dealer_total > 21:
        result_type = 'dealer_bust'
        payout = bet_amount * 2
    elif player_total == 21 and len(player_cards) == 2:
        result_type = 'blackjack'
        payout = bet_amount * 2.5
    elif player_total > dealer_total:
        result_type = 'win'
        payout = bet_amount * 2
    elif player_total == dealer_total:
        result_type = 'push'
        payout = bet_amount
    
    # Aplicar vantagem da casa
    if payout > bet_amount:
        house_cut = (payout - bet_amount) * house_edge
        payout -= house_cut
    
    return {
        'payout': round(payout, 2),
        'house_edge': house_edge,
        'result': {
            'player_total': player_total,
            'dealer_total': dealer_total,
            'result_type': result_type,
            'won': payout > bet_amount
        }
    }

def process_slots_result(bet_data, bet_amount, house_edge):
    """Processar resultado do caça-níqueis"""
    symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣']
    
    # Gerar resultado dos 3 rolos
    reels = [random.choice(symbols) for _ in range(3)]
    
    payout = 0
    
    # Verificar combinações vencedoras
    if reels[0] == reels[1] == reels[2]:
        # Três símbolos iguais
        multipliers = {
            '🍒': 5, '🍋': 8, '🍊': 10, '🍇': 15,
            '⭐': 25, '💎': 50, '7️⃣': 100
        }
        payout = bet_amount * multipliers.get(reels[0], 5)
    elif reels[0] == reels[1] or reels[1] == reels[2] or reels[0] == reels[2]:
        # Dois símbolos iguais
        payout = bet_amount * 2
    
    # Aplicar vantagem da casa
    if payout > bet_amount:
        house_cut = (payout - bet_amount) * house_edge
        payout -= house_cut
    
    return {
        'payout': round(payout, 2),
        'house_edge': house_edge,
        'result': {
            'reels': reels,
            'won': payout > 0
        }
    }

def process_dice_result(bet_data, bet_amount, house_edge):
    """Processar resultado dos dados"""
    dice1 = random.randint(1, 6)
    dice2 = random.randint(1, 6)
    total = dice1 + dice2
    
    bet_type = bet_data.get('type')
    bet_value = bet_data.get('value')
    
    payout = 0
    
    if bet_type == 'total' and bet_value == total:
        # Aposta no total exato
        multipliers = {7: 4, 6: 6, 8: 6, 5: 8, 9: 8, 4: 10, 10: 10, 3: 15, 11: 15, 2: 30, 12: 30}
        payout = bet_amount * multipliers.get(total, 1)
    elif bet_type == 'high_low':
        if bet_value == 'low' and total <= 6:
            payout = bet_amount * 2
        elif bet_value == 'high' and total >= 8:
            payout = bet_amount * 2
    elif bet_type == 'even_odd':
        if bet_value == 'even' and total % 2 == 0:
            payout = bet_amount * 2
        elif bet_value == 'odd' and total % 2 == 1:
            payout = bet_amount * 2
    
    # Aplicar vantagem da casa
    if payout > bet_amount:
        house_cut = (payout - bet_amount) * house_edge
        payout -= house_cut
    
    return {
        'payout': round(payout, 2),
        'house_edge': house_edge,
        'result': {
            'dice1': dice1,
            'dice2': dice2,
            'total': total,
            'bet_type': bet_type,
            'bet_value': bet_value,
            'won': payout > 0
        }
    }

@casino_bp.route('/balance', methods=['GET'])
def get_balance():
    """Obter saldo da sessão anônima"""
    try:
        anon_id = request.args.get('anon_id')
        if not anon_id:
            return jsonify({'error': 'ID da sessão anônima é obrigatório'}), 400
        
        # Buscar sessão anônima
        anon_session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        if not anon_session:
            return jsonify({'error': 'Sessão anônima não encontrada'}), 404
        
        # Calcular estatísticas das transações
        transactions = Transaction.query.filter_by(anon_id=anon_id).all()
        total_deposited = sum(t.amount for t in transactions if t.transaction_type == 'deposit')
        total_withdrawn = sum(t.amount for t in transactions if t.transaction_type == 'withdraw')
        total_bet = sum(t.amount for t in transactions if t.transaction_type == 'bet')
        total_won = sum(t.amount for t in transactions if t.transaction_type == 'win')
        
        return jsonify({
            'balance': float(anon_session.balance),
            'total_deposited': float(total_deposited),
            'total_withdrawn': float(total_withdrawn),
            'total_bet': float(total_bet),
            'total_won': float(total_won)
        }), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@casino_bp.route('/transactions', methods=['GET'])
def get_transactions():
    """Obter histórico de transações da sessão anônima"""
    try:
        anon_id = request.args.get('anon_id')
        if not anon_id:
            return jsonify({'error': 'ID da sessão anônima é obrigatório'}), 400
        
        # Buscar sessão anônima
        anon_session = AnonymousSession.query.filter_by(anon_id=anon_id).first()
        if not anon_session:
            return jsonify({'error': 'Sessão anônima não encontrada'}), 404
        
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 20))
        except (ValueError, TypeError):
            page = 1
            per_page = 20
        
        # Limitar per_page para evitar sobrecarga
        per_page = min(per_page, 100)
        
        transactions = Transaction.query.filter_by(anon_id=anon_id)\
            .order_by(Transaction.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'transactions': [t.to_dict() for t in transactions.items],
            'total': transactions.total,
            'pages': transactions.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

