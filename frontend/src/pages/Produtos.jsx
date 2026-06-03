import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
// Adicionado ChevronDown nas importações
import { Plus, Search, Pencil, Trash2, X, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';

const CATEGORIAS = ['Cimento', 'Agregados', 'Alvenaria', 'Tintas', 'Pisos', 'Hidráulica', 'Ferragem', 'Impermeabilizante', 'Argamassa', 'Ferramentas', 'Elétrica', 'Outros'];
const UNIDADES = ['saco', 'kg', 'm³', 'm²', 'metro', 'litro', 'galão', 'balde', 'pç', 'caixa', 'milheiro', 'barra', 'rolo'];

const emptyForm = {
  nome: '', codigo: '', categoria: '', unidade: '', descricao: '',
  fornecedor: '', preco_custo: '', preco_venda: '', estoque_inicial: '', estoque_minimo: '',
};

function Notify({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  if (!msg) return null;
  return (
    <div className={`notification ${type}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      <span>{msg}</span>
    </div>
  );
}

function ProdutoModal({ produto, onClose, onSave }) {
  const [form, setForm] = useState(produto ? { ...produto } : emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.nome || !form.codigo || !form.categoria || !form.unidade) {
      setError('Preencha: Nome, Código, Categoria e Unidade');
      return;
    }
    setSaving(true);
    try {
      if (produto?.id) {
        await api.updateProduct(produto.id, form);
      } else {
        await api.createProduct(form);
      }
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{produto?.id ? 'Editar Produto' : 'Novo Produto'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert-banner danger mb-16">{error}</div>}
          
          <div className="form-row mb-16">
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Cimento Portland" />
            </div>
            <div className="form-group">
              <label className="form-label">Código *</label>
              <input className="input" value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="Ex: CIM-001" />
            </div>
          </div>
          
          <div className="form-row mb-16">
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select className="select" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                <option value="">Selecione...</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unidade *</label>
              <select className="select" value={form.unidade} onChange={e => set('unidade', e.target.value)}>
                <option value="">Selecione...</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Fornecedor</label>
            <input className="input" value={form.fornecedor} onChange={e => set('fornecedor', e.target.value)} placeholder="Nome do fornecedor" />
          </div>
          
          <div className="form-row mb-16">
            <div className="form-group">
              <label className="form-label">Preço de Custo (R$)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.preco_custo} onChange={e => set('preco_custo', e.target.value)} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label className="form-label">Preço de Venda (R$)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.preco_venda} onChange={e => set('preco_venda', e.target.value)} placeholder="0,00" />
            </div>
          </div>
          
          <div className="form-row mb-16">
            <div className="form-group">
              <label className="form-label">Estoque Inicial</label>
              <input className="input" type="number" min="0" step="0.01" value={form.estoque_inicial} onChange={e => set('estoque_inicial', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Estoque Mínimo</label>
              <input className="input" type="number" min="0" step="0.01" value={form.estoque_minimo} onChange={e => set('estoque_minimo', e.target.value)} placeholder="0" />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea className="textarea" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Informações adicionais..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | produto
  const [notify, setNotify] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // NOVO ESTADO: Controla a abertura do dropdown customizado de categorias
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getProducts({ search, categoria });
      setProdutos(r.data || []);
    } finally {
      setLoading(false);
    }
  }, [search, categoria]);

  useEffect(() => { load(); }, [load]);

  const handleSave = () => {
    setModal(null);
    setNotify({ msg: 'Produto salvo com sucesso!', type: 'success' });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover este produto? As movimentações serão deletadas junto.')) return;
    setDeleting(id);
    try {
      await api.deleteProduct(id);
      setNotify({ msg: 'Produto removido.', type: 'success' });
      load();
    } catch (e) {
      setNotify({ msg: e.message, type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  const fmtN = (n) => Number(n ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  return (
    <div>
      {notify && <Notify msg={notify.msg} type={notify.type} onClose={() => setNotify(null)} />}
      {modal && (
        <ProdutoModal
          produto={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div className="flex-between mb-20">
        <div className="flex-center gap-12 mobile-search-filter-layout">
          <div className="flex-center gap-8" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px', gap: 8 }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, width: 220, fontFamily: 'var(--font)' }}
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */}
          {/* ALTERAÇÃO AQUI: Substituição do <select> nativo por Dropdown Customizado */}
          {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */}
          <div className="custom-dropdown" style={{ position: 'relative' }}>
            <button 
              type="button" 
              className="btn-ghost flex-center" 
              style={{ 
                padding: '9px 12px', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius)', 
                background: 'var(--bg3)',
                minWidth: 40 // Garante tamanho mínimo no mobile apenas com o ícone
              }}
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            >
              {/* O nome aparece aqui em telas maiores e some no mobile devido à classe hide-on-mobile */}
              <span className="hide-on-mobile" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginRight: 8 }}>
                {categoria || "Todas as categorias"}
              </span>
              {/* Ícone da seta que permanece visível no mobile */}
              <ChevronDown size={16} color="var(--text-muted)" />
            </button>

            {/* Lista absoluta de opções que abre ao clicar no botão */}
            {showCategoryMenu && (
              <ul className="select-options-list" style={{ 
                position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 220, 
                background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)', listStyle: 'none', padding: 4, zIndex: 100 
              }}>
                <li key="all" 
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 14, color: !categoria ? 'var(--accent)' : 'var(--text)', background: !categoria ? 'var(--accent-dim)' : 'transparent' }} 
                  onClick={() => { setCategoria(''); setShowCategoryMenu(false); }}
                >
                  Todas as categorias
                </li>
                {CATEGORIAS.map(c => (
                  <li key={c} 
                    style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 14, color: categoria === c ? 'var(--accent)' : 'var(--text)', background: categoria === c ? 'var(--accent-dim)' : 'transparent' }} 
                    onClick={() => { setCategoria(c); setShowCategoryMenu(false); }}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */}
          {/* FIM DA ALTERAÇÃO */}
          {/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */}

        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={15} /> Novo Produto
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Carregando produtos...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Unid.</th>
                <th>Estoque Atual</th>
                <th>Mínimo</th>
                <th>Preço Venda</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr><td colSpan={9} className="empty">Nenhum produto encontrado</td></tr>
              ) : produtos.map(p => {
                const pct = p.estoque_minimo > 0 ? Math.min((p.estoque_atual / p.estoque_minimo) * 100, 100) : 100;
                const color = p.alerta_reposicao ? 'var(--danger)' : pct < 150 ? 'var(--accent)' : 'var(--success)';
                return (
                  <tr key={p.id}>
                    <td><span className="text-mono">{p.codigo}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.nome}</div>
                      {p.fornecedor && <div className="text-muted">{p.fornecedor}</div>}
                    </td>
                    <td><span className="badge badge-muted">{p.categoria}</span></td>
                    <td className="text-muted">{p.unidade}</td>
                    <td>
                      <div className="stock-bar">
                        <span style={{ fontWeight: 600, minWidth: 40, color }}>{fmtN(p.estoque_atual)}</span>
                        <div className="stock-bar-track">
                          <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{fmtN(p.estoque_minimo)}</td>
                    <td>
                      {Number(p.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td>
                      {p.alerta_reposicao
                        ? <span className="badge badge-danger"><AlertTriangle size={10} /> Repor</span>
                        : <span className="badge badge-success">OK</span>
                      }
                    </td>
                    <td>
                      <div className="flex-center gap-8">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(p)}><Pencil size={13} /></button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-muted mt-20">{produtos.length} produto(s) encontrado(s)</div>
    </div>
  );
}