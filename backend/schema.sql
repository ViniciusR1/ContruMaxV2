-- ============================================
-- CONSTRUMAX - Schema SQL para Supabase
-- Execute no SQL Editor do Supabase
-- ============================================

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  unidade VARCHAR(20) NOT NULL, -- ex: kg, saco, m², litro, pç, m
  descricao TEXT,
  fornecedor VARCHAR(200),
  preco_custo NUMERIC(10,2) DEFAULT 0,
  preco_venda NUMERIC(10,2) DEFAULT 0,
  estoque_inicial NUMERIC(10,3) DEFAULT 0,
  estoque_minimo NUMERIC(10,3) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS movimentacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),
  motivo VARCHAR(200),
  observacao TEXT,
  responsavel VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_created_at ON movimentacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON produtos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS DE EXEMPLO (opcional)
-- ============================================
INSERT INTO produtos (nome, codigo, categoria, unidade, descricao, fornecedor, preco_custo, preco_venda, estoque_inicial, estoque_minimo) VALUES
('Cimento Portland CP-II', 'CIM-001', 'Cimento', 'saco', 'Saco 50kg - uso geral', 'Votorantim', 32.00, 42.00, 200, 50),
('Areia Fina Lavada', 'ARE-001', 'Agregados', 'm³', 'Areia fina para reboco e argamassa', 'Areial São Paulo', 120.00, 160.00, 30, 10),
('Tijolo Cerâmico 9 furos', 'TIJ-001', 'Alvenaria', 'milheiro', 'Tijolo 9x19x29cm', 'Cerâmica Norte', 680.00, 900.00, 20, 5),
('Tinta Acrílica Branca 18L', 'TIN-001', 'Tintas', 'balde', 'Tinta acrílica premium interior/exterior', 'Suvinil', 180.00, 249.00, 40, 10),
('Piso Cerâmico 60x60 Bege', 'PIS-001', 'Pisos', 'm²', 'Piso cerâmico polido para área interna', 'Portobello', 28.00, 45.00, 500, 100),
('Tubo PVC 100mm 6m', 'HID-001', 'Hidráulica', 'barra', 'Tubo esgoto PVC soldável', 'Tigre', 22.00, 35.00, 80, 20),
('Vergalhão CA-50 10mm', 'FER-001', 'Ferragem', 'barra', 'Vergalhão de aço nervurado 12m', 'Gerdau', 45.00, 62.00, 150, 30),
('Impermeabilizante Vedacit 3,6L', 'IMP-001', 'Impermeabilizante', 'galão', 'Aditivo impermeabilizante para argamassa', 'Otto Baumgart', 58.00, 82.00, 25, 8),
('Argamassa AC-II 20kg', 'ARG-001', 'Argamassa', 'saco', 'Argamassa colante para cerâmica', 'Quartzolit', 18.00, 27.00, 100, 30),
('Serra Circular 7.1/4"', 'FER-FER-001', 'Ferramentas', 'pç', 'Serra circular elétrica 1200W', 'DeWalt', 450.00, 680.00, 5, 2),
('Rejunte Cinza 1kg', 'REJ-001', 'Argamassa', 'pç', 'Rejunte para pisos e azulejos', 'Quartzolit', 8.00, 14.00, 60, 15),
('Registro de Gaveta 1/2"', 'HID-002', 'Hidráulica', 'pç', 'Registro de gaveta latão', 'Docol', 28.00, 48.00, 30, 10);

-- Movimentações de exemplo
INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, responsavel)
SELECT id, 'entrada', 50, 'Compra inicial', 'Admin' FROM produtos WHERE codigo = 'CIM-001';

INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, responsavel)
SELECT id, 'saida', 30, 'Venda ao cliente', 'João Silva' FROM produtos WHERE codigo = 'CIM-001';

INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, responsavel)
SELECT id, 'saida', 180, 'Venda a construtora', 'Maria Santos' FROM produtos WHERE codigo = 'CIM-001';

INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, responsavel)
SELECT id, 'saida', 8, 'Venda', 'Carlos Pereira' FROM produtos WHERE codigo = 'ARE-001';

INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, responsavel)
SELECT id, 'saida', 380, 'Projeto Condomínio Alfa', 'Ana Lima' FROM produtos WHERE codigo = 'PIS-001';

-- Forçar alerta em alguns produtos (reduzir estoque)
INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, responsavel)
SELECT id, 'saida', 24, 'Vendas do mês', 'Admin' FROM produtos WHERE codigo = 'IMP-001';

INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, responsavel)
SELECT id, 'saida', 18, 'Vendas mês', 'Admin' FROM produtos WHERE codigo = 'ARE-001';
