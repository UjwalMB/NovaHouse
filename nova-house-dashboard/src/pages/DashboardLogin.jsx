import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { loginDashboard } from '../services/authService';

export default function DashboardLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('analyst@novahouse.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide executive credentials.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await loginDashboard(email.trim(), password.trim());
      setLoading(false);
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const setDemoRole = (roleEmail) => {
    setEmail(roleEmail);
  };

  return (
    <div className="dashboard-login-page">
      <div className="login-glass-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '4px',
            background: 'var(--gold-subtle)',
            border: '1px solid var(--gold-border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-primary)',
            marginBottom: '16px'
          }}>
            <Shield size={22} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', letterSpacing: '0.18em', color: '#FFFFFF', fontWeight: 500 }}>
            NOVA HOUSE
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', color: 'var(--gold-primary)', textTransform: 'uppercase', marginTop: '4px' }}>
            Executive Business Intelligence
          </p>
        </div>

        {/* Demo Quick Select */}
        <div style={{
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-light)',
          borderRadius: '4px',
          marginBottom: '22px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Sparkles size={12} style={{ color: 'var(--gold-primary)' }} />
            <span>Select Executive Persona:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setDemoRole('analyst@novahouse.com')}
              style={{
                padding: '4px 8px',
                background: email.includes('analyst') ? 'var(--gold-subtle)' : 'transparent',
                border: '1px solid var(--border-light)',
                color: email.includes('analyst') ? 'var(--gold-light)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Revenue Analyst
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('admin@novahouse.com')}
              style={{
                padding: '4px 8px',
                background: email.includes('admin') ? 'var(--gold-subtle)' : 'transparent',
                border: '1px solid var(--border-light)',
                color: email.includes('admin') ? 'var(--gold-light)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Executive GM
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('manager@novahouse.example')}
              style={{
                padding: '4px 8px',
                background: email.includes('manager') ? 'var(--gold-subtle)' : 'transparent',
                border: '1px solid var(--border-light)',
                color: email.includes('manager') ? 'var(--gold-light)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Hotel Manager
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--metric-danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Corporate Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-primary)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="analyst@novahouse.com"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Access Key
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-primary)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-luxury"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}
          >
            <span>{loading ? 'Authenticating...' : 'Access Intelligence Dashboard'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a
            href={import.meta.env.VITE_ADMIN_URL || "http://127.0.0.1:5174"}
            style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'underline' }}
          >
            Switch to Operations Admin Portal →
          </a>
        </div>
      </div>
    </div>
  );
}
