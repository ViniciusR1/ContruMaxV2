import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/movimentacoes - listar com filtros
router.get('/', async (req, res) => {
  try {
    const { produto_id, tipo, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('movimentacoes')
      .select('*, produtos(id, nome, codigo, unidade, estoque_minimo)')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (produto_id) query = query.eq('produto_id', produto_id);
    if (tipo) query = query.eq('tipo', tipo);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/movimentacoes - registrar entrada ou saída
router.post('/', async (req, res) => {
  try {
    const { produto_id, tipo, quantidade, motivo, observacao, responsavel } = req.body;

    if (!produto_id || !tipo || !quantidade) {
      return res.status(400).json({ success: false, error: 'produto_id, tipo e quantidade são obrigatórios' });
    }
    if (!['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ success: false, error: 'tipo deve ser "entrada" ou "saida"' });
    }
    if (quantidade <= 0) {
      return res.status(400).json({ success: false, error: 'quantidade deve ser maior que zero' });
    }

    // Verificar se produto existe e calcular estoque atual
    const { data: produto, error: prodErr } = await supabase
      .from('produtos')
      .select('*, movimentacoes(tipo, quantidade)')
      .eq('id', produto_id)
      .single();

    if (prodErr || !produto) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }

    const movs = produto.movimentacoes || [];
    const totalEntradas = movs.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0);
    const totalSaidas = movs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0);
    const estoqueAtual = (produto.estoque_inicial || 0) + totalEntradas - totalSaidas;

    if (tipo === 'saida' && quantidade > estoqueAtual) {
      return res.status(400).json({
        success: false,
        error: `Estoque insuficiente. Disponível: ${estoqueAtual} ${produto.unidade}`
      });
    }

    const { data, error } = await supabase
      .from('movimentacoes')
      .insert([{ produto_id, tipo, quantidade, motivo, observacao, responsavel }])
      .select('*, produtos(id, nome, codigo, unidade)')
      .single();

    if (error) throw error;

    const novoEstoque = tipo === 'entrada' ? estoqueAtual + quantidade : estoqueAtual - quantidade;
    const alerta = novoEstoque <= produto.estoque_minimo;

    res.status(201).json({
      success: true,
      data,
      estoque_atual: novoEstoque,
      alerta_reposicao: alerta,
      mensagem_alerta: alerta ? `⚠️ Estoque abaixo do mínimo! Atual: ${novoEstoque} | Mínimo: ${produto.estoque_minimo}` : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/movimentacoes/dashboard - stats gerais
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { data: produtos, error: prodErr } = await supabase
      .from('produtos')
      .select('*, movimentacoes(tipo, quantidade)');

    if (prodErr) throw prodErr;

    let totalProdutos = produtos.length;
    let alertas = 0;
    let totalValorEstoque = 0;

    const produtosComEstoque = produtos.map(p => {
      const movs = p.movimentacoes || [];
      const totalEntradas = movs.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0);
      const totalSaidas = movs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0);
      const estoque_atual = (p.estoque_inicial || 0) + totalEntradas - totalSaidas;
      const alerta_reposicao = estoque_atual <= p.estoque_minimo;
      if (alerta_reposicao) alertas++;
      totalValorEstoque += estoque_atual * (p.preco_custo || 0);
      return { ...p, estoque_atual, alerta_reposicao };
    });

    // Últimas 30 movimentações
    const { data: recentMovs, error: movErr } = await supabase
      .from('movimentacoes')
      .select('tipo, quantidade, created_at, produtos(nome)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (movErr) throw movErr;

    const entradas7d = recentMovs.filter(m => {
      const d = new Date(m.created_at);
      const now = new Date();
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return m.tipo === 'entrada' && diff <= 7;
    }).length;

    const saidas7d = recentMovs.filter(m => {
      const d = new Date(m.created_at);
      const now = new Date();
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return m.tipo === 'saida' && diff <= 7;
    }).length;

    res.json({
      success: true,
      data: {
        total_produtos: totalProdutos,
        alertas_reposicao: alertas,
        valor_total_estoque: totalValorEstoque,
        entradas_7dias: entradas7d,
        saidas_7dias: saidas7d,
        produtos_alerta: produtosComEstoque.filter(p => p.alerta_reposicao).map(p => ({
          id: p.id, nome: p.nome, estoque_atual: p.estoque_atual, estoque_minimo: p.estoque_minimo, unidade: p.unidade
        })),
        movimentacoes_recentes: recentMovs.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
