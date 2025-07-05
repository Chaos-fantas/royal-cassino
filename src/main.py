import os
import sys
# DON'T CHANGE: Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
from src.database import db
from src.models.casino import Transaction, GameSession, GameRound, CasinoSettings
from src.models.anon_session import AnonymousSession
from src.models.payment_methods import SystemPaymentMethod
from src.routes.casino import casino_bp
from src.routes.anon import anon_bp
from src.routes.payments import payments_bp
from src.config import Config

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configurações da aplicação usando variáveis de ambiente
app.config['SECRET_KEY'] = os.getenv('APP_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['DEBUG'] = os.getenv('APP_DEBUG', 'false').lower() == 'true'
app.config['ENV'] = os.getenv('APP_ENV', 'production')

# Configurar CORS para permitir requisições do frontend
CORS(app, origins=['*'], supports_credentials=True)

# Registrar blueprints
app.register_blueprint(casino_bp, url_prefix='/api/casino')
app.register_blueprint(anon_bp, url_prefix='/api/anon')
app.register_blueprint(payments_bp, url_prefix='/api/payments')

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DB_DATABASE", "sqlite:///casino.db")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Criar tabelas
with app.app_context():
    db.create_all()
    
    # Inicializar configurações padrão
    Config.initialize_default_settings()
    
    # Inicializar métodos de pagamento padrão
    SystemPaymentMethod.initialize_default_methods()
    
    print("Banco de dados inicializado com configurações padrão")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Servir index.html da raiz do projeto
    if path == "" or path == "index.html":
        root_path = os.path.dirname(os.path.dirname(__file__))  # Volta para a raiz do projeto
        index_path = os.path.join(root_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(root_path, 'index.html')
        else:
            return "index.html not found", 404
    
    # Servir arquivos estáticos com caminho src/static/
    if path.startswith('src/static/'):
        # Remove 'src/static/' do caminho para acessar a pasta static correta
        static_path = path[11:]  # Remove 'src/static/'
        static_folder_path = app.static_folder
        if static_folder_path and os.path.exists(os.path.join(static_folder_path, static_path)):
            return send_from_directory(static_folder_path, static_path)
    
    # Servir arquivos estáticos diretamente da pasta src/static
    static_folder_path = app.static_folder
    if static_folder_path and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    
    # Se não encontrar o arquivo, servir o index.html
    root_path = os.path.dirname(os.path.dirname(__file__))
    index_path = os.path.join(root_path, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(root_path, 'index.html')
    else:
        return "File not found", 404

# Rota para obter configurações públicas do cassino
@app.route('/api/config', methods=['GET'])
def get_public_config():
    """Obter configurações públicas do cassino"""
    
    config = {}
    for setting in public_settings:
        config[setting.setting_key] = setting.get_value()
    
    # Adicionar configurações de ambiente
    config.update({
        'app_name': os.getenv('APP_NAME', 'Triger Bank'),
        'app_url': os.getenv('APP_URL', 'https://seu-dominio.com'),
        'paypal_mode': os.getenv('PAYPAL_MODE', 'live'),
        'environment': os.getenv('APP_ENV', 'production')
    })
    
    return {
        'config': config,
        'version': '2.0.0',
        'environment': os.getenv('APP_ENV', 'production')
    }

# Rota de saúde da aplicação
@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificar saúde da aplicação"""
    try:
        # Testar conexão com banco de dados
        db.session.execute('SELECT 1')
        db_status = 'healthy'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return {
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0',
        'environment': os.getenv('APP_ENV', 'production'),
        'casino_name': os.getenv('APP_NAME', 'Triger Bank')
    }

# Rota para estatísticas do sistema (admin)
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    """Estatísticas do sistema para administradores"""
    try:
        # total_users = CasinoUser.query.count() # Removido, pois não há mais usuários registrados
        total_transactions = Transaction.query.count()
        total_game_sessions = GameSession.query.count()
        
        # Calcular volume total de transações
        total_volume = db.session.query(db.func.sum(Transaction.amount)).scalar() or 0
        
        return {
            'total_users': 0, # Definido como 0, pois não há mais usuários registrados
            'total_transactions': total_transactions,
            'total_game_sessions': total_game_sessions,
            'total_volume': float(total_volume),
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {'error': str(e)}, 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('APP_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)


