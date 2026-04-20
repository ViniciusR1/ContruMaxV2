import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/products - listar todos com estoque e alertas
router.get('/', async (req, res) => {
  try {
    const { search, categoria, alerta } = req.query;

    let query = `
      SELECT 
        p.*,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE 0 END), 0) AS total_entradas,
        COALESCE(SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade ELSE 0 END), 0) AS total_saidas,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), p.estoque_inicial) AS estoque_atual
      FROM produtos p
      LEFT JOIN movimentacoes m ON p.id = m.produto_id
    `;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(p.nome ILIKE $${paramIdx} OR p.codigo ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (categoria) {
      conditions.push(`p.categoria = $${paramIdx}`);
      params.push(categoria);
      paramIdx++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY p.id ORDER BY p.nome ASC';

    const { data, error } = await supabase.rpc('exec_query', { sql: query, params });

    // Usar .from() com raw SQL via rpc ou fazer via supabase diretamente
    // Como o supabase-js não suporta raw SQL diretamente, usamos a abordagem com views/rpc
    // Alternativa: buscar tudo e calcular no JS
    const { data: produtos, error: prodErr } = await supabase
      .from('produtos')
      .select(`
        *,
        movimentacoes(tipo, quantidade)
      `)
      .order('nome');

    if (prodErr) throw prodErr;

    let result = produtos.map(p => {
      const movs = p.movimentacoes || [];
      const totalEntradas = movs.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0);
      const totalSaidas = movs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0);
      const estoque_atual = (p.estoque_inicial || 0) + totalEntradas - totalSaidas;
      const alerta_reposicao = estoque_atual <= p.estoque_minimo;
      return { ...p, estoque_atual, total_entradas: totalEntradas, total_saidas: totalSaidas, alerta_reposicao };
    });

    if (search) {
      result = result.filter(p =>
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (categoria) {
      result = result.filter(p => p.categoria === categoria);
    }
    if (alerta === 'true') {
      result = result.filter(p => p.alerta_reposicao);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: produto, error } = await supabase
      .from('produtos')
      .select('*, movimentacoes(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!produto) return res.status(404).json({ success: false, error: 'Produto não encontrado' });

    const movs = produto.movimentacoes || [];
    const totalEntradas = movs.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0);
    const totalSaidas = movs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0);
    const estoque_atual = (produto.estoque_inicial || 0) + totalEntradas - totalSaidas;
    const alerta_reposicao = estoque_atual <= produto.estoque_minimo;

    res.json({ success: true, data: { ...produto, estoque_atual, alerta_reposicao } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { nome, codigo, categoria, unidade, preco_custo, preco_venda, estoque_inicial, estoque_minimo, descricao, fornecedor } = req.body;

    if (!nome || !codigo || !categoria || !unidade) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios: nome, codigo, categoria, unidade' });
    }

    const { data, error } = await supabase
      .from('produtos')
      .insert([{ nome, codigo, categoria, unidade, preco_custo: preco_custo || 0, preco_venda: preco_venda || 0, estoque_inicial: estoque_inicial || 0, estoque_minimo: estoque_minimo || 0, descricao, fornecedor }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Código de produto já existe' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { nome, codigo, categoria, unidade, preco_custo, preco_venda, estoque_minimo, descricao, fornecedor } = req.body;

    const { data, error } = await supabase
      .from('produtos')
      .update({ nome, codigo, categoria, unidade, preco_custo, preco_venda, estoque_minimo, descricao, fornecedor, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Produto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/categorias/lista
router.get('/categorias/lista', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('categoria')
      .order('categoria');

    if (error) throw error;
    const categorias = [...new Set(data.map(p => p.categoria))];
    res.json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
