# CQI-LAB — Sistema de Gerenciamento de Amostras Laboratoriais

Sistema web para laboratório de análises clínicas com controle completo do ciclo de vida das amostras.

## 🏗️ Tecnologias

- **Backend:** Node.js + Express.js
- **Banco de Dados:** PostgreSQL
- **Frontend:** HTML + CSS + JavaScript (Vanilla)
- **Autenticação:** JWT (Bearer Token)
- **Geração de PDF:** PDFKit
- **Deploy:** Docker Compose

## 👥 Perfis de Usuário

| Perfil | Permissões |
|--------|-----------|
| **Admin** | Acesso total, gerencia usuários, relatórios, configurações |
| **Secretária** | Cadastra pacientes e cria solicitações de exames |
| **Coletador** | Registra coleta das amostras |
| **Técnico de Laboratório** | Realiza triagem e executa exames |
| **Responsável Técnico (RT)** | Confere exames e finaliza amostras |

## 🔄 Fluxo da Amostra

```
Aguardando Coleta → Coletada → Em Andamento → Finalizado
                         ↑           ↑
                    Recoleta Solicitada (volta para Aguardando Coleta)
```

## 🚀 Deploy com Docker Compose

### Pré-requisitos
- Docker e Docker Compose instalados na VPS

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/cqi-lab.git
cd cqi-lab
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
nano .env
```

### 3. Suba os containers
```bash
docker-compose up -d
```

### 4. Acesse o sistema
- URL: `http://seu-servidor:3000`
- Login padrão Admin: `admin@cqilab.com` / `Admin@123`

### Parar os containers
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs -f app
```

## 🗂️ Estrutura do Projeto

```
cqi-lab/
├── backend/
│   ├── config/          # Configurações (DB, JWT)
│   ├── controllers/     # Lógica de negócio
│   ├── middlewares/     # Auth, validações
│   ├── models/          # Modelos do banco de dados
│   └── routes/          # Rotas da API
├── frontend/
│   ├── assets/          # Imagens e ícones
│   ├── css/             # Estilos
│   ├── js/              # JavaScript do cliente
│   └── pages/           # Páginas HTML
├── database/
│   ├── migrations/      # Scripts de criação das tabelas
│   └── seeds/           # Dados iniciais
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```
