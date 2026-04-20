import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AlertTriangle, RefreshCw, Package } from 'lucide-react';

export default function Alertas() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.getProducts({ alerta: 'true' });
      setProdutos(r.data || []);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pct = (atual, minimo) => minimo > 0 ? Math.round((atual / minimo) * 100) : 0;

  const getCriticidade = (p) => {
    const p_ = pct(p.estoque_atual, p.estoque_minimo);
    if (p.estoque_atual <= 0) return { label: 'SEM ESTOQUE', color: '#ff1744', bg: 'rgba(255,23,68,0.12)' };
    if (p_ <= 30) return { label: 'CRÍTICO', color: 'var(--danger)', bg: 'var(--danger-dim)' };
    return { label: 'BAIXO', color: 'var(--accent)', bg: 'var(--accent-dim)' };
  };

  return (
    <div>
      <div className="flex-between mb-20">
        <div className="flex-center gap-8">
          <AlertTriangle size={18} color="var(--danger)" />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Verificando estoque...</div>
      ) : produtos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Package size={40} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-cond)', marginBottom: 8, textTransform: 'uppercase' }}>
            Estoque sob controle!
          </div>
          <div className="text-muted">Nenhum produto está abaixo do nível mínimo de estoque.</div>
        </div>
      ) : (
        <>
          <div className="alert-banner danger mb-20">
            <AlertTriangle size={18} />
            <strong>{produtos.length} produto(s) precisam de reposição imediata!</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {produtos.map(p => {
              const p_ = pct(p.estoque_atual, p.estoque_minimo);
              const crit = getCriticidade(p);
              const deficit = Math.max(0, p.estoque_minimo - p.estoque_atual);
              return (
                <div key={p.id} className="card" style={{ borderColor: `${crit.color}33` }}>
                  <div className="flex-between" style={{ gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div className="flex-center gap-12" style={{ marginBottom: 10 }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            background: crit.bg,
                            color: crit.color,
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 1,
                            fontFamily: 'var(--font-cond)',
                          }}
                        >
                          {crit.label}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{p.nome}</span>
                        <span className="text-mono text-muted">{p.codigo}</span>
                        <span className="badge badge-muted">{p.categoria}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 12 }}>
                        <div>
                          <div className="card-title">Estoque Atual</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: crit.color, fontFamily: 'var(--font-cond)' }}>
                            {Number(p.estoque_atual).toLocaleString('pt-BR')} <span style={{ fontSize: 13 }}>{p.unidade}</span>
                          </div>
                        </div>
                        <div>
                          <div className="card-title">Estoque Mínimo</div>
                          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-cond)' }}>
                            {Number(p.estoque_minimo).toLocaleString('pt-BR')} <span style={{ fontSize: 13 }}>{p.unidade}</span>
                          </div>
                        </div>
                        <div>
                          <div className="card-title">Déficit</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-cond)' }}>
                            {Number(deficit).toLocaleString('pt-BR')} <span style={{ fontSize: 13 }}>{p.unidade}</span>
                          </div>
                        </div>
                        <div>
                          <div className="card-title">Fornecedor</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{p.fornecedor || '—'}</div>
                        </div>
                      </div>

                      <div>
                        <div className="flex-between" style={{ marginBottom: 5 }}>
                          <span className="text-muted" style={{ fontSize: 12 }}>Nível de estoque</span>
                          <span style={{ fontSize: 12, color: crit.color, fontWeight: 600 }}>{p_}% do mínimo</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(p_, 100)}%`,
                            height: '100%',
                            background: crit.color,
                            borderRadius: 100,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
