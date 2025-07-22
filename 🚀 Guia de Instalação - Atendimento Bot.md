# 🚀 Guia de Instalação - Atendimento Bot

## 📋 Pré-requisitos

Antes de instalar o Atendimento Bot, certifique-se de ter os seguintes componentes instalados em seu sistema:

### Sistema Operacional
- **Linux** (Ubuntu 20.04+ recomendado)
- **macOS** (10.15+)
- **Windows** (10+ com WSL2)

### Software Necessário
- **Python 3.8+** ([Download](https://python.org/downloads/))
- **PostgreSQL 12+** ([Download](https://postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Node.js 16+** (opcional, para desenvolvimento) ([Download](https://nodejs.org/))

## 📥 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/DEMYSHOW/atendimento-bot.git
cd atendimento-bot
```

### 2. Configuração do Backend

#### 2.1 Criar Ambiente Virtual Python

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate     # Windows
```

#### 2.2 Instalar Dependências

```bash
pip install -r requirements.txt
```

#### 2.3 Configurar PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (com Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Baixe e instale o PostgreSQL do site oficial.

#### 2.4 Criar Banco de Dados

```bash
sudo -u postgres createdb chatbot_db
sudo -u postgres psql -c "CREATE USER chatbot_user WITH PASSWORD 'chatbot123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE chatbot_db TO chatbot_user;"
```

#### 2.5 Configurar Variáveis de Ambiente

Crie o arquivo `.env` no diretório `backend/`:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
DATABASE_URL=postgresql://chatbot_user:chatbot123@localhost/chatbot_db
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_chave_secreta_super_segura_aqui
```

### 3. Configuração do Frontend

O frontend é uma aplicação HTML/CSS/JavaScript pura, não requerendo instalação adicional.

### 4. Executar a Aplicação

#### 4.1 Iniciar o Backend

```bash
cd backend
source venv/bin/activate
python src/app.py
```

O servidor estará disponível em: `http://localhost:5000`

#### 4.2 Abrir o Frontend

Abra o arquivo `frontend/public/index.html` em seu navegador ou use um servidor web local:

```bash
cd frontend/public
python3 -m http.server 8080
```

Acesse: `http://localhost:8080`

## 🔧 Configuração Avançada

### Configuração de Produção

Para ambiente de produção, recomendamos:

1. **Usar Gunicorn** para servir a aplicação Flask:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.app:app
```

2. **Configurar Nginx** como proxy reverso
3. **Usar PostgreSQL** em servidor dedicado
4. **Configurar SSL/HTTPS**
5. **Implementar monitoramento** e logs

### Variáveis de Ambiente Completas

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@host:porta/database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatbot_db
DB_USER=chatbot_user
DB_PASSWORD=senha_segura

# Flask
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=chave_secreta_muito_segura

# Configurações do Bot
BOT_NAME=Atendimento Bot
BOT_WELCOME_MESSAGE=Olá! Como posso ajudá-lo hoje?
MAX_MESSAGE_LENGTH=500
RESPONSE_DELAY=1000

# Logs
LOG_LEVEL=INFO
LOG_FILE=logs/chatbot.log

# Segurança
CORS_ORIGINS=http://localhost:3000,https://seudominio.com
RATE_LIMIT=100
```

## 🧪 Testes

### Executar Testes Unitários

```bash
cd backend
python -m pytest tests/
```

### Testes de Integração

```bash
python -m pytest tests/integration/
```

### Testes do Frontend

Abra o arquivo `frontend/tests/index.html` no navegador.

## 🐛 Solução de Problemas

### Problemas Comuns

**1. Erro de conexão com PostgreSQL**
```
psycopg2.OperationalError: could not connect to server
```
**Solução:** Verifique se o PostgreSQL está rodando e as credenciais estão corretas.

**2. Erro de permissão no banco**
```
permission denied for database
```
**Solução:** Execute os comandos de criação de usuário e permissões novamente.

**3. Porta já em uso**
```
Address already in use
```
**Solução:** Mate o processo na porta 5000 ou use outra porta.

**4. Módulos Python não encontrados**
```
ModuleNotFoundError
```
**Solução:** Ative o ambiente virtual e reinstale as dependências.

### Logs e Debug

Para habilitar logs detalhados:

```bash
export FLASK_DEBUG=True
export LOG_LEVEL=DEBUG
python src/app.py
```

Os logs serão salvos em `logs/chatbot.log`.

## 📱 Deployment

### Docker (Recomendado)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "src.app:app"]
```

### Heroku

```bash
# Criar Procfile
echo "web: gunicorn src.app:app" > Procfile

# Deploy
heroku create seu-chatbot
git push heroku main
```

### AWS/DigitalOcean

Consulte a documentação específica de cada provedor.

## 🔄 Atualizações

Para atualizar o Atendimento Bot:

```bash
git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt
python src/database.py  # Executar migrações se houver
```

## 📞 Suporte

- **GitHub Issues:** [Reportar problemas](https://github.com/DEMYSHOW/atendimento-bot/issues)
- **Email:** suporte@atendimentobot.com
- **Documentação:** [Wiki do projeto](https://github.com/DEMYSHOW/atendimento-bot/wiki)

---

*Desenvolvido com ❤️ para revolucionar o atendimento educacional*

