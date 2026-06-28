-- =============================================
-- CQI-LAB — Seeds: Dados Iniciais
-- =============================================

-- =============================================
-- USUÁRIO ADMIN PADRÃO
-- Senha: Admin@123 (hash bcrypt gerado externamente)
-- =============================================
INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
(
  'Administrador do Sistema',
  'admin@cqilab.com',
  '$2a$10$AHo8As1Ol0aPAztgQ371Z.tYIWesa.DVhiDmLVhv/cDDPpiHE0XFC', -- Admin@123
  'admin'
),
(
  'Maria Silva',
  'secretaria@cqilab.com',
  '$2a$10$AHo8As1Ol0aPAztgQ371Z.tYIWesa.DVhiDmLVhv/cDDPpiHE0XFC',
  'secretaria'
),
(
  'João Santos',
  'coletador@cqilab.com',
  '$2a$10$AHo8As1Ol0aPAztgQ371Z.tYIWesa.DVhiDmLVhv/cDDPpiHE0XFC',
  'coletador'
),
(
  'Ana Oliveira',
  'tecnico@cqilab.com',
  '$2a$10$AHo8As1Ol0aPAztgQ371Z.tYIWesa.DVhiDmLVhv/cDDPpiHE0XFC',
  'tecnico'
),
(
  'Dr. Carlos Pereira',
  'rt@cqilab.com',
  '$2a$10$AHo8As1Ol0aPAztgQ371Z.tYIWesa.DVhiDmLVhv/cDDPpiHE0XFC',
  'responsavel_tecnico'
)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- TIPOS DE MATERIAL
-- =============================================
INSERT INTO tipos_material (nome, descricao) VALUES
('Sangue Total', 'Sangue coletado sem anticoagulante'),
('Soro', 'Sangue coletado e centrifugado para separação do soro'),
('Plasma', 'Sangue coletado com anticoagulante e centrifugado'),
('Urina', 'Amostra de urina (jato médio, 24h, etc.)'),
('Fezes', 'Amostra de fezes para exames parasitológicos ou microbiológicos'),
('Swab Nasal', 'Swab da região nasal para pesquisa de patógenos'),
('Swab Orofaríngeo', 'Swab da orofaringe para cultura ou PCR'),
('Líquor', 'Líquido cerebroespinhal coletado por punção lombar'),
('Escarro', 'Secreção bronquial para pesquisa de tuberculose ou cultura'),
('Secreção', 'Secreção de feridas ou outros sítios para cultura')
ON CONFLICT (nome) DO NOTHING;

-- =============================================
-- TIPOS DE EXAME
-- =============================================
INSERT INTO tipos_exame (nome, codigo, descricao) VALUES
('Hemograma Completo', 'HMG', 'Contagem e avaliação morfológica das células sanguíneas'),
('Glicemia de Jejum', 'GLI', 'Medição da concentração de glicose no sangue em jejum'),
('Colesterol Total e Frações', 'COL', 'Medição da concentração de colesterol HDL, LDL e VLDL'),
('Triglicerídeos', 'TRI', 'Medição da concentração de triglicerídeos no sangue'),
('TSH', 'TSH', 'Hormônio estimulante da tireoide'),
('T4 Livre', 'T4L', 'Tiroxina livre circulante no sangue'),
('TGO (AST)', 'TGO', 'Aspartato aminotransferase — avaliação hepática'),
('TGP (ALT)', 'TGP', 'Alanina aminotransferase — avaliação hepática'),
('Ureia', 'URE', 'Produto final do metabolismo de proteínas'),
('Creatinina', 'CRE', 'Avaliação da função renal'),
('Ácido Úrico', 'ACU', 'Medição da concentração de ácido úrico no sangue'),
('PCR (Proteína C Reativa)', 'PCR', 'Marcador inflamatório inespecífico'),
('VHS', 'VHS', 'Velocidade de hemossedimentação — marcador inflamatório'),
('Exame de Urina (EAS)', 'EAS', 'Análise física, química e microscópica da urina'),
('Urocultura', 'UCU', 'Cultura de urina para identificação de bactérias'),
('Coproparasitológico', 'CPO', 'Pesquisa de parasitas nas fezes'),
('Cultura de Fezes', 'CFZ', 'Isolamento e identificação de bactérias patogênicas nos fezes'),
('PCR COVID-19', 'COV', 'Detecção do SARS-CoV-2 por biologia molecular'),
('Antígeno Influenza', 'INF', 'Teste rápido para detecção de Influenza A e B'),
('Sorologla HIV', 'HIV', 'Pesquisa de anticorpos anti-HIV 1 e 2')
ON CONFLICT (nome) DO NOTHING;

-- =============================================
-- PACIENTES DE EXEMPLO
-- =============================================
INSERT INTO pacientes (nome, cpf, data_nascimento, telefone, email, cep, logradouro, numero, bairro, cidade, estado, convenio, medico_solicitante, criado_por)
SELECT
  'Lucas Fernandes',
  '123.456.789-00',
  '1985-03-15',
  '(11) 99999-0001',
  'lucas.fernandes@email.com',
  '01310-100',
  'Avenida Paulista',
  '1234',
  'Bela Vista',
  'São Paulo',
  'SP',
  'Unimed',
  'Dr. Roberto Alves — CRM/SP 54321',
  u.id
FROM usuarios u WHERE u.email = 'secretaria@cqilab.com'
LIMIT 1
ON CONFLICT (cpf) DO NOTHING;

INSERT INTO pacientes (nome, cpf, data_nascimento, telefone, email, cep, logradouro, numero, bairro, cidade, estado, convenio, medico_solicitante, criado_por)
SELECT
  'Juliana Costa',
  '987.654.321-00',
  '1992-07-22',
  '(11) 98888-0002',
  'juliana.costa@email.com',
  '04007-000',
  'Rua das Flores',
  '567',
  'Jardim Paulista',
  'São Paulo',
  'SP',
  'SulAmérica Saúde',
  'Dra. Camila Rocha — CRM/SP 67890',
  u.id
FROM usuarios u WHERE u.email = 'secretaria@cqilab.com'
LIMIT 1
ON CONFLICT (cpf) DO NOTHING;