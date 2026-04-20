import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Package, AlertTriangle, TrendingDown, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmtCurrency = (v) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00';

function StatCard({ title, value, icon: Icon, color = 'text', sub }) {
  return (
    <div className="card">
      <div className="flex-between mb-16">
        <span className="card-title">{title}</span>
        <Icon size={18} style={{ color: `var(--${color === 'danger' ? 'danger' : color === 'success' ? 'success' : color === 'accent' ? 'accent' : color === 'info' ? 'info' : 'text-muted'})` }} />
      </div>
      <div className={`stat-value ${color !== 'text' ? color : ''}`}>{value}</div>
      {sub && <div className="text-muted" style={{ marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Carregando...</div>;
  if (!stats) return null;

  const alertData = stats.produtos_alerta?.slice(0, 8).map(p => ({
    name: p.nome.length > 18 ? p.nome.slice(0, 18) + '…' : p.nome,
    atual: p.estoque_atual,
    minimo: p.estoque_minimo,
  })) || [];

  return (
    <div>
      {stats.alertas_reposicao > 0 && (
        <div className="alert-banner danger mb-20">
          <AlertTriangle size={18} />
          <span><strong>{stats.alertas_reposicao} produto(s)</strong> com estoque abaixo do mínimo! Verifique a aba Alertas.</span>
        </div>
      )}

      <div className="grid-4 mb-20">
        <StatCard title="Total de Produtos" value={stats.total_produtos} icon={Package} />
        <StatCard title="Alertas de Reposição" value={stats.alertas_reposicao} icon={AlertTriangle} color="danger" />
        <StatCard title="Entradas (7 dias)" value={stats.entradas_7dias} icon={TrendingUp} color="success" />
        <StatCard title="Saídas (7 dias)" value={stats.saidas_7dias} icon={TrendingDown} color="info" />
      </div>

      <div className="card mb-20">
        <div className="flex-between mb-16" style={{ gap: 8 }}>
          <div className="flex-center gap-8">
            <DollarSign size={16} style={{ color: 'var(--accent)' }} />
            <span className="section-title">Valor Total em Estoque</span>
          </div>
          <span className="stat-value accent" style={{ fontSize: 28 }}>{fmtCurrency(stats.valor_total_estoque)}</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="section-title mb-16">⚠ Produtos em Alerta</p>
          {alertData.length === 0 ? (
            <div className="empty">Nenhum alerta no momento 🎉</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={alertData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" stroke="var(--text-dim)" tick={{ fontSize: 11, fontFamily: 'Barlow' }} />
                <YAxis type="category" dataKey="name" stroke="var(--text-dim)" tick={{ fontSize: 11, fontFamily: 'Barlow' }} width={110} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="atual" name="Estoque Atual" radius={3}>
                  {alertData.map((entry, i) => (
                    <Cell key={i} fill={entry.atual <= entry.minimo ? 'var(--danger)' : 'var(--accent)'} />
                  ))}
                </Bar>
                <Bar dataKey="minimo" name="Estoque Mínimo" fill="rgba(255,255,255,0.08)" radius={3} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <p className="section-title mb-16">⟳ Movimentações Recentes</p>
          {stats.movimentacoes_recentes?.length === 0 ? (
            <div className="empty">Nenhuma movimentação</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.movimentacoes_recentes?.map((m, i) => (
                <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex-center gap-8">
                    {m.tipo === 'entrada'
                      ? <ArrowUpRight size={15} color="var(--success)" />
                      : <ArrowDownRight size={15} color="var(--danger)" />
                    }
                    <span style={{ fontSize: 13 }}>{m.produtos?.nome || '—'}</span>
                  </div>
                  <div className="flex-center gap-8">
                    <span className={`badge badge-${m.tipo === 'entrada' ? 'success' : 'danger'}`}>
                      {m.tipo === 'entrada' ? '+' : '-'}{m.quantidade}
                    </span>
                    <span className="text-muted" style={{ fontSize: 11 }}>
                      {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
