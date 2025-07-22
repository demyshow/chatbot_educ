import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def connect(self):
        try:
            self.connection = psycopg2.connect(
                host="localhost",
                database="chatbot_db",
                user="chatbot_user",
                password="chatbot123"
            )
            self.cursor = self.connection.cursor()
            print("Conexão com PostgreSQL estabelecida com sucesso!")
            return True
        except Exception as e:
            print(f"Erro ao conectar com PostgreSQL: {e}")
            return False
    
    def create_tables(self):
        try:
            # Tabela para armazenar conversas
            create_conversations_table = """
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            # Tabela para armazenar mensagens
            create_messages_table = """
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id),
                message_text TEXT NOT NULL,
                is_user_message BOOLEAN NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            # Tabela para respostas pré-definidas
            create_responses_table = """
            CREATE TABLE IF NOT EXISTS bot_responses (
                id SERIAL PRIMARY KEY,
                keyword VARCHAR(255) NOT NULL,
                response_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            self.cursor.execute(create_conversations_table)
            self.cursor.execute(create_messages_table)
            self.cursor.execute(create_responses_table)
            
            # Inserir algumas respostas padrão
            default_responses = [
                ("olá", "Olá! Bem-vindo ao Atendimento Bot. Como posso ajudá-lo hoje?"),
                ("oi", "Oi! Sou o Atendimento Bot. Em que posso ser útil?"),
                ("ajuda", "Estou aqui para ajudar! Você pode me perguntar sobre nossos serviços, horários de funcionamento, ou qualquer dúvida que tenha."),
                ("horário", "Nosso horário de funcionamento é de segunda a sexta, das 8h às 18h."),
                ("contato", "Você pode entrar em contato conosco pelo telefone (11) 1234-5678 ou pelo email contato@empresa.com"),
                ("tchau", "Obrigado por usar o Atendimento Bot! Tenha um ótimo dia!"),
                ("obrigado", "De nada! Fico feliz em ajudar. Se precisar de mais alguma coisa, estarei aqui!"),
                ("default", "Desculpe, não entendi sua pergunta. Pode reformular ou me perguntar sobre nossos serviços, horários ou contato?")
            ]
            
            for keyword, response in default_responses:
                insert_response = """
                INSERT INTO bot_responses (keyword, response_text) 
                VALUES (%s, %s) 
                ON CONFLICT DO NOTHING;
                """
                self.cursor.execute(insert_response, (keyword, response))
            
            self.connection.commit()
            print("Tabelas criadas com sucesso!")
            return True
            
        except Exception as e:
            print(f"Erro ao criar tabelas: {e}")
            self.connection.rollback()
            return False
    
    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        print("Conexão com PostgreSQL fechada.")
    
    def get_conversation_id(self, session_id):
        try:
            select_query = "SELECT id FROM conversations WHERE session_id = %s;"
            self.cursor.execute(select_query, (session_id,))
            result = self.cursor.fetchone()
            
            if result:
                return result[0]
            else:
                # Criar nova conversa
                insert_query = "INSERT INTO conversations (session_id) VALUES (%s) RETURNING id;"
                self.cursor.execute(insert_query, (session_id,))
                conversation_id = self.cursor.fetchone()[0]
                self.connection.commit()
                return conversation_id
                
        except Exception as e:
            print(f"Erro ao obter conversation_id: {e}")
            return None
    
    def save_message(self, conversation_id, message_text, is_user_message):
        try:
            insert_query = """
            INSERT INTO messages (conversation_id, message_text, is_user_message) 
            VALUES (%s, %s, %s);
            """
            self.cursor.execute(insert_query, (conversation_id, message_text, is_user_message))
            self.connection.commit()
            return True
        except Exception as e:
            print(f"Erro ao salvar mensagem: {e}")
            return False
    
    def get_bot_response(self, user_message):
        try:
            user_message_lower = user_message.lower()
            
            # Buscar resposta baseada em palavras-chave
            select_query = "SELECT response_text FROM bot_responses WHERE %s ILIKE CONCAT('%%', keyword, '%%');"
            self.cursor.execute(select_query, (user_message_lower,))
            result = self.cursor.fetchone()
            
            if result:
                return result[0]
            else:
                # Retornar resposta padrão
                select_default = "SELECT response_text FROM bot_responses WHERE keyword = 'default';"
                self.cursor.execute(select_default)
                default_result = self.cursor.fetchone()
                return default_result[0] if default_result else "Desculpe, não consegui processar sua mensagem."
                
        except Exception as e:
            print(f"Erro ao buscar resposta do bot: {e}")
            return "Desculpe, ocorreu um erro interno. Tente novamente."

