import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Sparkles } from 'lucide-react';
import { loginStaff } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@novahouse.example');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide authorized staff email and credentials.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await loginStaff(email.trim(), password.trim());
      setLoading(false);
      navigate('/admin');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleFillDemo = () => {
    setEmail('manager@novahouse.example');
  };

  return (
    <div className="login-page-container">
      {/* Left Column: Atmospheric Luxury Editorial Imagery (Desktop 55%) */}
      <div className="login-image-column">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=90"
          alt="NOVA HOUSE Architectural Facade"
        />
        <div className="login-image-scrim" />

        {/* Top Logo Watermark */}
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="font-serif text-2xl tracking-[0.25em] text-[#FFFFFF] font-light">
              NOVA HOUSE
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#A58A5C] block mt-1 font-medium">
              BENGALURU · INDIA
            </span>
          </div>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-xs border border-white/20 font-mono text-[10px] uppercase tracking-widest text-[#D8D0C3]">
            Owner & Operations Portal
          </span>
        </div>

        {/* Bottom Quotation */}
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#A58A5C] block font-medium">
            "A Place to Pause."
          </span>
          <p className="font-serif text-3xl font-light text-[#FFFFFF] leading-snug">
            Precision control over guest sanctuaries, dynamic inventory, and architectural hospitality.
          </p>
          <div className="flex items-center gap-4 font-mono text-xs text-[#D8D0C3]/70 pt-2">
            <span>Richmond Town</span>
            <span className="text-[#A58A5C]">·</span>
            <span>Central Bengaluru</span>
            <span className="text-[#A58A5C]">·</span>
            <span>24 Sanctuary Keys</span>
          </div>
        </div>
      </div>

      {/* Right Column: Sleek Luxury Login Form (Desktop 45%) */}
      <div className="login-form-column">
        <div className="login-form-card">
          {/* Form Header */}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#A58A5C] block mb-2 font-medium">
              Administrative Gateway
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light uppercase tracking-tight text-[#FFFFFF]">
              Nova House
            </h2>
            <p className="font-mono text-xs text-[#A39F97] uppercase tracking-widest mt-1">
              Admin & Operations Suite
            </p>
          </div>

          {/* Quick Demo Pre-fill Badge */}
          <div className="p-3 bg-[#1D1D1D] border border-white/10 rounded-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#D8D0C3]">
              <Sparkles size={14} className="text-[#A58A5C]" />
              <span className="font-mono text-[11px]">Demo: Hotel Manager</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono text-[#A58A5C] hover:text-[#FFFFFF] underline transition-colors cursor-pointer"
            >
              Auto-Fill
            </button>
          </div>

          {error && (
            <div className="p-3 bg-[#962828]/20 border border-[#962828]/40 text-[#F7C6C6] rounded-xs text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#D8D0C3]">
                  Work Email
                </label>
                <span className="text-[10px] font-mono text-[#A58A5C]">Authorized Staff</span>
              </div>
              <div className="relative flex items-center">
                <Mail size={15} className="absolute left-3.5 text-[#A58A5C] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="manager@novahouse.example"
                  className="login-dark-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#D8D0C3]">
                  Security Key / Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions dispatched to registered management email.');
                  }}
                  className="text-[10px] font-mono text-[#A58A5C] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-[#A58A5C] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter key"
                  className="login-dark-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#77736C] hover:text-[#FFFFFF] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs font-mono text-[#D8D0C3]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#A58A5C] rounded-xs cursor-pointer"
                />
                <span className="text-[11px] text-[#A39F97]">Remember this terminal session</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="login-submit-btn"
              >
                <span>{loading ? 'Authenticating Terminal...' : 'Access Admin Portal'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="p-3.5 bg-[#1A1A1A] border border-white/10 rounded-xs flex items-center gap-3 text-[11px] text-[#A39F97] font-mono">
            <ShieldCheck size={16} className="text-[#A58A5C] shrink-0" />
            <span>
              Restricted executive system. Session activities are cryptographically signed and logged.
            </span>
          </div>

          <div className="text-center pt-2">
            <a
              href={import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'http://127.0.0.1:5173'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#A58A5C] hover:text-[#FFFFFF] underline transition-colors"
            >
              ← Return to Public Hotel Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
