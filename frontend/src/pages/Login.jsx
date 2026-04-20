import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HardHat, Mail, Lock, User, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', nome: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email || !form.password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    if (mode === 'register') {
      if (!form.nome) { setError('Informe seu nome.'); return; }
      if (form.password.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
      if (form.password !== form.confirmPassword) { setError('As senhas não coincidem.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
      } else {
        await signUp(form.email, form.password, form.nome);
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.');
        setMode('login');
        setForm(f => ({ ...f, password: '', confirmPassword: '' }));
      }
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
        'User already registered': 'Este e-mail já está cadastrado.',
        'Password should be at least 6 characters': 'Senha deve ter no mínimo 6 caracteres.',
      };
      setError(msgs[err.message] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorativo */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, var(--accent) 40px, var(--accent) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, var(--accent) 40px, var(--accent) 41px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -120, right: -120,
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -120, left: -120,
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(91,138,245,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 16,
            background: 'var(--accent-dim)',
            border: '1px solid rgba(245,166,35,0.3)',
            marginBottom: 16,
            color: 'var(--accent)',
          }}>
            <HardHat size={32} strokeWidth={2} />
          </div>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 28, fontWeight: 800, letterSpacing: 2, color: 'var(--text)' }}>
            CONSTRUMAX
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Sistema de Gestão de Estoque
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ border: '1px solid var(--border-light)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 24, background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 4 }}>
            {[['login', 'Entrar'], ['register', 'Criar Conta']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius)',
                  cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 600,
                  transition: 'all 150ms ease',
                  background: mode === m ? 'var(--bg2)' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert-banner danger" style={{ marginBottom: 18 }}>
              <AlertTriangle size={15} />{error}
            </div>
          )}
          {success && (
            <div className="alert-banner success" style={{ marginBottom: 18 }}>
              <CheckCircle size={15} />{success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Seu nome"
                    value={form.nome}
                    onChange={e => set('nome', e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 36 }}
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirmar senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 36 }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4, fontSize: 15 }}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#000' }} /> Aguarde...</>
                : mode === 'login' ? 'Entrar no sistema' : 'Criar minha conta'
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-dim)' }}>
          ConstruMax © {new Date().getFullYear()} — Gestão de Materiais de Construção
        </p>
      </div>
    </div>
  );
}
