import os
from src.database import db
from src.models.casino import CasinoSettings

class Config:
    """Classe para gerenciar configurações do cassino"""
    
    @staticmethod
    def get_setting(key, default=None, setting_type='string'):
        """
        Obter configuração do banco de dados ou variável de ambiente
        Prioridade: Banco de dados > Variável de ambiente > Valor padrão
        """
        try:
            # Tentar obter do banco de dados primeiro
            setting = CasinoSettings.query.filter_by(setting_key=key).first()
            if setting:
                return setting.get_value()
        except:
            # Se houver erro no banco, continuar para variáveis de ambiente
            pass
        
        # Tentar obter da variável de ambiente
        env_value = os.getenv(key.upper())
        if env_value is not None:
            if setting_type == 'boolean':
                return env_value.lower() in ('true', '1', 'yes')
            elif setting_type == 'number':
                try:
                    return float(env_value)
                except (ValueError, TypeError):
                    return default
            else:
                return env_value
        
        # Retornar valor padrão
        return default
    
    @staticmethod
    def get_deposit_limits():
        """Obter limites de depósito"""
        return {
            'min_amount': Config.get_setting('min_deposit_amount', 10, 'number'),
            'max_amount': Config.get_setting('max_deposit_amount', 5000, 'number')
        }
    
    @staticmethod
    def get_withdraw_limits():
        """Obter limites de saque"""
        return {
            'min_amount': Config.get_setting('min_withdraw_amount', 20, 'number')
        }
    
    @staticmethod
    def get_bet_limits():
        """Obter limites de apostas por jogo"""
        return {
            'roulette': Config.get_setting('min_bet_roulette', 5, 'number'),
            'blackjack': Config.get_setting('min_bet_blackjack', 10, 'number'),
            'slots': Config.get_setting('min_bet_slots', 1, 'number'),
            'dice': Config.get_setting('min_bet_dice', 5, 'number')
        }
    
    @staticmethod
    def get_rate_limit_config():
        """Obter configurações de rate limiting"""
        return {
            'enabled': Config.get_setting('rate_limit_enabled', True, 'boolean'),
            'requests_per_minute': Config.get_setting('rate_limit_requests_per_minute', 60, 'number'),
            'requests_per_hour': Config.get_setting('rate_limit_requests_per_hour', 1000, 'number')
        }
    
    @staticmethod
    def set_setting(key, value, setting_type='string', description=None, category=None):
        """Definir configuração no banco de dados"""
        try:
            setting = CasinoSettings.query.filter_by(setting_key=key).first()
            if setting:
                setting.setting_value = str(value)
                setting.setting_type = setting_type
                if description:
                    setting.description = description
                if category:
                    setting.category = category
            else:
                setting = CasinoSettings(
                    setting_key=key,
                    setting_value=str(value),
                    setting_type=setting_type,
                    description=description,
                    category=category
                )
                db.session.add(setting)
            
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            return False
    
    @staticmethod
    def initialize_default_settings():
        """Inicializar configurações padrão no banco de dados"""
        default_settings = [
            # Limites de depósito e saque
            ('min_deposit_amount', '10', 'number', 'Valor mínimo de depósito em BRL', 'payment'),
            ('max_deposit_amount', '5000', 'number', 'Valor máximo de depósito em BRL', 'payment'),
            ('min_withdraw_amount', '20', 'number', 'Valor mínimo de saque em BRL', 'payment'),
            
            # Limites de apostas por jogo
            ('min_bet_roulette', '5', 'number', 'Aposta mínima na roleta em BRL', 'game'),
            ('min_bet_blackjack', '10', 'number', 'Aposta mínima no blackjack em BRL', 'game'),
            ('min_bet_slots', '1', 'number', 'Aposta mínima nos slots em BRL', 'game'),
            ('min_bet_dice', '5', 'number', 'Aposta mínima nos dados em BRL', 'game'),
            
            # Configurações de rate limiting
            ('rate_limit_enabled', 'true', 'boolean', 'Rate limiting habilitado', 'security'),
            ('rate_limit_requests_per_minute', '60', 'number', 'Requisições por minuto', 'security'),
            ('rate_limit_requests_per_hour', '1000', 'number', 'Requisições por hora', 'security'),
        ]
        
        try:
            for key, value, type_, desc, cat in default_settings:
                existing = CasinoSettings.query.filter_by(setting_key=key).first()
                if not existing:
                    setting = CasinoSettings(
                        setting_key=key,
                        setting_value=value,
                        setting_type=type_,
                        description=desc,
                        category=cat
                    )
                    db.session.add(setting)
            
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            return False

