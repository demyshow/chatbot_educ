from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import os
from dotenv import load_dotenv
from database import Database

load_dotenv()

app = Flask(__name__)
CORS(app)  # Permitir requisições de qualquer origem

# Configurações
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'sua_chave_secreta_aqui')

# Instância do banco de dados
db = Database()

def initialize_database():
    """Inicializar banco de dados"""
    if db.connect():
        db.create_tables()

# Inicializar na primeira execução
with app.app_context():
    initialize_database()

@app.route('/')
def home():
    """Rota principal para verificar se a API está funcionando"""
    return jsonify({
        'message': 'Atendimento Bot API está funcionando!',
        'version': '1.0.0',
        'status': 'online'
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint principal para processar mensagens do chat"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Mensagem é obrigatória'}), 400
        
        user_message = data['message']
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Conectar ao banco se não estiver conectado
        if not db.connection:
            if not db.connect():
                return jsonify({'error': 'Erro de conexão com banco de dados'}), 500
        
        # Obter ID da conversa
        conversation_id = db.get_conversation_id(session_id)
        if not conversation_id:
            return jsonify({'error': 'Erro ao criar conversa'}), 500
        
        # Salvar mensagem do usuário
        db.save_message(conversation_id, user_message, True)
        
        # Obter resposta do bot
        bot_response = db.get_bot_response(user_message)
        
        # Salvar resposta do bot
        db.save_message(conversation_id, bot_response, False)
        
        return jsonify({
            'response': bot_response,
            'session_id': session_id,
            'timestamp': None  # Pode adicionar timestamp se necessário
        })
        
    except Exception as e:
        print(f"Erro no endpoint /api/chat: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/history/<session_id>', methods=['GET'])
def get_chat_history(session_id):
    """Obter histórico de conversa por session_id"""
    try:
        if not db.connection:
            if not db.connect():
                return jsonify({'error': 'Erro de conexão com banco de dados'}), 500
        
        conversation_id = db.get_conversation_id(session_id)
        if not conversation_id:
            return jsonify({'messages': []})
        
        # Buscar mensagens da conversa
        query = """
        SELECT message_text, is_user_message, created_at 
        FROM messages 
        WHERE conversation_id = %s 
        ORDER BY created_at ASC;
        """
        db.cursor.execute(query, (conversation_id,))
        results = db.cursor.fetchall()
        
        messages = []
        for message_text, is_user_message, created_at in results:
            messages.append({
                'message': message_text,
                'is_user': is_user_message,
                'timestamp': created_at.isoformat() if created_at else None
            })
        
        return jsonify({'messages': messages})
        
    except Exception as e:
        print(f"Erro no endpoint /api/history: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/responses', methods=['GET'])
def get_responses():
    """Obter todas as respostas disponíveis do bot (para administração)"""
    try:
        if not db.connection:
            if not db.connect():
                return jsonify({'error': 'Erro de conexão com banco de dados'}), 500
        
        query = "SELECT keyword, response_text FROM bot_responses ORDER BY keyword;"
        db.cursor.execute(query)
        results = db.cursor.fetchall()
        
        responses = []
        for keyword, response_text in results:
            responses.append({
                'keyword': keyword,
                'response': response_text
            })
        
        return jsonify({'responses': responses})
        
    except Exception as e:
        print(f"Erro no endpoint /api/responses: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/responses', methods=['POST'])
def add_response():
    """Adicionar nova resposta ao bot (para administração)"""
    try:
        data = request.get_json()
        
        if not data or 'keyword' not in data or 'response' not in data:
            return jsonify({'error': 'Keyword e response são obrigatórios'}), 400
        
        keyword = data['keyword']
        response_text = data['response']
        
        if not db.connection:
            if not db.connect():
                return jsonify({'error': 'Erro de conexão com banco de dados'}), 500
        
        # Inserir nova resposta
        insert_query = """
        INSERT INTO bot_responses (keyword, response_text) 
        VALUES (%s, %s);
        """
        db.cursor.execute(insert_query, (keyword, response_text))
        db.connection.commit()
        
        return jsonify({'message': 'Resposta adicionada com sucesso!'})
        
    except Exception as e:
        print(f"Erro no endpoint POST /api/responses: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    # Conectar ao banco de dados na inicialização
    if db.connect():
        db.create_tables()
    
    # Executar aplicação
    app.run(host='0.0.0.0', port=5000, debug=True)

