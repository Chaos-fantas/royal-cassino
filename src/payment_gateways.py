"""
Módulo de integração com gateways de pagamento
Implementa integração real com Pagar.me para processar pagamentos
"""

import os
import json
import requests
from datetime import datetime
from typing import Dict, Any, Optional
import pagarme

class PaymentGateway:
    """Classe base para gateways de pagamento"""
    
    def __init__(self):
        self.api_key = None
        self.environment = 'sandbox'  # 'sandbox' ou 'live'
        
    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Processar pagamento - deve ser implementado pelas subclasses"""
        raise NotImplementedError
        
    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        """Obter status do pagamento"""
        raise NotImplementedError

class PagarMeGateway(PaymentGateway):
    """Gateway de pagamento Pagar.me"""
    
    def __init__(self):
        super().__init__()
        # Configurações do Pagar.me
        self.api_key = os.getenv('PAGARME_API_KEY', 'ak_test_your_api_key_here')
        self.encryption_key = os.getenv('PAGARME_ENCRYPTION_KEY', 'ek_test_your_encryption_key_here')
        self.recipient_id = os.getenv('PAGARME_RECIPIENT_ID', '07425293129')
        # Configurar cliente Pagar.me
        pagarme.authentication_key(self.api_key)
        
    def process_pix_payment(self, amount: float, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Processar pagamento PIX"""
        try:
            # Converter valor para centavos
            amount_cents = int(amount * 100)
            
            # Dados da transação PIX
            transaction_data = {
                'amount': amount_cents,
                'payment_method': 'pix',
                'customer': {
                    'external_id': customer_data.get('session_id', 'anonymous'),
                    'name': customer_data.get('name', 'Cliente Anônimo'),
                    'type': 'individual',
                    'country': 'br',
                    'email': customer_data.get('email', 'cliente@casino.com'),
                    'documents': [
                        {
                            'type': 'cpf',
                            'number': customer_data.get('cpf', '00000000000')
                        }
                    ]
                },
                'billing': {
                    'name': customer_data.get('name', 'Cliente Anônimo'),
                    'address': {
                        'country': 'br',
                        'state': 'sp',
                        'city': 'São Paulo',
                        'neighborhood': 'Centro',
                        'street': 'Rua do Casino',
                        'street_number': '123',
                        'zipcode': '01000000'
                    }
                },
                'items': [
                    {
                        'id': 'casino_deposit',
                        'title': 'Depósito Casino Online',
                        'unit_price': amount_cents,
                        'quantity': 1,
                        'tangible': False
                    }
                ],
                'metadata': {
                    'casino_session': customer_data.get('session_id'),
                    'deposit_type': 'pix'
                }
            }
            transaction = pagarme.transaction.create(transaction_data)
            
            if transaction.get('status') == 'waiting_payment':
                return {
                    'success': True,
                    'transaction_id': transaction['id'],
                    'status': 'waiting_payment',
                    'pix_qr_code': transaction.get('pix_qr_code'),
                    'pix_expiration_date': transaction.get('pix_expiration_date'),
                    'amount': amount,
                    'message': 'PIX gerado com sucesso. Escaneie o QR Code para pagar.'
                }
            else:
                return {
                    'success': False,
                    'error': 'Erro ao gerar PIX',
                    'details': transaction
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro no processamento PIX: {str(e)}'
            }

    def process_card_payment(self, amount: float, card_data: Dict[str, Any], customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Processar pagamento com cartão de crédito/débito"""
        try:
            # Converter valor para centavos
            amount_cents = int(amount * 100)

            # Dados da transação de cartão
            transaction_data = {
                'amount': amount_cents,
                'payment_method': 'credit_card',
                'card_hash': card_data.get('card_hash'),
                'customer': {
                    'external_id': customer_data.get('session_id', 'anonymous'),
                    'name': customer_data.get('name', 'Cliente Anônimo'),
                    'type': 'individual',
                    'country': 'br',
                    'email': customer_data.get('email', 'cliente@casino.com'),
                    'documents': [
                        {
                            'type': 'cpf',
                            'number': customer_data.get('cpf', '00000000000')
                        }
                    ]
                },
                'billing': {
                    'name': customer_data.get('name', 'Cliente Anônimo'),
                    'address': {
                        'country': 'br',
                        'state': 'sp',
                        'city': 'São Paulo',
                        'neighborhood': 'Centro',
                        'street': 'Rua do Casino',
                        'street_number': '123',
                        'zipcode': '01000000'
                    }
                },
                'items': [
                    {
                        'id': 'casino_deposit',
                        'title': 'Depósito Casino Online',
                        'unit_price': amount_cents,
                        'quantity': 1,
                        'tangible': False
                    }
                ],
                'metadata': {
                    'casino_session': customer_data.get('session_id'),
                    'deposit_type': 'credit_card'
                }
            }

            # Criar transação
            transaction = pagarme.transaction.create(transaction_data)

            if transaction.get('status') in ['paid', 'authorized']:
                return {
                    'success': True,
                    'transaction_id': transaction['id'],
                    'status': transaction['status'],
                    'amount': amount,
                    'message': 'Pagamento processado com sucesso!'
                }
            elif transaction.get('status') == 'refused':
                return {
                    'success': False,
                    'error': 'Pagamento recusado',
                    'details': transaction.get('refuse_reason', 'Motivo não especificado')
                }
            else:
                return {
                    'success': False,
                    'error': 'Status de pagamento inesperado',
                    'details': transaction
                }

        except Exception as e:
            return {
                'success': False,
                'error': f'Erro no processamento do cartão: {str(e)}'
            }

    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        """Obter status do pagamento"""
        try:
            transaction = pagarme.transaction.find_by_id(transaction_id)

            return {
                'success': True,
                'transaction_id': transaction_id,
                'status': transaction.get('status'),
                'amount': transaction.get('amount', 0) / 100,  # Converter de centavos
                'paid_amount': transaction.get('paid_amount', 0) / 100,
                'payment_method': transaction.get('payment_method'),
                'created_at': transaction.get('date_created'),
                'updated_at': transaction.get('date_updated')
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao consultar status: {str(e)}'
            }

    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Processar pagamento baseado no método escolhido"""
        payment_method = payment_data.get('method')
        amount = float(payment_data.get('amount', 0))
        customer_data = payment_data.get('customer', {})

        if payment_method == 'pix':
            return self.process_pix_payment(amount, customer_data)
        elif payment_method in ['credit_card', 'debit_card']:
            card_data = payment_data.get('card', {})
            return self.process_card_payment(amount, card_data, customer_data)
        else:
            return {
                'success': False,
                'error': f'Método de pagamento não suportado: {payment_method}'
            }

class PaymentManager:
    """Gerenciador de pagamentos que coordena diferentes gateways"""

    def __init__(self):
        self.gateways = {
            'pagarme': PagarMeGateway()
        }
        self.default_gateway = 'pagarme'

    def process_payment(self, payment_data: Dict[str, Any], gateway: str = None) -> Dict[str, Any]:
        """Processar pagamento usando o gateway especificado"""
        gateway_name = gateway or self.default_gateway

        if gateway_name not in self.gateways:
            return {
                'success': False,
                'error': f'Gateway não encontrado: {gateway_name}'
            }

        gateway_instance = self.gateways[gateway_name]

        # Adicionar informações do gateway ao resultado
        result = gateway_instance.process_payment(payment_data)
        result['gateway'] = gateway_name
        result['processed_at'] = datetime.utcnow().isoformat()

        return result

    def get_payment_status(self, transaction_id: str, gateway: str = None) -> Dict[str, Any]:
        """Obter status do pagamento"""
        gateway_name = gateway or self.default_gateway

        if gateway_name not in self.gateways:
            return {
                'success': False,
                'error': f'Gateway não encontrado: {gateway_name}'
            }

        gateway_instance = self.gateways[gateway_name]
        return gateway_instance.get_payment_status(transaction_id)

# Instância global do gerenciador de pagamentos
payment_manager = PaymentManager()


