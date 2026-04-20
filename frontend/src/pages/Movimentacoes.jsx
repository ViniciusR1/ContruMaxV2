import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Plus, ArrowUpCircle, ArrowDownCircle, X, AlertTriangle, CheckCircle } from 'lucide-react';

const MOTIVOS_ENTRADA = ['Compra de fornecedor', 'Devolução de cliente', 'Ajuste de inventário', 'Transferência', 'Outros'];
const MOTIVOS_SAIDA = ['Venda ao cliente', 'Uso interno', 'Perda/Avaria', 'Devolução ao fornecedor', 'Ajuste de inventário', 'Outros'];

function Notify({ msg, type, extra, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, []);
  return (
    <div className={`notification ${type}`} style={{ maxWidth: 420 }}>
      <div>
        {type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      </div>
      <div>
        <div>{msg}</div>
        {extra && <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>{extra}</div>}
      </div>
    </div>
  );
}

function MovModal({ produtos, onClose, onSave }) {
  const [form, setForm] = useState({ produto_id: '', tipo: 'entrada', quantidade: '', motivo: '', observacao: '', responsavel: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const produtoSel = produtos.find(p => p.id === form.produto_id);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const motivos = form.tipo === 'entrada' ? MOTIVOS_ENTRADA : MOTIVOS_SAIDA;

  const handleSubmit = async () => {
    setError('');
    if (!form.produto_id || !form.quantidade) {
      setError('Selecione o produto e informe a quantidade.');
      return;
    }
    setSaving(true);
    try {
      const r = await api.createMovimentacao({ ...form, quantidade: Number(form.quantidade) });
      onSave(r);
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
          <span className="modal-title">Registrar Movimentação</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert-banner danger mb-16"><AlertTriangle size={15} />{error}</div>}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Tipo *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['entrada', 'saida'].map(t => (
                <button
                  key={t}
                  className={`btn flex-center gap-8`}
                  style={{
                    flex: 1,
                    background: form.tipo === t
                      ? t === 'entrada' ? 'var(--success-dim)' : 'var(--danger-dim)'
                      : 'var(--bg3)',
                    color: form.tipo === t
                      ? t === 'entrada' ? 'var(--success)' : 'var(--danger)'
                      : 'var(--text-muted)',
                    border: `1px solid ${form.tipo === t
                      ? t === 'entrada' ? 'rgba(61,214,140,0.3)' : 'rgba(239,69,101,0.3)'
                      : 'var(--border)'}`,
                    justifyContent: 'center',
                  }}
                  onClick={() => set('tipo', t)}
                >
                  {t === 'entrada' ? <ArrowUpCircle size={15} /> : <ArrowDownCircle size={15} />}
                  {t === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Produto *</label>
            <select className="select" value={form.produto_id} onChange={e => set('produto_id', e.target.value)}>
              <option value="">Selecione o produto...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.codigo}] {p.nome} — Estoque: {Number(p.estoque_atual ?? 0).toLocaleString('pt-BR')} {p.unidade}
                </option>
              ))}
            </select>
            {produtoSel && (
              <div style={{ marginTop: 6, fontSize: 12, color: produtoSel.alerta_reposicao ? 'var(--danger)' : 'var(--text-muted)' }}>
                {produtoSel.alerta_reposicao ? '⚠ Produto com alerta de reposição' : `Estoque mínimo: ${produtoSel.estoque_minimo} ${produtoSel.unidade}`}
              </div>
            )}
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Quantidade *</label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantidade}
                onChange={e => set('quantidade', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Responsável</label>
              <input className="input" value={form.responsavel} onChange={e => set('responsavel', e.target.value)} placeholder="Nome" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Motivo</label>
            <select className="select" value={form.motivo} onChange={e => set('motivo', e.target.value)}>
              <option value="">Selecione...</option>
              {motivos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observação</label>
            <textarea className="textarea" value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Detalhes adicionais..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className={`btn ${form.tipo === 'entrada' ? 'btn-success' : 'btn-danger'}`}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Salvando...</> : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Movimentacoes() {
  const [movs, setMovs] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [notify, setNotify] = useState(null);
  const [filtro, setFiltro] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rMovs, rProd] = await Promise.all([
        api.getMovimentacoes({ limit: 100 }),
        api.getProducts()
      ]);
      setMovs(rMovs.data || []);
      setProdutos(rProd.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = (result) => {
    setModal(false);
    const msg = result.tipo === 'entrada' ? 'Entrada registrada com sucesso!' : 'Saída registrada com sucesso!';
    setNotify({ msg, type: result.alerta_reposicao ? 'warning' : 'success', extra: result.mensagem_alerta });
    load();
  };

  const filtered = filtro ? movs.filter(m => m.tipo === filtro) : movs;

  return (
    <div>
      {notify && <Notify {...notify} onClose={() => setNotify(null)} />}
      {modal && <MovModal produtos={produtos} onClose={() => setModal(false)} onSave={handleSave} />}

      <div className="flex-between mb-20">
        <div className="flex-center gap-8">
          {['', 'entrada', 'saida'].map(t => (
            <button
              key={t}
              className={`btn ${filtro === t ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setFiltro(t)}
            >
              {t === '' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Nova Movimentação
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Carregando...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Motivo</th>
                <th>Responsável</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty">Nenhuma movimentação encontrada</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id}>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(m.created_at).toLocaleDateString('pt-BR')}<br />
                    <span style={{ fontSize: 11 }}>{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${m.tipo === 'entrada' ? 'success' : 'danger'}`}>
                      {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{m.produtos?.nome || '—'}</div>
                    <div className="text-muted text-mono">{m.produtos?.codigo}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: m.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)' }}>
                      {m.tipo === 'entrada' ? '+' : '-'}{Number(m.quantidade).toLocaleString('pt-BR')} {m.produtos?.unidade}
                    </span>
                  </td>
                  <td className="text-muted">{m.motivo || '—'}</td>
                  <td className="text-muted">{m.responsavel || '—'}</td>
                  <td className="text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.observacao || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-muted mt-20">{filtered.length} movimentação(ões)</div>
    </div>
  );
}
