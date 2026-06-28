-- =============================================
-- CQI-LAB — Migration: Criação das Tabelas
-- =============================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM: Perfis de usuário
-- =============================================
CREATE TYPE perfil_usuario AS ENUM (
  'admin',
  'secretaria',
  'coletador',
  'tecnico',
  'responsavel_tecnico'
);

-- =============================================
-- ENUM: Status da amostra
-- =============================================
CREATE TYPE status_amostra AS ENUM (
  'aguardando_coleta',
  'coletada',
  'em_andamento',
  'finalizado',
  'recoleta_solicitada'
);

-- =============================================
-- TABELA: Usuários do sistema
-- =============================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil perfil_usuario NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: Tipos de material de amostra
-- =============================================
CREATE TABLE tipos_material (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: Tipos de exame
-- =============================================
CREATE TABLE tipos_exame (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL UNIQUE,
  codigo VARCHAR(50) UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: Pacientes
-- =============================================
CREATE TABLE pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  data_nascimento DATE NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(200),
  -- Endereço
  cep VARCHAR(10),
  logradouro VARCHAR(200),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  -- Convênio e médico
  convenio VARCHAR(200),
  numero_carteirinha VARCHAR(100),
  medico_solicitante VARCHAR(200),
  crm_medico VARCHAR(50),
  -- Metadados
  criado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: Solicitações de exames (Amostras)
-- =============================================
CREATE TABLE amostras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(20) UNIQUE NOT NULL, -- Código gerado automaticamente (ex: AM2024001)
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  tipo_material_id UUID REFERENCES tipos_material(id),
  status status_amostra DEFAULT 'aguardando_coleta',
  -- Responsáveis
  secretaria_id UUID REFERENCES usuarios(id),    -- Quem criou a solicitação
  coletador_id UUID REFERENCES usuarios(id),     -- Quem vai coletar
  tecnico_id UUID REFERENCES usuarios(id),       -- Técnico responsável
  responsavel_tecnico_id UUID REFERENCES usuarios(id), -- RT responsável
  -- Observações
  observacoes TEXT,
  -- Datas
  data_solicitacao TIMESTAMP DEFAULT NOW(),
  data_coleta TIMESTAMP,
  data_finalizacao TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: Exames vinculados a uma amostra
-- =============================================
CREATE TABLE amostra_exames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amostra_id UUID NOT NULL REFERENCES amostras(id) ON DELETE CASCADE,
  tipo_exame_id UUID NOT NULL REFERENCES tipos_exame(id),
  status status_amostra DEFAULT 'aguardando_coleta',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: Histórico de status (Trilha de Auditoria)
-- =============================================
CREATE TABLE historico_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amostra_id UUID NOT NULL REFERENCES amostras(id) ON DELETE CASCADE,
  status_anterior status_amostra,
  status_novo status_amostra NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  motivo TEXT,                               -- Motivo da mudança (obrigatório para recoleta/reexame)
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: Mensagens de contato
-- =============================================
CREATE TABLE mensagens_contato (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  assunto VARCHAR(300) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ÍNDICES para performance de consultas
-- =============================================
CREATE INDEX idx_amostras_paciente ON amostras(paciente_id);
CREATE INDEX idx_amostras_status ON amostras(status);
CREATE INDEX idx_amostras_coletador ON amostras(coletador_id);
CREATE INDEX idx_amostras_tecnico ON amostras(tecnico_id);
CREATE INDEX idx_amostras_data ON amostras(data_solicitacao);
CREATE INDEX idx_historico_amostra ON historico_status(amostra_id);
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX idx_pacientes_nome ON pacientes(nome);

-- =============================================
-- FUNÇÃO: Atualiza campo atualizado_em automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de atualização automática
CREATE TRIGGER trigger_usuarios_updated BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_pacientes_updated BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_amostras_updated BEFORE UPDATE ON amostras
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();