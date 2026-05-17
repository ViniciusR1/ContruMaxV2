import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Movimentacoes from './pages/Movimentacoes';
import Alertas from './pages/Alertas';
import { api } from './services/api';
import {
  LayoutDashboard, Package, ArrowLeftRight, BellDot,
  HardHat, LogOut, ChevronDown,
} from 'lucide-react';
import './styles/global.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, desc: 'Visão geral do sistema' },
  { to: '/produtos', label: 'Produtos', icon: Package, desc: 'Cadastro de produtos' },
  { to: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight, desc: 'Entradas e saídas' },
  { to: '/alertas', label: 'Alertas', icon: BellDot, desc: 'Reposição de estoque' },
];

// ✅ Usa api.getProducts em vez de fetch('/api/...') direto
function AlertaBadge() {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    api.getProducts({ alerta: 'true' })
      .then(d => setCount(d.data?.length || 0))
      .catch(() => {});
  }, []);
  if (count === 0) return null;
  return (
    <span style={{
      marginLeft: 'auto', background: 'var(--danger)',
      color: '#fff', borderRadius: 100, fontSize: 10,
      fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center',
    }}>
      {count}
    </span>
  );
}

function UserMenu() {
  const { getNome, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nome = getNome();
  const iniciais = nome.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', background: open ? 'var(--bg3)' : 'transparent',
          border: '1px solid ' + (open ? 'var(--border)' : 'transparent'),
          borderRadius: '6px', padding: '9px 10px',
          cursor: 'pointer', transition: 'all 150ms ease',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'var(--accent-dim)', border: '1px solid rgba(245,166,35,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 13,
          color: 'var(--accent)',
        }}>
          {iniciais}
        </div>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nome}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <ChevronDown size={14} color="var(--text-dim)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '150ms', flexShrink: 0 }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
            background: 'var(--bg2)', border: '1px solid var(--border-light)',
            borderRadius: '10px', zIndex: 50, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Conectado como</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 3 }}>{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '11px 14px', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--danger)', fontSize: 13.5,
                fontWeight: 500, fontFamily: 'Barlow, sans-serif', transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-dim)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={15} />
              Sair do sistema
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <HardHat size={26} strokeWidth={2.5} />
        <div>
          <span className="logo-title">CONSTRUMAX</span>
          <span className="logo-sub">Gestão de Estoque</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-dim)', textTransform: 'uppercase', padding: '4px 4px 8px', marginTop: 4 }}>
          Menu Principal
        </div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={17} />
            <span style={{ flex: 1 }}>{label}</span>
            {label === 'Alertas' && <AlertaBadge />}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <UserMenu />
      </div>
    </aside>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const current = navItems.find(n =>
    location.pathname === n.to || (n.to !== '/' && location.pathname.startsWith(n.to))
  ) || navItems[0];

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16 }}>
            <current.icon size={20} color="var(--accent)" />
            <div>
              <h1 className="page-title" style={{ paddingBottom: 0 }}>{current.label}</h1>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{current.desc}</span>
            </div>
          </div>
        </div>
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/produtos" element={<PrivateRoute><Layout><Produtos /></Layout></PrivateRoute>} />
      <Route path="/movimentacoes" element={<PrivateRoute><Layout><Movimentacoes /></Layout></PrivateRoute>} />
      <Route path="/alertas" element={<PrivateRoute><Layout><Alertas /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
