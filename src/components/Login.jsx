import React, { useState } from 'react';
import { KeyRound, Mail, Loader2, Database, WifiOff, Settings, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getSupabase, getCachedSettingsSync, saveSettings, testSupabaseConnection } from '../utils/db';

export default function Login({ onLoginSuccess, onBypassOffline, onSettingsUpdated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isNetworkErr, setIsNetworkErr] = useState(false);

  // Database inline configuration states
  const [showDbConfig, setShowDbConfig] = useState(false);
  const settings = getCachedSettingsSync();
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [testingConn, setTestingConn] = useState(false);
  const [connResult, setConnResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setIsNetworkErr(false);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase database client is not configured. Update your Supabase URL in Database Settings below.');
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
      const rawMsg = err.message || '';
      if (rawMsg.toLowerCase().includes('failed to fetch') || rawMsg.toLowerCase().includes('fetch failed')) {
        setIsNetworkErr(true);
        setErrorMsg('Unable to connect to Supabase cloud database (Failed to fetch). The database URL may be paused, deleted, or unreachable.');
      } else {
        setErrorMsg(rawMsg || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setConnResult({ success: false, message: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }
    setTestingConn(true);
    setConnResult(null);
    const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setTestingConn(false);
    setConnResult(res);
  };

  const handleSaveDbSettings = async () => {
    const updated = {
      ...settings,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim()
    };
    await saveSettings(updated);
    if (onSettingsUpdated) onSettingsUpdated();
    alert('Supabase settings updated successfully! Retrying login connection...');
    setShowDbConfig(false);
    setErrorMsg('');
    setIsNetworkErr(false);
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
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
        maxWidth: '440px',
        background: '#FFFFFF',
        borderRadius: '0px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        borderTop: '5px solid #C9A96E',
        padding: '36px 30px',
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
        <div style={{ marginBottom: '24px' }}>
          <img 
            src="/login_logo.png" 
            alt="Meaven Logo" 
            style={{
              height: '48px',
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
            Commercial Glass Solutions
          </p>
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
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
            color: '#9B1C1C',
            padding: '12px 14px',
            fontSize: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#E02424', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ lineHeight: '1.4' }}>{errorMsg}</span>
            </div>

            {isNetworkErr && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowDbConfig(true)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: '#FFFFFF',
                    color: '#1B2B45',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Settings style={{ width: '12px', height: '12px' }} />
                  Fix DB URL
                </button>
                {onBypassOffline && (
                  <button
                    type="button"
                    onClick={onBypassOffline}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: '#1B2B45',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <WifiOff style={{ width: '12px', height: '12px' }} />
                    Use Offline Mode
                  </button>
                )}
              </div>
            )}
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
              marginTop: '4px'
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

        {/* Database Config Toggle */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowDbConfig(!showDbConfig)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'underline'
            }}
          >
            <Database style={{ width: '12px', height: '12px' }} />
            {showDbConfig ? 'Hide Database Settings' : 'Configure Cloud Database / Offline Mode'}
          </button>
        </div>

        {/* Inline Database Settings Drawer */}
        {showDbConfig && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#1B2B45', margin: '0 0 10px 0' }}>
              Cloud Database (Supabase) Configuration
            </h4>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                Supabase URL
              </label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  boxSizing: 'border-box',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                Anon Public Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOi..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  boxSizing: 'border-box',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {connResult && (
              <div style={{
                padding: '8px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                marginBottom: '12px',
                background: connResult.success ? '#ECFDF5' : '#FEF2F2',
                border: connResult.success ? '1px solid #A7F3D0' : '1px solid #FECACA',
                color: connResult.success ? '#065F46' : '#991B1B',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {connResult.success ? <CheckCircle2 style={{ width: '14px', height: '14px' }} /> : <AlertTriangle style={{ width: '14px', height: '14px' }} />}
                <span>{connResult.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConn}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    cursor: testingConn ? 'wait' : 'pointer'
                  }}
                >
                  {testingConn ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                  type="button"
                  onClick={handleSaveDbSettings}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: '#C9A96E',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Save & Retry
                </button>
              </div>

              {onBypassOffline && (
                <button
                  type="button"
                  onClick={onBypassOffline}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <WifiOff style={{ width: '13px', height: '13px' }} />
                  Continue in Local / Offline Mode
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '28px',
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
