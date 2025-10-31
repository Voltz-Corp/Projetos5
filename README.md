# Full Stack Application

Este projeto contém um frontend React/Vite e um backend Express.js, dockerizados para facilitar o desenvolvimento e deploy.

## Estrutura do Projeto

```
├── frontend/          # Aplicação React/Vite
│   ├── src/          # Código fonte do frontend
│   ├── Dockerfile    # Dockerfile do frontend
│   └── package.json  # Dependências do frontend
├── backend/          # API Express.js
│   ├── index.js      # Servidor Express
│   ├── Dockerfile    # Dockerfile do backend
│   └── package.json  # Dependências do backend
└── docker-compose.yml # Orquestração dos serviços
```

## Como executar com Docker

### Pré-requisitos

- Docker e Docker Compose
- **PNPM** (para desenvolvimento local)

### Instalação do PNPM

```bash
npm install -g pnpm
# ou
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Executar a aplicação

1. **Clone o repositório e navegue até a pasta do projeto**

2. **Execute os serviços:**
   ```bash
   docker-compose up --build
   ```

3. **Acesse as aplicações:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

### Comandos úteis

```bash
# Executar em background
docker-compose up -d --build

# Parar os serviços
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f frontend
docker-compose logs -f backend

# Reconstruir e executar
docker-compose up --build --force-recreate
```

## Desenvolvimento sem Docker

### Frontend
```bash
cd frontend
pnpm install
pnpm run dev
```

### Backend
```bash
cd backend
pnpm install
pnpm run dev
```

## API Endpoints

- `GET /` - Hello World
- `GET /api/health` - Status da API

## Tecnologias

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, **PNPM**
- **Backend**: Node.js, Express.js, **PNPM**
- **Containerização**: Docker, Docker Compose

## Configuração da API do Gemini

Para habilitar os insights de IA preditivos, você precisa configurar uma chave da API do Google Gemini no backend:

1. **Obtenha uma chave da API do Gemini:**
   - Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crie uma nova chave de API

2. **Configure a chave no backend:**
   - Edite o arquivo `backend/.env`
   - Adicione sua chave da API:
     ```
     GEMINI_API_KEY=sua_chave_do_gemini_aqui
     ```

3. **Reinicie os serviços:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Funcionalidades da IA

O sistema de IA gera insights preditivos baseados nos dados de incidentes, incluindo:

- **Análise de padrões de risco** em diferentes bairros
- **Previsões climáticas** considerando fatores como ventos e chuvas
- **Recomendações de priorização** para otimização de recursos
- **Alertas preventivos** para áreas críticas
- **Análise de eficiência** por região

Os insights são atualizados automaticamente a cada 5 minutos e incluem nível de confiança para cada recomendação.