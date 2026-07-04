import React, { useState, useEffect } from 'react';
import { 
  Save, Database, Sparkles, FileText, ClipboardList, Trash2, Plus, 
  RotateCcw, AlertCircle, CheckCircle, WifiOff 
} from 'lucide-react';
import { testSupabaseConnection, syncLocalDataToCloud } from '../utils/db';

export default function Settings({ settings, onSaveSettings, currentUserEmail }) {
  const [activeTab, setActiveTab] = useState('supabase'); // 'supabase', 'gemini', 'products', 'defaults'
  const [localSettings, setLocalSettings] = useState({ ...settings });

  // Team Management states
  const [teamUsers, setTeamUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  // Connection states
  const [testingConnection, setTestingConnection] = useState(false);
  const [connStatus, setConnStatus] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    if (activeTab === 'team' && localSettings.supabaseUrl && localSettings.serviceRoleKey) {
      fetchTeamUsers();
    }
  }, [activeTab]);

  const fetchTeamUsers = async () => {
    setLoadingUsers(true);
    setTeamError('');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(localSettings.supabaseUrl, localSettings.serviceRoleKey, {
        auth: { persistSession: false }
      });
      const { data: { users }, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;
      setTeamUsers(users || []);
    } catch (e) {
      console.error(e);
      setTeamError('Failed to fetch team directory. Make sure your Service Role Key is correct.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      setTeamError('Please fill in both email and password.');
      return;
    }
    setCreatingUser(true);
    setTeamError('');
    setTeamSuccess('');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(localSettings.supabaseUrl, localSettings.serviceRoleKey, {
        auth: { persistSession: false }
      });
      const { data, error } = await adminClient.auth.admin.createUser({
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        email_confirm: true,
        user_metadata: {
          role: newUserRole,
          force_password_reset: true
        }
      });
      if (error) throw error;
      setTeamSuccess(`Account for ${newUserEmail} created successfully!`);
      setNewUserEmail('');
      setNewUserPassword('');
      fetchTeamUsers();
    } catch (e) {
      console.error(e);
      setTeamError(e.message || 'Failed to create user account.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete ${userEmail}'s access?`)) return;
    setTeamError('');
    setTeamSuccess('');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(localSettings.supabaseUrl, localSettings.serviceRoleKey, {
        auth: { persistSession: false }
      });
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) throw error;
      setTeamSuccess(`Account deleted successfully.`);
      fetchTeamUsers();
    } catch (e) {
      console.error(e);
      setTeamError(e.message || 'Failed to delete user account.');
    }
  };

  const handleSave = (newSettings = localSettings) => {
    onSaveSettings(newSettings);
    alert('Settings saved successfully!');
  };

  const handleTestConnection = async () => {
    const url = localSettings.supabaseUrl?.trim();
    const key = localSettings.supabaseAnonKey?.trim();

    if (!url || !key) {
      setConnStatus({ success: false, message: 'Please enter both Supabase URL and Anon Key' });
      return;
    }

    setTestingConnection(true);
    setConnStatus(null);
    const result = await testSupabaseConnection(url, key);
    setTestingConnection(false);
    setConnStatus(result);
  };

  const handleSyncData = async () => {
    if (!confirm('This will copy all your local quotes and clients to Supabase, then empty your browser storage. Do you want to proceed?')) {
      return;
    }
    setSyncStatus({ success: true, message: 'Syncing data to cloud...' });
    const result = await syncLocalDataToCloud();
    setSyncStatus(result);
    if (result.success) {
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  // Logo Upload handlers
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const updated = { ...localSettings, companyLogo: event.target.result };
        setLocalSettings(updated);
        handleSave(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    const updated = { ...localSettings, companyLogo: null };
    setLocalSettings(updated);
    handleSave(updated);
  };



  // Predefined Products helpers
  const handleAddProduct = () => {
    const newProduct = {
      name: 'New Glass Series',
      specs: 'Saint Gobain, 10mm, Clear',
      desc: 'Standard specifications glass product.',
      rate: 500,
      unit: 'sqft'
    };
    const updated = {
      ...localSettings,
      predefinedProducts: [...localSettings.predefinedProducts, newProduct]
    };
    setLocalSettings(updated);
  };

  const handleProductChange = (index, field, val) => {
    const list = [...localSettings.predefinedProducts];
    list[index][field] = val;
    setLocalSettings({ ...localSettings, predefinedProducts: list });
  };

  const handleDeleteProduct = (index) => {
    const list = localSettings.predefinedProducts.filter((_, i) => i !== index);
    setLocalSettings({ ...localSettings, predefinedProducts: list });
  };

  const handleInputChange = (field, val) => {
    setLocalSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleBankChange = (field, val) => {
    setLocalSettings(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: val
      }
    }));
  };

  const handleTextareaListChange = (field, textVal) => {
    const list = textVal.split('\n').filter(t => t.trim() !== '');
    setLocalSettings(prev => ({ ...prev, [field]: list }));
  };

  return (
    <div className="space-y-4 animate-fade-in no-print text-left">
      
      {/* Vertical Pill segmented control */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '10px 10px',
        borderBottom: '1px solid var(--border)'
      }}>
        {[
          { key: 'defaults', label: 'Defaults' },
          { key: 'gemini', label: 'AI Key' },
          { key: 'supabase', label: 'DB Cloud' },
          { key: 'products', label: 'Catalog' },
          ...(currentUserEmail === 'ravi.bhargaw@meaven.in' ? [{ key: 'team', label: 'Team Directory' }] : [])
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: activeTab === tab.key ? '600' : '400',
              padding: '9px 14px',
              textAlign: 'left',
              background: activeTab === tab.key ? 'var(--steel-pale)' : 'transparent',
              color: activeTab === tab.key ? 'var(--navy)' : 'var(--muted)',
              border: 'none',
              borderLeft: activeTab === tab.key ? '3px solid var(--navy)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div 
        className="bg-white border border-[var(--ui-border)] rounded-xl space-y-4"
        style={{ padding: '16px 14px', overflowY: 'auto' }}
      >
        
        {/* TAB 1: CLOUD DATABASE */}
        {activeTab === 'supabase' && (
          <div className="space-y-3.5">
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Supabase Configuration</h3>
              <p className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">Sync details between local storage and cloud database.</p>
            </div>

            <div className="form-group">
              <label className="input-label">Supabase URL</label>
              <input 
                type="text" 
                value={localSettings.supabaseUrl || ''} 
                onChange={(e) => handleInputChange('supabaseUrl', e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="input-field font-mono text-xs"
              />
            </div>

            <div className="form-group">
              <label className="input-label">Anon Public Key</label>
              <input 
                type="password" 
                value={localSettings.supabaseAnonKey || ''} 
                onChange={(e) => handleInputChange('supabaseAnonKey', e.target.value)}
                placeholder="eyJhbGciOi..."
                className="input-field font-mono text-xs"
              />
            </div>

            {currentUserEmail === 'ravi.bhargaw@meaven.in' && (
               <div className="form-group">
                 <label className="input-label">Service Role Key (Secret Admin Key)</label>
                 <input 
                   type="password" 
                   value={localSettings.serviceRoleKey || ''} 
                   onChange={(e) => handleInputChange('serviceRoleKey', e.target.value)}
                   placeholder="Paste Supabase service_role key here..."
                   className="input-field font-mono text-xs"
                 />
                 <span style={{ fontSize: '9px', color: 'var(--ui-text-muted)', display: 'block', marginTop: '4px' }}>
                   Used to manage team directory accounts. Never shared with other users.
                 </span>
               </div>
             )}

            {/* Test Connection Result */}
            {connStatus && (
              <div className={`p-2.5 rounded border text-[10.5px] flex items-start gap-1.5 ${
                connStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}>
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{connStatus.message}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="btn-outline flex-1 py-2 text-xs"
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              
              <button
                type="button"
                onClick={() => handleSave()}
                className="btn flex-1 py-2 text-xs"
              >
                Save DB Keys
              </button>
            </div>

            <div className="pt-3 border-t border-[var(--ui-border)] space-y-2">
              <label className="input-label">Data Sync Utility</label>
              <button
                type="button"
                onClick={handleSyncData}
                className="btn-outline w-full py-2 text-xs border-amber-500/20 text-amber-700 bg-amber-50 hover:bg-amber-100"
              >
                Sync Local Data to Cloud
              </button>
              
              {syncStatus && (
                <div className={`p-2 rounded text-[10px] text-center border ${
                  syncStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}>
                  {syncStatus.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI KEYS */}
        {activeTab === 'gemini' && (
          <div className="space-y-3.5">
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wide">AI Engine Keys</h3>
              <p className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">Configure API keys for different AI models.</p>
            </div>

            <div className="form-group">
              <label className="input-label">Gemini API Key</label>
              <input 
                type="password" 
                value={localSettings.geminiApiKey || ''} 
                onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                placeholder="AIzaSy..."
                className="input-field font-mono text-xs"
              />
            </div>

            <div className="form-group">
              <label className="input-label">OpenAI API Key</label>
              <input 
                type="password" 
                value={localSettings.openaiApiKey || ''} 
                onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                placeholder="sk-proj-..."
                className="input-field font-mono text-xs"
              />
            </div>

            <div className="form-group">
              <label className="input-label">Anthropic API Key</label>
              <input 
                type="password" 
                value={localSettings.anthropicApiKey || ''} 
                onChange={(e) => handleInputChange('anthropicApiKey', e.target.value)}
                placeholder="sk-ant-..."
                className="input-field font-mono text-xs"
              />
            </div>

            <div className="form-group">
              <label className="input-label">xAI API Key (Grok)</label>
              <input 
                type="password" 
                value={localSettings.xaiApiKey || ''} 
                onChange={(e) => handleInputChange('xaiApiKey', e.target.value)}
                placeholder="xai-..."
                className="input-field font-mono text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              className="btn py-2.5 text-xs font-semibold w-full"
            >
              Save API Keys
            </button>
          </div>
        )}

        {/* TAB 3: PREDEFINED CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Rates Catalog</h3>
                <p className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">Speed up line item inputs.</p>
              </div>
              <button
                type="button"
                onClick={handleAddProduct}
                className="text-[10px] font-bold text-[var(--ui-accent)] hover:underline"
              >
                + Add New
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {localSettings.predefinedProducts?.map((product, idx) => (
                <div key={idx} className="p-2.5 bg-zinc-50 border border-[var(--ui-border)] rounded-lg space-y-1.5 relative text-left">
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(idx)}
                    className="absolute top-2 right-2 p-1 text-rose-500 hover:bg-rose-100 rounded"
                  >
                    <Trash2 size={12} />
                  </button>

                  <div className="form-group mb-1">
                    <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Product Name</label>
                    <input 
                      type="text" 
                      value={product.name}
                      onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="form-group mb-0">
                      <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Rate (₹)</label>
                      <input 
                        type="number" 
                        value={product.rate}
                        onChange={(e) => handleProductChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                        className="input-field text-center font-mono"
                        style={{ padding: '4px 6px', fontSize: '11px' }}
                      />
                    </div>
                    <div className="form-group mb-0">
                      <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Unit</label>
                      <input 
                        type="text" 
                        value={product.unit}
                        onChange={(e) => handleProductChange(idx, 'unit', e.target.value)}
                        className="input-field text-center"
                        style={{ padding: '4px 6px', fontSize: '11px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group mb-0">
                    <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Specs (comma separated)</label>
                    <input 
                      type="text" 
                      value={product.specs}
                      onChange={(e) => handleProductChange(idx, 'specs', e.target.value)}
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              className="btn py-2.5 text-xs font-semibold"
            >
              Save Catalog Changes
            </button>
          </div>
        )}

        {/* TAB 4: DEFAULT DOCUMENT DATA */}
        {activeTab === 'defaults' && (
          <div className="space-y-4 text-left">
            {/* Logo Settings */}
            <div className="space-y-2">
              <label className="input-label">Company Logo</label>
              {localSettings.companyLogo ? (
                <div className="flex items-center gap-3 bg-zinc-50 p-2 border border-[var(--ui-border)] rounded-lg">
                  <img src={localSettings.companyLogo} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
                  <button 
                    type="button" 
                    onClick={handleResetLogo}
                    className="text-[10px] text-rose-600 hover:underline font-semibold"
                  >
                    Reset to Default SVG
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-zinc-50 p-2 border border-[var(--ui-border)] rounded-lg">
                  <span className="text-[10px] text-[var(--ui-text-muted)] font-medium">Using Default SVG Wordmark</span>
                  <label className="text-[10px] text-[var(--ui-accent)] hover:underline font-semibold cursor-pointer">
                    Upload Logo PNG/JPG
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Logo Size Slider */}
            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
              <label style={{ fontSize: '11.5px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                <span>Logo Size</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{localSettings.logoHeight || 40}px</span>
              </label>
              <input
                type="range"
                min={24}
                max={80}
                step={2}
                value={localSettings.logoHeight || 40}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const updated = { ...localSettings, logoHeight: val };
                  setLocalSettings(updated);
                  handleSave(updated);
                }}
                style={{ width: '100%', marginTop: '6px', accentColor: 'var(--navy)', cursor: 'pointer' }}
              />
            </div>



            {/* Bank details */}
            <div className="pt-2 border-t border-[var(--ui-border)] space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700">Bank Details &amp; GSTIN</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group mb-0">
                  <label className="input-label">Account Name</label>
                  <input 
                    type="text" 
                    value={localSettings.bankDetails.name}
                    onChange={(e) => handleBankChange('name', e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="input-label">Account Number</label>
                  <input 
                    type="text" 
                    value={localSettings.bankDetails.accountNo}
                    onChange={(e) => handleBankChange('accountNo', e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="form-group mb-0">
                  <label className="input-label">IFSC Code</label>
                  <input 
                    type="text" 
                    value={localSettings.bankDetails.ifsc}
                    onChange={(e) => handleBankChange('ifsc', e.target.value)}
                    className="input-field font-mono uppercase text-xs"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="input-label">Bank Name</label>
                  <input 
                    type="text" 
                    value={localSettings.bankDetails.bankName}
                    onChange={(e) => handleBankChange('bankName', e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Company GSTIN</label>
                <input 
                  type="text" 
                  value={localSettings.bankDetails.gstin}
                  onChange={(e) => handleBankChange('gstin', e.target.value)}
                  className="input-field font-mono uppercase text-xs"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Office Address</label>
                <textarea 
                  rows="2"
                  value={localSettings.bankDetails.address}
                  onChange={(e) => handleBankChange('address', e.target.value)}
                  className="input-field font-sans resize-none text-xs"
                />
              </div>
            </div>

            {/* Note defaults */}
            <div className="pt-2 border-t border-[var(--ui-border)] space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700">Default Document Notes</span>
              
              <div className="form-group">
                <label className="input-label">Default Notes List (Line separated)</label>
                <textarea 
                  rows="4"
                  value={localSettings.notes?.join('\n')}
                  onChange={(e) => handleTextareaListChange('notes', e.target.value)}
                  className="input-field font-sans resize-none text-xs h-20"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Default Terms List (Line separated)</label>
                <textarea 
                  rows="4"
                  value={localSettings.terms?.join('\n')}
                  onChange={(e) => handleTextareaListChange('terms', e.target.value)}
                  className="input-field font-sans resize-none text-xs h-20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              className="btn py-2.5 text-xs font-semibold w-full"
            >
              Save Defaults
            </button>
          </div>
        )}

        {activeTab === 'team' && currentUserEmail === 'ravi.bhargaw@meaven.in' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Team Directory Management</h3>
              <p className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">Manage portal credentials and access privileges for your team.</p>
            </div>

            {teamError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-100 text-rose-700 text-xs">
                {teamError}
              </div>
            )}

            {teamSuccess && (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs">
                {teamSuccess}
              </div>
            )}

            {/* Create User Form */}
            <form onSubmit={handleCreateUser} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
              <h4 className="text-[10.5px] font-bold text-zinc-700 uppercase">Create New Team Account</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="input-label text-[10px]">Email Address</label>
                  <input 
                    type="email" 
                    value={newUserEmail} 
                    onChange={(e) => setNewUserEmail(e.target.value)} 
                    placeholder="name@meaven.in" 
                    required 
                    className="input-field text-xs py-1.5"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label text-[10px]">Temporary Password</label>
                  <input 
                    type="text" 
                    value={newUserPassword} 
                    onChange={(e) => setNewUserPassword(e.target.value)} 
                    placeholder="Min 6 characters" 
                    required 
                    className="input-field text-xs py-1.5"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 font-semibold cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      value="user" 
                      checked={newUserRole === 'user'} 
                      onChange={() => setNewUserRole('user')} 
                      className="cursor-pointer"
                    />
                    Standard User
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 font-semibold cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      value="admin" 
                      checked={newUserRole === 'admin'} 
                      onChange={() => setNewUserRole('admin')} 
                      className="cursor-pointer"
                    />
                    Admin
                  </label>
                </div>
                <button 
                  type="submit" 
                  disabled={creatingUser} 
                  className="btn text-xs px-4 py-1.5"
                >
                  {creatingUser ? 'Registering...' : 'Create Account'}
                </button>
              </div>
            </form>

            {/* Users List */}
            <div className="space-y-2">
              <h4 className="text-[10.5px] font-bold text-zinc-700 uppercase">Active Accounts</h4>
              {loadingUsers ? (
                <p className="text-xs text-zinc-400">Loading directory list...</p>
              ) : teamUsers.length === 0 ? (
                <p className="text-xs text-zinc-400">No other team accounts found.</p>
              ) : (
                <div className="border border-zinc-200 divide-y divide-zinc-200 rounded-lg overflow-hidden bg-white">
                  {teamUsers.map((tu) => (
                    <div key={tu.id} className="p-3 flex items-center justify-between text-xs hover:bg-zinc-50">
                      <div>
                        <strong className="text-zinc-800">{tu.email}</strong>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            tu.user_metadata?.role === 'admin' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-zinc-100 border border-zinc-200 text-zinc-600'
                          }`}>
                            {tu.user_metadata?.role || 'user'}
                          </span>
                          {tu.user_metadata?.force_password_reset && (
                            <span className="text-[9px] bg-amber-50 border border-amber-100 text-amber-700 px-1 py-0.2 rounded font-medium">
                              Pending Reset
                            </span>
                          )}
                        </div>
                      </div>
                      {tu.email?.toLowerCase() !== 'ravi.bhargaw@meaven.in' && (
                        <button 
                          onClick={() => handleDeleteUser(tu.id, tu.email)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                          title="Revoke Access"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
