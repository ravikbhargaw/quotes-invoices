import { createClient } from '@supabase/supabase-js';

const SETTINGS_VERSION = 5;

const isUUID = (str) => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// Default settings object
const DEFAULT_SETTINGS = {
  _version: SETTINGS_VERSION,
  geminiApiKey: '',
  openaiApiKey: '',
  anthropicApiKey: '',
  xaiApiKey: '',
  selectedModel: 'gemini-2.5-flash',
  supabaseUrl: 'https://xleyhzqnuptxndzdqrae.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZXloenFudXB0eG5kemRxcmFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjM3MTMsImV4cCI6MjA5ODczOTcxM30.v8PGnenU6ND5dwAzPekcroRS9HXKMlP2YHKn8DkmIJE',
  companyLogo: null, // Base64 image
  bankDetails: {
    name: 'MEAVEN DESIGNS PRIVATE LIMITED',
    accountNo: '50200097556307',
    ifsc: 'HDFC0001756',
    bankName: 'HDFC Bank, Marathahalli',
    gstin: '29AAMCM4939R2ZA',
    address: 'Kadubeesanahalli, Bengaluru 560103'
  },
  paymentSchedule: [
    { pct: 60, milestone: 'Advance — on order confirmation' },
    { pct: 30, milestone: 'Before dispatch from factory' },
    { pct: 10, milestone: 'On installation completion' }
  ],
  timelineSteps: [
    'Site Measurement & Design Freeze: Day 1 (Post-Advance)',
    'Material Processing & Quality Check: Day 2-7',
    'On-Site Installation & Precision Alignment: Day 8-10',
    'Final Inspection & Handover: Day 10'
  ],
  notes: [
    "1 year free onsite service from day of project closure",
    "Total estimate value is inclusive of GST"
  ],
  terms: [
    "Toughened glass is custom-made — no changes post order",
    "Transport charged as per actuals",
    "Scaffolding & electricity to be arranged by client",
    "Price may vary if confirmation is delayed",
    "Meaven is not liable for damage after delivery/installation"
  ],
  predefinedProducts: [
    {
      name: 'Meaven Minimalist Fixed Partition Series',
      specs: 'Saint Gobain · 12mm, Toughened, Clear, Hardware: Ivory Channel',
      desc: 'High-transparency fixed glass system designed for maximum light flow and structural rigidity.',
      rate: 320,
      unit: 'sqft'
    },
    {
      name: 'Meaven Precision Swing Door System',
      specs: '12mm Toughened, Ozone Hardware, Hydraulic Soft-Close',
      desc: 'Frameless swing system with integrated hydraulic control for seamless transition and "soft-close" safety.',
      rate: 23000,
      unit: 'Units'
    },
    {
      name: 'Shower Enclosures — Sliding',
      specs: 'Saint Gobain · 8MM, Toughened, Clear, Hardware: Gold, No Profile Channels',
      desc: 'Premium sliding glass shower partition.',
      rate: 750,
      unit: 'sqft'
    },
    {
      name: 'Pergola Glass',
      specs: 'Saint Gobain · SCN-145, Toughened + Laminated, Clear',
      desc: '6MM + 1.5MM Laminated + 6MM composite build for pergola application',
      rate: 690,
      unit: 'sqft'
    },
    {
      name: 'Glass Railing — 304 Gold',
      specs: '12MM · Toughened, Grade 304 · Gold Finish, Clear, Installation Included',
      desc: 'Heavy duty railing system with premium gold-plated hardware panels.',
      rate: 900,
      unit: 'sqft'
    },
    {
      name: 'Transportation & Logistics',
      specs: 'Lumpsum',
      desc: 'Includes delivery to site, unloading at ground floor, and internal shifting.',
      rate: 5000,
      unit: 'lumpsum'
    }
  ]
};

let cachedSettings = null;

export function getCachedSettingsSync() {
  if (cachedSettings) return cachedSettings;
  try {
    const saved = localStorage.getItem('meaven_settings');
    if (!saved) {
      cachedSettings = DEFAULT_SETTINGS;
    } else {
      let parsed = JSON.parse(saved);
      // Filter out any "attached images" references permanently
      if (parsed.notes) {
        parsed.notes = parsed.notes.filter(note => !note.toLowerCase().includes('attached') && !note.toLowerCase().includes('image'));
      }
      if (parsed.terms) {
        parsed.terms = parsed.terms.filter(term => !term.toLowerCase().includes('attached') && !term.toLowerCase().includes('image'));
      }
      cachedSettings = { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    cachedSettings = DEFAULT_SETTINGS;
  }
  return cachedSettings;
}

const mapDbSettingsToApp = (db) => {
  if (!db) return DEFAULT_SETTINGS;
  const settings = getCachedSettingsSync();
  return {
    _version: db._version || SETTINGS_VERSION,
    geminiApiKey: db.gemini_api_key || '',
    openaiApiKey: db.openai_api_key || '',
    anthropicApiKey: db.anthropic_api_key || '',
    xaiApiKey: db.xai_api_key || '',
    selectedModel: db.selected_model || 'gemini-2.5-flash',
    supabaseUrl: settings.supabaseUrl || '',
    supabaseAnonKey: settings.supabaseAnonKey || '',
    companyLogo: db.company_logo || null,
    bankDetails: db.bank_details || DEFAULT_SETTINGS.bankDetails,
    paymentSchedule: db.payment_schedule || DEFAULT_SETTINGS.paymentSchedule,
    timelineSteps: db.timeline_steps || DEFAULT_SETTINGS.timelineSteps,
    notes: db.notes || DEFAULT_SETTINGS.notes,
    terms: db.terms || DEFAULT_SETTINGS.terms,
    predefinedProducts: db.predefined_products || DEFAULT_SETTINGS.predefinedProducts,
    logoHeight: db.logo_height || 45,
    serviceRoleKey: db.service_role_key || ''
  };
};

const mapAppSettingsToDb = (app) => {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    gemini_api_key: app.geminiApiKey || '',
    openai_api_key: app.openaiApiKey || '',
    anthropic_api_key: app.anthropicApiKey || '',
    xai_api_key: app.xaiApiKey || '',
    selected_model: app.selectedModel || 'gemini-2.5-flash',
    company_logo: app.companyLogo || null,
    bank_details: app.bankDetails || {},
    payment_schedule: app.paymentSchedule || [],
    timeline_steps: app.timelineSteps || [],
    notes: app.notes || [],
    terms: app.terms || [],
    predefined_products: app.predefinedProducts || [],
    logo_height: app.logoHeight || 45,
    service_role_key: app.serviceRoleKey || ''
  };
};

// Retrieve Settings
export async function getSettings() {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000000')
          .maybeSingle();
        if (!error && data) {
          const appSettings = mapDbSettingsToApp(data);
          cachedSettings = appSettings;
          localStorage.setItem('meaven_settings', JSON.stringify(appSettings));
          return appSettings;
        }
      }
    } catch (e) {
      console.error('Failed to load settings from Supabase, using local fallback', e);
    }
  }

  // Local Storage fallback
  try {
    const saved = localStorage.getItem('meaven_settings');
    if (!saved) {
      localStorage.setItem('meaven_settings', JSON.stringify(DEFAULT_SETTINGS));
      cachedSettings = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }
    let parsed = JSON.parse(saved);
    const storedVersion = parsed?._version || 0;
    if (storedVersion < SETTINGS_VERSION) {
      parsed = { ...DEFAULT_SETTINGS, ...parsed, _version: SETTINGS_VERSION };
      parsed.notes = [...DEFAULT_SETTINGS.notes];
      parsed.terms = [...DEFAULT_SETTINGS.terms];
      parsed.supabaseUrl = DEFAULT_SETTINGS.supabaseUrl;
      parsed.supabaseAnonKey = DEFAULT_SETTINGS.supabaseAnonKey;
      localStorage.setItem('meaven_settings', JSON.stringify(parsed));
    }
    if (parsed.notes) {
      parsed.notes = parsed.notes.filter(note => !note.toLowerCase().includes('attached') && !note.toLowerCase().includes('image'));
    }
    if (parsed.terms) {
      parsed.terms = parsed.terms.filter(term => !term.toLowerCase().includes('attached') && !term.toLowerCase().includes('image'));
    }
    const appSettings = { ...DEFAULT_SETTINGS, ...parsed };
    cachedSettings = appSettings;
    return appSettings;
  } catch (e) {
    console.error('Failed to read settings from localStorage', e);
    cachedSettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }
}

// Save Settings
export async function saveSettings(settings) {
  cachedSettings = settings;
  try {
    localStorage.setItem('meaven_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbPayload = mapAppSettingsToDb(settings);
        const { error } = await supabase
          .from('settings')
          .upsert(dbPayload);
        if (error) throw error;
      }
    } catch (e) {
      console.error('Failed to save settings to Supabase', e);
    }
  }
  return true;
}

// Get Supabase client
let supabaseInstance = null;
let lastSupabaseConfig = { url: '', key: '' };

export function getSupabase() {
  const settings = getCachedSettingsSync();
  const url = settings.supabaseUrl?.trim();
  const key = settings.supabaseAnonKey?.trim();

  if (!url || !key) {
    supabaseInstance = null;
    return null;
  }

  // Reuse instance if config hasn't changed
  if (supabaseInstance && lastSupabaseConfig.url === url && lastSupabaseConfig.key === key) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, key);
    lastSupabaseConfig = { url, key };
    return supabaseInstance;
  } catch (e) {
    console.error('Failed to initialize Supabase client', e);
    supabaseInstance = null;
    return null;
  }
}

// Test Supabase Connection
export async function testSupabaseConnection(url, key) {
  try {
    const client = createClient(url, key);
    const { data, error } = await client.from('quotes').select('id').limit(1);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { success: false, message: error.message };
  }
}

// --- CLIENTS DATA STORE ---

// Local Storage fallback for clients
function getLocalClients() {
  try {
    const saved = localStorage.getItem('meaven_clients');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function saveLocalClients(clients) {
  localStorage.setItem('meaven_clients', JSON.stringify(clients));
}

// Get Clients list
export async function getClients() {
  const localClients = getLocalClients();
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      const dbClients = data || [];
      const merged = [...dbClients];
      for (const lc of localClients) {
        if (!merged.some(mc => mc.id === lc.id || mc.name?.toLowerCase() === lc.name?.toLowerCase())) {
          merged.push(lc);
        }
      }
      return merged;
    } catch (e) {
      console.error('Failed to fetch clients from Supabase, falling back to local', e);
      return localClients;
    }
  }
  return localClients;
}

// Save Client (Create or Update)
export async function saveClient(client) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      if (client.id && isUUID(client.id)) { // UUID
        const { data, error } = await supabase
          .from('clients')
          .update(client)
          .eq('id', client.id)
          .select();
        if (error) throw error;
        return data[0];
      } else {
        const { id, ...newClient } = client; // Let Supabase gen UUID
        const { data, error } = await supabase
          .from('clients')
          .insert(newClient)
          .select();
        if (error) throw error;
        return data[0];
      }
    } catch (e) {
      console.error('Failed to save client to Supabase, falling back to local', e);
    }
  }

  // Local storage fallback
  const clients = getLocalClients();
  if (client.id) {
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx !== -1) {
      clients[idx] = { ...client, updated_at: new Date().toISOString() };
    } else {
      clients.push(client);
    }
  } else {
    client.id = 'client_' + Math.random().toString(36).substr(2, 9);
    client.created_at = new Date().toISOString();
    client.updated_at = new Date().toISOString();
    clients.push(client);
  }
  saveLocalClients(clients);
  return client;
}

// Delete Client
export async function deleteClient(id) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Failed to delete client from Supabase', e);
    }
  }
  const clients = getLocalClients();
  const filtered = clients.filter(c => c.id !== id);
  saveLocalClients(filtered);
  return true;
}

// --- QUOTES DATA STORE ---

const normalizeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split('\n').filter(Boolean);
  return [];
};

// Local Storage fallback for quotes
function getLocalQuotes() {
  try {
    const saved = localStorage.getItem('meaven_quotes');
    const quotes = saved ? JSON.parse(saved) : [];
    return quotes.map(q => {
      const cleanTerms = normalizeArray(q.terms).filter(term => !term.toLowerCase().includes('attached') && !term.toLowerCase().includes('image'));
      const cleanNotes = normalizeArray(q.notes).filter(note => !note.toLowerCase().includes('attached') && !note.toLowerCase().includes('image'));
      return {
        ...q,
        terms: cleanTerms.length > 0 ? cleanTerms : [...DEFAULT_SETTINGS.terms],
        notes: cleanNotes.length > 0 ? cleanNotes : [...DEFAULT_SETTINGS.notes],
        items: normalizeArray(q.items),
        payment_schedule: normalizeArray(q.payment_schedule || q.paymentSchedule).length > 0 ? normalizeArray(q.payment_schedule || q.paymentSchedule) : [...DEFAULT_SETTINGS.paymentSchedule],
        timeline_steps: normalizeArray(q.timeline_steps || q.timelineSteps).length > 0 ? normalizeArray(q.timeline_steps || q.timelineSteps) : [...DEFAULT_SETTINGS.timelineSteps]
      };
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}

function saveLocalQuotes(quotes) {
  localStorage.setItem('meaven_quotes', JSON.stringify(quotes));
}

// Get Quotes list
export async function getQuotes() {
  const localQuotes = getLocalQuotes();
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const dbQuotes = data || [];
      const normalizedDb = dbQuotes.map(q => {
        const cleanTerms = normalizeArray(q.terms).filter(term => !term.toLowerCase().includes('attached') && !term.toLowerCase().includes('image'));
        const cleanNotes = normalizeArray(q.notes).filter(note => !note.toLowerCase().includes('attached') && !note.toLowerCase().includes('image'));
        return {
          ...q,
          terms: cleanTerms.length > 0 ? cleanTerms : [...DEFAULT_SETTINGS.terms],
          notes: cleanNotes.length > 0 ? cleanNotes : [...DEFAULT_SETTINGS.notes],
          items: normalizeArray(q.items),
          payment_schedule: normalizeArray(q.payment_schedule || q.paymentSchedule).length > 0 ? normalizeArray(q.payment_schedule || q.paymentSchedule) : [...DEFAULT_SETTINGS.paymentSchedule],
          timeline_steps: normalizeArray(q.timeline_steps || q.timelineSteps).length > 0 ? normalizeArray(q.timeline_steps || q.timelineSteps) : [...DEFAULT_SETTINGS.timelineSteps]
        };
      });

      const merged = [...normalizedDb];
      for (const lq of localQuotes) {
        if (!merged.some(mq => mq.id === lq.id || mq.quote_number === lq.quote_number)) {
          merged.push(lq);
        }
      }
      return merged;
    } catch (e) {
      console.error('Failed to fetch quotes from Supabase, falling back to local', e);
      return localQuotes;
    }
  }
  return localQuotes;
}

// Save Quote (Create or Update)
export async function saveQuote(quote) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      let data, error;
      if (quote.id && isUUID(quote.id)) { // UUID
        const res = await supabase
          .from('quotes')
          .update(quote)
          .eq('id', quote.id)
          .select();
        data = res.data;
        error = res.error;
      } else {
        const { id, ...newQuote } = quote; // Let Supabase gen UUID
        const res = await supabase
          .from('quotes')
          .insert(newQuote)
          .select();
        data = res.data;
        error = res.error;
      }

      if (error) {
        // If save failed because of a missing column, strip non-DB fields and retry
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          console.warn('Supabase save failed due to missing column schema mismatch, retrying with sanitized quote...', error);
          const { quote_discount_pct, quoteDiscountPct, ...sanitized } = quote;
          
          if (quote.id && isUUID(quote.id)) {
            const retryRes = await supabase
              .from('quotes')
              .update(sanitized)
              .eq('id', quote.id)
              .select();
            if (retryRes.error) throw retryRes.error;
            return retryRes.data[0];
          } else {
            const { id, ...sanitizedNew } = sanitized;
            const retryRes = await supabase
              .from('quotes')
              .insert(sanitizedNew)
              .select();
            if (retryRes.error) throw retryRes.error;
            return retryRes.data[0];
          }
        }
        throw error;
      }
      return data[0];
    } catch (e) {
      console.error('Failed to save quote to Supabase, falling back to local', e);
    }
  }

  // Local storage fallback
  const quotes = getLocalQuotes();
  if (quote.id) {
    const idx = quotes.findIndex(q => q.id === quote.id);
    if (idx !== -1) {
      quotes[idx] = { ...quote, updated_at: new Date().toISOString() };
    } else {
      quotes.push(quote);
    }
  } else {
    quote.id = 'quote_' + Math.random().toString(36).substr(2, 9);
    quote.created_at = new Date().toISOString();
    quote.updated_at = new Date().toISOString();
    quotes.push(quote);
  }
  saveLocalQuotes(quotes);
  return quote;
}

// Delete Quote
export async function deleteQuote(id) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Failed to delete quote from Supabase', e);
    }
  }
  const quotes = getLocalQuotes();
  const filtered = quotes.filter(q => q.id !== id);
  saveLocalQuotes(filtered);
  return true;
}

// Sync Local Data to Cloud
export async function syncLocalDataToCloud() {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'Supabase is not connected' };

  try {
    const localClients = getLocalClients();
    const localQuotes = getLocalQuotes();

    let clientMapping = {}; // local_id -> supabase_uuid

    // Sync Clients
    for (const c of localClients) {
      const { id, created_at, updated_at, ...cleanClient } = c;
      const { data, error } = await supabase.from('clients').insert(cleanClient).select();
      if (error) throw error;
      if (data && data[0]) {
        clientMapping[id] = data[0].id;
      }
    }

    // Sync Quotes
    for (const q of localQuotes) {
      const { id, created_at, updated_at, ...cleanQuote } = q;
      // Map local client_id to supabase uuid
      if (cleanQuote.client_id && clientMapping[cleanQuote.client_id]) {
        cleanQuote.client_id = clientMapping[cleanQuote.client_id];
      } else {
        cleanQuote.client_id = null;
      }
      let { error } = await supabase.from('quotes').insert(cleanQuote);
      if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
        console.warn('Sync insert failed due to missing column schema mismatch, retrying with sanitized quote...');
        const { quote_discount_pct, quoteDiscountPct, ...sanitized } = cleanQuote;
        const retryRes = await supabase.from('quotes').insert(sanitized);
        error = retryRes.error;
      }
      if (error) throw error;
    }

    // Clear local lists
    saveLocalClients([]);
    saveLocalQuotes([]);

    return { success: true, message: `Synced ${localClients.length} clients and ${localQuotes.length} quotes.` };
  } catch (e) {
    console.error('Sync failed:', e);
    return { success: false, message: e.message };
  }
}
