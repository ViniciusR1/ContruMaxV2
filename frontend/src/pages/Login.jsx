import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, supabase } from '../context/AuthContext';
import { HardHat, Mail, Lock, User, Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function Login() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', nome: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);

  // ✅ CORREÇÃO PRINCIPAL: redireciona para / quando o usuário logar
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const translateError = (msg) => {
    const map = {
      'Invalid login credentials':            'E-mail ou senha incorretos.',
      'Email not confirmed':                  'E-mail ainda não confirmado. Verifique sua caixa de entrada (e spam).',
      'User already registered':              'Este e-mail já está cadastrado. Tente fazer login.',
      'Password should be at least 6 characters': 'Senha deve ter no mínimo 6 caracteres.',
      'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
      'Email rate limit exceeded':            'Muitas tentativas. Aguarde alguns minutos.',
      'over_email_send_rate_limit':           'Muitas tentativas. Aguarde alguns minutos.',
      'signup_disabled':                      'Novos cadastros estão desabilitados no momento.',
      'For security purposes':                'Por segurança, aguarde antes de solicitar novamente.',
    };
    for (const [key, val] of Object.entries(map)) {
      if (msg?.includes(key)) return val;
    }
    return msg || 'Erro desconhecido. Tente novamente.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorType('');
    setSuccess('');

    if (!form.email || !form.password) { setError('Preencha e-mail e senha.'); return; }

    if (mode === 'register') {
      if (!form.nome)                             { setError('Informe seu nome.'); return; }
      if (form.password.length < 6)               { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
      if (form.password !== form.confirmPassword) { setError('As senhas não coincidem.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
        // ✅ O useEffect acima detecta a mudança de `user` e navega para /
      } else {
        await signUp(form.email, form.password, form.nome);
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.');
        setMode('login');
        setForm(f => ({ ...f, password: '', confirmPassword: '' }));
      }
    } catch (err) {
      const translated = translateError(err.message);
      setError(translated);
      if (err.message?.includes('Email not confirmed')) setErrorType('not_confirmed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!form.email) { setError('Digite seu e-mail para reenviar a confirmação.'); return; }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.email,
        options: { emailRedirectTo: window.location.origin + '/login' },
      });
      if (error) throw error;
      setSuccess('E-mail de confirmação reenviado! Verifique sua caixa de entrada e spam.');
      setError('');
      setErrorType('');
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decorativo */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, var(--accent) 40px, var(--accent) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, var(--accent) 40px, var(--accent) 41px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, left: -120, width: 400, height: 400, background: 'radial-gradient(circle, rgba(91,138,245,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', marginBottom: 16, color: 'var(--accent)' }}>
            <HardHat size={32} strokeWidth={2} />
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: 2, color: 'var(--text)' }}>
            CONSTRUMAX
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Sistema de Gestão de Estoque
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ border: '1px solid var(--border-light)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 24, background: 'var(--bg3)', borderRadius: '6px', padding: 4 }}>
            {[['login', 'Entrar'], ['register', 'Criar Conta']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setErrorType(''); setSuccess(''); }}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Barlow, sans-serif', fontSize: 13.5, fontWeight: 600, transition: 'all 150ms ease', background: mode === m ? 'var(--bg2)' : 'transparent', color: mode === m ? 'var(--text)' : 'var(--text-muted)', boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Erro */}
          {error && (
            <div style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', borderRadius: '6px', padding: '12px 14px', marginBottom: 16, color: 'var(--danger)', fontSize: 13.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
              {errorType === 'not_confirmed' && (
                <button onClick={handleResendConfirmation} disabled={resending}
                  style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--danger-border)', borderRadius: '6px', padding: '7px 12px', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontFamily: 'Barlow, sans-serif', fontWeight: 600, opacity: resending ? 0.6 : 1 }}>
                  <RefreshCw size={13} />
                  {resending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
                </button>
              )}
            </div>
          )}

          {/* Sucesso */}
          {success && (
            <div style={{ background: 'var(--success-dim)', border: '1px solid var(--success-border)', borderRadius: '6px', padding: '12px 14px', marginBottom: 16, color: 'var(--success)', fontSize: 13.5, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input className="input" style={{ paddingLeft: 36 }} placeholder="Seu nome" value={form.nome} onChange={e => set('nome', e.target.value)} autoComplete="name" />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input className="input" style={{ paddingLeft: 36 }} type="email" placeholder="seu@email.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input className="input" style={{ paddingLeft: 36, paddingRight: 40 }} type={showPass ? 'text' : 'password'} placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'} value={form.password} onChange={e => set('password', e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirmar senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input className="input" style={{ paddingLeft: 36 }} type={showPass ? 'text' : 'password'} placeholder="Repita a senha" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} autoComplete="new-password" />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4, fontSize: 15 }}>
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
