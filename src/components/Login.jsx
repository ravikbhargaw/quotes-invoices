import React, { useState } from 'react';
import { KeyRound, Mail, Sparkles, Loader2 } from 'lucide-react';
import { getSupabase } from '../utils/db';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client is not configured yet. Set keys in settings.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        onLoginSuccess(data.session);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1B2B45 0%, #0F172A 100%)',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#FFFFFF',
        borderRadius: '0px', // Premium sharp design matching theme
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        borderTop: '5px solid #C9A96E', // Gold accent top bar
        padding: '40px 32px',
        textAlign: 'center',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(201, 169, 110, 0.05)',
          pointerEvents: 'none'
        }} />

        {/* Brand Header */}
        <div style={{ marginBottom: '28px' }}>
          <img 
            src="/login_logo.png" 
            alt="Meaven Logo" 
            style={{
              height: '50px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 8px'
            }}
          />
          <p style={{
            fontSize: '10px',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0',
            fontWeight: '600'
          }}>
            Commercial Glass solutions
          </p>
        </div>

        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1B2B45',
            margin: '0 0 6px 0',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}>
            Portal Access
          </h2>
          <p style={{ fontSize: '12.5px', color: '#666', margin: '0' }}>
            Log in to manage active quotes, invoices, and team registry.
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: '#FDF2F2',
            border: '1px solid #FDE8E8',
            color: '#E02424',
            padding: '10px 14px',
            fontSize: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontWeight: 'bold' }}>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email input group */}
          <div style={{ textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '9px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#1B2B45',
              marginBottom: '6px'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                width: '16px',
                height: '16px'
              }} />
              <input
                type="email"
                placeholder="ravi.bhargaw@meaven.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  boxSizing: 'border-box',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#1F2937',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1B2B45'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          {/* Password input group */}
          <div style={{ textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '9px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#1B2B45',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                width: '16px',
                height: '16px'
              }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  boxSizing: 'border-box',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#1F2937',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1B2B45'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1B2B45',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              transition: 'background 0.2s',
              marginTop: '10px'
            }}
            onMouseOver={(e) => { if (!loading) e.target.style.background = '#0F172A'; }}
            onMouseOut={(e) => { if (!loading) e.target.style.background = '#1B2B45'; }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                Authenticating...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          borderTop: '1px solid #F3F4F6',
          paddingTop: '16px',
          fontSize: '11px',
          color: '#9CA3AF',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>🛡️ SSL Secured Session</span>
        </div>
      </div>
    </div>
  );
}
