import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, FileText, History, Users, Settings as SettingsIcon, 
  Plus, Printer, Save, Database, Trash2, Copy, Trash, ArrowRight,
  TrendingUp, Clock, CheckCircle, ChevronUp, ChevronDown, LogOut
} from 'lucide-react';
import { 
  getQuotes, saveQuote, deleteQuote, 
  getClients, saveClient, deleteClient, 
  getSettings, saveSettings, getSupabase,
  getCachedSettingsSync, syncLocalDataToCloud
} from './utils/db';
import DocumentPreview from './components/DocumentPreview';
import Clients from './components/Clients';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
const getNextSeqQuoteNumber = (quotesList) => {
  const prefix = 'MEA';
  const currentYear = new Date().getFullYear();
  const yearStr = String(currentYear);
  
  // Filter quotes that match the current year and the prefix (e.g., MEA-2026-XXXX)
  const regex = new RegExp(`^${prefix}-${yearStr}-(\\d{4})$`);
  let maxSeq = 0;
  
  if (Array.isArray(quotesList)) {
    for (const q of quotesList) {
      const qNum = q.quote_number || q.estimate_no || '';
      const match = qNum.match(regex);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }
  
  const nextSeq = maxSeq + 1;
  return `${prefix}-${yearStr}-${String(nextSeq).padStart(4, '0')}`;
};

const GEMINI_SYSTEM_PROMPT = `You are a structured quote parser for meaven.in, a premium commercial glass and aluminium solutions company based in Bangalore.

Read the raw input text and output ONLY a valid JSON object with this exact schema. No explanation, no markdown, no preamble.

{
  "client_name": "",
  "gstin": "",
  "quote_number": "",
  "date": "today's date in DD MMM YYYY",
  "validity": "15 Days",
  "reference": "",
  "format": "estimate",
  "adjustment": 0,
  "quote_discount_pct": 0,
  "items": [
    {
      "name": "",
      "specs": [],
      "desc": "",
      "client_spec": "",
      "our_offer": "",
      "hardware": "",
      "qty": 0,
      "unit": "sqft",
      "rate": 0,
      "discount": 0,
      "sizes": []
    }
  ],
  "payment_schedule": [
    { "pct": 50, "milestone": "Advance on order confirmation" },
    { "pct": 45, "milestone": "Before material is dispatched from factory" },
    { "pct": 5,  "milestone": "On day of work completion" }
  ],
  "notes": [],
  "terms": []
}

Rules:
- If the user specifies a comparison (what client asked vs what you are offering), populate client_spec and our_offer per item. Otherwise leave them empty.
- Default payment_schedule to the 50/45/5 split unless the user specifies otherwise.
- If no GST is mentioned, do not add it — leave it for the UI to calculate.
- Extract sizes as formatted strings like "1200 × 2400 mm".
- Specs should be short tags like "Saint Gobain · 10MM", "Toughened", "Clear Glass".
- If the user mentions a discount on an item, set that item's discount field. If it's an overall discount, set quote_discount_pct.
- date should always be today's real date.
- If the input mentions "glass partition", "frameless", "shower", "railing", or "pergola", 
  automatically populate relevant specs tags even if the user didn't specify them explicitly. 
  Example: "frameless glass partition" → specs: ["Frameless", "Toughened", "Clear Glass"].`;

export default function App() {
  const [activeTab, setActiveTab] = useState('form'); // 'ai', 'form', 'history', 'clients', 'settings'
  const [isDirty, setIsDirty] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState(getCachedSettingsSync());
  const [dbConnected, setDbConnected] = useState(false);
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoadingSession(false);
      });

      // Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoadingSession(false);
    }
  }, [settings]);

  const navigateToTab = (newTab) => {
    if (activeTab === 'form' && newTab !== 'form' && isDirty) {
      const confirmLeave = window.confirm("You have unsaved changes in your active quote. If you leave, you will lose your unsaved edits. Are you sure you want to proceed?");
      if (!confirmLeave) return;
    }
    setActiveTab(newTab);
    if (newTab === 'history') {
      if (quotes && quotes.length > 0) {
        const sorted = [...quotes].sort((a, b) => {
          const getVal = (val) => {
            if (!val) return 0;
            const parsed = new Date(val).getTime();
            return isNaN(parsed) ? 0 : parsed;
          };
          const timeA = getVal(a.updated_at) || getVal(a.created_at) || getVal(a.date);
          const timeB = getVal(b.updated_at) || getVal(b.created_at) || getVal(b.date);
          return timeB - timeA;
        });
        setPreviewQuote(sorted[0]);
      } else {
        setPreviewQuote(null);
      }
    } else {
      setPreviewQuote(null);
    }
  };

  const handleForcePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    setResetError('');

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { force_password_reset: false }
      });
      if (error) throw error;
      alert('Password updated successfully! Welcome to the portal.');
      
      // Refresh session
      const { data: { session: updatedSession } } = await supabase.auth.getSession();
      setSession(updatedSession);
    } catch (err) {
      console.error(err);
      setResetError(err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const user = session?.user;
  const userMetadata = user?.user_metadata || {};
  const userRole = userMetadata.role || 'user';
  const userEmail = user?.email?.toLowerCase() || '';
  const isAdmin = !dbConnected || userEmail === 'ravi.bhargaw@meaven.in' || userRole === 'admin';
  const forcePasswordReset = userMetadata.force_password_reset === true;

  // Active Quote State
  const [activeQuote, setActiveQuote] = useState({
    quote_number: 'MEA-' + new Date().getFullYear() + '-0001',
    client_name: '',
    gstin: '',
    date: new Date().toISOString().split('T')[0],
    validity: '15 Days',
    reference: '',
    status: 'Draft',
    format: 'proposal',
    items: [],
    payment_schedule: [...settings.paymentSchedule],
    timeline_steps: [...settings.timelineSteps],
    notes: [...settings.notes],
    terms: [...settings.terms],
    adjustment: 0,
    subtotal: 0,
    tax: 0,
    total: 0
  });

  // State for previewing historical quotes in the log
  const [previewQuote, setPreviewQuote] = useState(null);

  // State for AI Prompt Pane
  const [aiPrompt, setAiPrompt] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [parsedAIResult, setParsedAIResult] = useState(null);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [newQuoteOption, setNewQuoteOption] = useState('ai');
  const [showFormAiPrompt, setShowFormAiPrompt] = useState(false);
  const [loadingFormAI, setLoadingFormAI] = useState(false);
  const [showPrintTip, setShowPrintTip] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // State for Form line items sizes input
  const [sizeW, setSizeW] = useState('');
  const [sizeH, setSizeH] = useState('');
  const [sizeUnit, setSizeUnit] = useState('mm');
  const [activeSizeItemIdx, setActiveSizeItemIdx] = useState(null);

  // Load Initial Data
  const loadData = async () => {
    const loadedSettings = await getSettings();
    setSettings(loadedSettings);
    
    const supabase = getSupabase();
    const isConn = !!supabase;
    setDbConnected(isConn);

    if (isConn) {
      try {
        const localQuotes = JSON.parse(localStorage.getItem('meaven_quotes') || '[]');
        const localClients = JSON.parse(localStorage.getItem('meaven_clients') || '[]');
        if (localQuotes.length > 0 || localClients.length > 0) {
          console.log(`Auto-syncing ${localQuotes.length} local quotes and ${localClients.length} local clients...`);
          const syncRes = await syncLocalDataToCloud();
          if (syncRes && !syncRes.success) {
            alert(syncRes.message);
          }
        }
      } catch (err) {
        console.error('Auto-sync failed:', err);
      }
    }

    const loadedQuotes = await getQuotes();
    setQuotes(loadedQuotes);

    const loadedClients = await getClients();
    setClients(loadedClients);
  };

  const handleDuplicateQuote = async (quoteToDup) => {
    const nextNum = getNextSeqQuoteNumber(quotes);
    const dup = {
      ...quoteToDup,
      id: undefined,
      quote_number: nextNum,
      date: new Date().toISOString().split('T')[0]
    };
    await saveQuote(dup);
    alert('Quote duplicated successfully!');
    loadData();
  };

  const handleDeleteQuote = async (id) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      await deleteQuote(id);
      if (previewQuote && previewQuote.id === id) {
        setPreviewQuote(null);
      }
      loadData();
    }
  };

  const handleToggleQuoteStatus = async (quoteToToggle, newStatus) => {
    const nextStatus = newStatus || (quoteToToggle.status === 'Finalised' ? 'Draft' : 'Finalised');
    const updated = { ...quoteToToggle, status: nextStatus };
    await saveQuote(updated);
    if (previewQuote && previewQuote.id === quoteToToggle.id) {
      setPreviewQuote(updated);
    }
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update active quote totals when items, adjustment, or discount change
  useEffect(() => {
    const items = activeQuote.items || [];
    const grossSubtotal = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)), 0);
    
    const totalItemDiscounts = items.reduce((sum, item) => {
      const discountPct = parseFloat(item.discount) || 0;
      if (discountPct > 0) {
        return sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0) * (discountPct / 100));
      }
      return sum;
    }, 0);

    const subtotalAfterItemDiscounts = grossSubtotal - totalItemDiscounts;
    
    const quoteDiscountPct = parseFloat(activeQuote.quote_discount_pct) || parseFloat(activeQuote.quoteDiscountPct) || 0;
    const quoteDiscountAmount = subtotalAfterItemDiscounts * (quoteDiscountPct / 100);
    
    const adjustedSubtotal = subtotalAfterItemDiscounts - quoteDiscountAmount;
    const flatAdjustment = parseFloat(activeQuote.adjustment) || 0;
    const taxableAmount = adjustedSubtotal + flatAdjustment;
    
    const taxAmount = taxableAmount * 0.18;
    const grandTotal = taxableAmount + taxAmount;

    setActiveQuote(prev => ({
      ...prev,
      subtotal: adjustedSubtotal,
      tax: taxAmount,
      total: grandTotal
    }));
  }, [
    activeQuote.items, 
    activeQuote.adjustment, 
    activeQuote.format, 
    activeQuote.quote_discount_pct, 
    activeQuote.quoteDiscountPct
  ]);

  // Active Quote Field Changer
  const updateQuoteField = (field, val) => {
    if (previewQuote) {
      setPreviewQuote(prev => ({ ...prev, [field]: val }));
    } else {
      setActiveQuote(prev => ({ ...prev, [field]: val }));
      setIsDirty(true);
    }
  };

  // Saved client dropdown selection handler
  const handleClientSelect = (clientId) => {
    if (!clientId) return;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setActiveQuote(prev => ({
        ...prev,
        client_name: client.name,
        gstin: client.gstin || ''
      }));
      setIsDirty(true);
    }
  };

  // Line Item Handlers
  const handleAddItem = (predefinedProduct = null) => {
    const newItem = predefinedProduct 
      ? {
          name: predefinedProduct.name,
          specs: predefinedProduct.specs.split(',').map(s => s.trim()).filter(s => s),
          desc: predefinedProduct.desc,
          qty: 1,
          unit: predefinedProduct.unit,
          rate: predefinedProduct.rate,
          sizes: [],
          hardware: ''
        }
      : {
          name: 'New Custom Glass Item',
          specs: ['10mm Toughened'],
          desc: 'Custom glass installation description.',
          qty: 10,
          unit: 'sqft',
          rate: 500,
          sizes: [],
          hardware: ''
        };
    
    setActiveQuote(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
    setIsDirty(true);
  };

  const handleUpdateItem = (index, field, val) => {
    const list = [...activeQuote.items];
    list[index][field] = val;
    setActiveQuote(prev => ({ ...prev, items: list }));
    setIsDirty(true);
  };

  const handleUpdateItemSpecs = (index, commaString) => {
    const list = [...activeQuote.items];
    list[index].specs = commaString.split(',').map(s => s.trim()).filter(s => s);
    setActiveQuote(prev => ({ ...prev, items: list }));
    setIsDirty(true);
  };

  const handleRemoveItem = (index) => {
    const list = activeQuote.items.filter((_, idx) => idx !== index);
    setActiveQuote(prev => ({ ...prev, items: list }));
    setIsDirty(true);
  };

  const handleMoveItem = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeQuote.items.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const list = [...activeQuote.items];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setActiveQuote(prev => ({ ...prev, items: list }));
    setIsDirty(true);
  };

  const handleAddSizeToItem = (idx) => {
    if (!sizeW || !sizeH) return;
    const list = [...activeQuote.items];
    const sizeTag = `${sizeW} × ${sizeH} ${sizeUnit}`;
    list[idx].sizes = [...(list[idx].sizes || []), sizeTag];
    setActiveQuote(prev => ({ ...prev, items: list }));
    setSizeW('');
    setSizeH('');
    setActiveSizeItemIdx(null);
    setIsDirty(true);
  };

  const handleRemoveSizeFromItem = (itemIdx, sizeIdx) => {
    const list = [...activeQuote.items];
    list[itemIdx].sizes = list[itemIdx].sizes.filter((_, idx) => idx !== sizeIdx);
    setActiveQuote(prev => ({ ...prev, items: list }));
    setIsDirty(true);
  };

  // Payment Schedule handlers
  const handleMilestoneChange = (index, field, val) => {
    const list = [...activeQuote.payment_schedule];
    list[index][field] = field === 'pct' ? (parseFloat(val) || 0) : val;
    setActiveQuote(prev => ({ ...prev, payment_schedule: list }));
    setIsDirty(true);
  };

  const handleAddMilestone = () => {
    setActiveQuote(prev => ({
      ...prev,
      payment_schedule: [...(prev.payment_schedule || []), { pct: 10, milestone: 'On day of delivery' }]
    }));
    setIsDirty(true);
  };

  const handleRemoveMilestone = (index) => {
    setActiveQuote(prev => ({
      ...prev,
      payment_schedule: prev.payment_schedule.filter((_, idx) => idx !== index)
    }));
    setIsDirty(true);
  };

  // Timeline handlers
  const handleTimelineChange = (index, val) => {
    const list = [...activeQuote.timeline_steps];
    list[index] = val;
    setActiveQuote(prev => ({ ...prev, timeline_steps: list }));
    setIsDirty(true);
  };

  const handleAddTimelineStep = () => {
    setActiveQuote(prev => ({
      ...prev,
      timeline_steps: [...(prev.timeline_steps || []), 'Processing stage: Day X']
    }));
    setIsDirty(true);
  };

  const handleRemoveTimelineStep = (index) => {
    setActiveQuote(prev => ({
      ...prev,
      timeline_steps: prev.timeline_steps.filter((_, idx) => idx !== index)
    }));
    setIsDirty(true);
  };

  // Note/terms textarea list updater
  const handleTextareaListChange = (field, textVal) => {
    const list = textVal.split('\n').filter(t => t.trim() !== '');
    setActiveQuote(prev => ({ ...prev, [field]: list }));
    setIsDirty(true);
  };

  // Load Presets in AI Assistant
  const handleLoadPresetPrompt = (presetId) => {
    if (presetId === 1) {
      setAiPrompt(`Draft a proposal for Mr. Chandru. 
Quote 228 sqft of our Meaven Minimalist Fixed Partition Series at 320/sqft and 2 swing door units at 23000/unit. 
Add 2000 for transport and logistics.
Payment: 60% advance, 30% dispatch, 10% completion.`);
    } else if (presetId === 2) {
      setAiPrompt(`Estimate number EST-000565 for Mr. Prashad, GSTIN: 29AAMCM4939R2ZA. 
Quote:
- Shower Enclosures (sliding) 186 sqft at 750/sqft. Specs: Saint Gobain 8MM Toughened Clear, Hardware Gold, No Profile. Sizes: 1950x2100, 1980x2100, 1920x2100, 2040x2100. Hardware A1 Kit, B3 Track.`);
    } else if (presetId === 3) {
      setAiPrompt(`Estimate for Mr. Chandru. 
Quote:
- Glass Railing 304 Gold 250 sqft at 900/sqft. Specs: 12MM Toughened, Grade 304, Gold Finish.
Add transport lumpsum of 5000.`);
    } else if (presetId === 4) {
      setAiPrompt(`Estimate for Mr. Prashad.
Quote:
- Pergola glass 300 sqft at 690/sqft. Specs: Saint Gobain SCN-145, Toughened + Laminated. 6MM + 1.5MM Laminated + 6MM composite build.`);
    }
  };

  const cleanAndParseJSON = (text) => {
    let cleaned = text.trim();
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```')) {
      // Remove starting ```json or ```
      cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, '');
      // Remove ending ```
      cleaned = cleaned.replace(/\s*```$/, '');
    }
    
    // Find first '{' and last '}' to extract raw JSON
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    
    return JSON.parse(cleaned);
  };

  const getIsoDate = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return dateStr;
  };

  // Shared Helper for calling AI for plain text generation
  const generateTextWithAI = async (prompt, systemPrompt = "You are a professional assistant.") => {
    const selectedModel = settings.selectedModel || 'gemini-2.5-flash';
    
    if (selectedModel.startsWith('gemini')) {
      const key = settings.geminiApiKey?.trim();
      if (!key) throw new Error("No Gemini API Key found. Please add it in Settings.");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              { text: prompt }
            ]
          }]
        })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    if (selectedModel.startsWith('gpt')) {
      const key = settings.openaiApiKey?.trim();
      if (!key) throw new Error("No OpenAI API Key found. Please add it in Settings.");
      const url = 'https://api.openai.com/v1/chat/completions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }

    throw new Error(`Unsupported model for direct text generation: ${selectedModel}`);
  };

  const [generatingSummary, setGeneratingSummary] = useState(false);
  const handleGenerateSummary = async () => {
    if (activeQuote.items.length === 0) {
      alert('Please add items to your quote first.');
      return;
    }
    setGeneratingSummary(true);
    try {
      const itemsList = activeQuote.items.map(item => `- ${item.name}: ${item.qty} ${item.unit} (${item.specs?.join(', ') || ''})`).join('\n');
      const prompt = `Generate a professional executive summary (2-4 sentences) for meaven.in. Scope of work items:\n${itemsList}\nDo not mention any prices.`;
      const systemPrompt = "You are a professional copywriter for meaven.in (premium glass and aluminium execution). Write a concise summary focusing on structural execution certainty and precise architectural alignment.";
      const summary = await generateTextWithAI(prompt, systemPrompt);
      updateQuoteField('desc', summary);
    } catch (e) {
      console.error(e);
      alert('Failed to generate summary: ' + e.message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const [generatingUpgradeIdx, setGeneratingUpgradeIdx] = useState(null);
  const handleGenerateUpgradeSummary = async (idx) => {
    const item = activeQuote.items[idx];
    const clientSpec = item.client_spec?.trim();
    const proposedSpec = (item.proposed_spec || item.our_offer)?.trim();
    if (!clientSpec || !proposedSpec) {
      alert('Please enter both Client Spec and Proposed Spec first.');
      return;
    }
    setGeneratingUpgradeIdx(idx);
    try {
      const prompt = `Briefly summarize the practical difference (1 short sentence) between these specifications for a glass/aluminium item:\nClient Specified: ${clientSpec}\nMeaven Proposed: ${proposedSpec}`;
      const systemPrompt = "You are a structural glass engineer for meaven.in. Return ONLY one short sentence (max 12 words) explaining the practical benefit of Meaven's proposed spec. Example: 'Upgraded to Saint-Gobain toughened glass for superior load resistance.'";
      const summary = await generateTextWithAI(prompt, systemPrompt);
      handleUpdateItem(idx, 'upgrade_summary', summary);
    } catch (e) {
      console.error(e);
      alert('Failed to generate upgrade summary: ' + e.message);
    } finally {
      setGeneratingUpgradeIdx(null);
    }
  };

  // AI Prompt Parsing Execution
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setLoadingAI(true);
    
    const selectedModel = settings.selectedModel || 'gemini-2.5-flash';
    const systemPrompt = GEMINI_SYSTEM_PROMPT;

    let parsed = null;

    try {
      if (selectedModel.startsWith('gemini')) {
        const key = settings.geminiApiKey?.trim();
        if (!key) {
          throw new Error("No Gemini API Key found. Please add it in Settings → AI Key.");
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: systemPrompt },
                { text: "Parse this request: " + aiPrompt }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        parsed = cleanAndParseJSON(jsonText);
      } 
      else if (selectedModel.startsWith('gpt')) {
        const key = settings.openaiApiKey?.trim();
        if (!key) {
          throw new Error("No OpenAI API Key found. Please add it in Settings → AI Key.");
        }
        const url = 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: "Parse this request: " + aiPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        parsed = cleanAndParseJSON(jsonText);
      }
      else if (selectedModel.startsWith('claude')) {
        const key = settings.anthropicApiKey?.trim();
        if (!key) {
          throw new Error("No Anthropic API Key found. Please add it in Settings → AI Key.");
        }
        const url = 'https://api.anthropic.com/v1/messages';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 4000,
            system: systemPrompt,
            messages: [
              { role: 'user', content: "Parse this request: " + aiPrompt }
            ]
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.content[0].text;
        parsed = cleanAndParseJSON(jsonText);
      }
      else if (selectedModel.startsWith('grok')) {
        const key = settings.xaiApiKey?.trim();
        if (!key) {
          throw new Error("No xAI (Grok) API Key found. Please add it in Settings → AI Key.");
        }
        const url = 'https://api.x.ai/v1/chat/completions';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: "Parse this request: " + aiPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        parsed = cleanAndParseJSON(jsonText);
      }

      if (parsed) {
        handleParsedAIQuote(parsed);
        alert(`AI generated quote successfully parsed using ${selectedModel}! Review details in the card.`);
      } else {
        throw new Error("Empty response received from AI model.");
      }

    } catch (err) {
      console.error(err);
      alert(`AI Live API failed (${selectedModel}): ${err.message}. Falling back to simulator mode.`);
      simulateAI(aiPrompt);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleParsedAIQuote = async (parsed) => {
    // 1. Calculate totals for the parsed quote object to show in confirmation card
    const items = parsed.items || [];
    const grossSubtotal = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)), 0);
    const totalItemDiscounts = items.reduce((sum, item) => {
      const discountPct = parseFloat(item.discount) || 0;
      if (discountPct > 0) {
        return sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0) * (discountPct / 100));
      }
      return sum;
    }, 0);
    const subtotalAfterItemDiscounts = grossSubtotal - totalItemDiscounts;
    const quoteDiscountPct = parseFloat(parsed.quote_discount_pct) || parseFloat(parsed.quoteDiscountPct) || 0;
    const quoteDiscountAmount = subtotalAfterItemDiscounts * (quoteDiscountPct / 100);
    const adjustedSubtotal = subtotalAfterItemDiscounts - quoteDiscountAmount;
    const flatAdjustment = parseFloat(parsed.adjustment) || 0;
    const taxableAmount = adjustedSubtotal + flatAdjustment;
    const taxAmount = taxableAmount * 0.18;
    const grandTotal = taxableAmount + taxAmount;

    // Start with default settings notes and terms
    const finalNotes = [...settings.notes];
    const finalTerms = [...settings.terms];

    if (parsed.notes && Array.isArray(parsed.notes)) {
      parsed.notes.forEach(note => {
        const cleanNote = note.trim();
        if (cleanNote && !cleanNote.toLowerCase().includes('attached') && !cleanNote.toLowerCase().includes('image')) {
          if (!finalNotes.some(fn => fn.toLowerCase() === cleanNote.toLowerCase())) {
            finalNotes.push(cleanNote);
          }
        }
      });
    }

    if (parsed.terms && Array.isArray(parsed.terms)) {
      parsed.terms.forEach(term => {
        const cleanTerm = term.trim();
        if (cleanTerm && !cleanTerm.toLowerCase().includes('attached') && !cleanTerm.toLowerCase().includes('image')) {
          if (!finalTerms.some(ft => ft.toLowerCase() === cleanTerm.toLowerCase())) {
            finalTerms.push(cleanTerm);
          }
        }
      });
    }

    const computedQuote = {
      ...parsed,
      quote_number: parsed.quote_number || parsed.estimate_no || getNextSeqQuoteNumber(quotes),
      date: parsed.date ? (isNaN(new Date(parsed.date).getTime()) ? new Date().toISOString().split('T')[0] : new Date(parsed.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      validity: parsed.validity || '15 Days',
      adjustment: flatAdjustment,
      quote_discount_pct: quoteDiscountPct,
      subtotal: adjustedSubtotal,
      tax: taxAmount,
      total: grandTotal,
      format: parsed.format || 'estimate',
      status: parsed.status || 'Draft',
      items: items.map(item => ({
        ...item,
        discount: parseFloat(item.discount) || 0,
        qty: parseFloat(item.qty) || 0,
        rate: parseFloat(item.rate) || 0,
        specs: item.specs || [],
        sizes: item.sizes || [],
        client_spec: item.client_spec || '',
        proposed_spec: item.proposed_spec || item.our_offer || '',
        upgrade_summary: item.upgrade_summary || ''
      })),
      payment_schedule: (parsed.payment_schedule && parsed.payment_schedule.length > 0) ? parsed.payment_schedule : (parsed.paymentSchedule && parsed.paymentSchedule.length > 0) ? parsed.paymentSchedule : [...settings.paymentSchedule],
      timeline_steps: (parsed.timeline_steps && parsed.timeline_steps.length > 0) ? parsed.timeline_steps : (parsed.timelineSteps && parsed.timelineSteps.length > 0) ? parsed.timelineSteps : [...settings.timelineSteps],
      notes: finalNotes,
      terms: finalTerms
    };

    // Auto-generate Executive Summary & Upgrade Summaries via AI if keys are present
    const key = settings.geminiApiKey?.trim() || settings.openaiApiKey?.trim();
    if (key) {
      try {
        const itemsList = computedQuote.items.map(item => `- ${item.name}: ${item.qty} ${item.unit} (${item.specs?.join(', ') || ''})`).join('\n');
        const summaryPrompt = `Generate a professional executive summary (2-4 sentences) for meaven.in. Scope of work items:\n${itemsList}\nDo not mention any prices.`;
        const summarySystemPrompt = "You are a professional copywriter for meaven.in (premium glass and aluminium execution). Write a concise summary focusing on structural execution certainty and precise architectural alignment. Return ONLY the paragraph.";
        
        const summaryPromise = generateTextWithAI(summaryPrompt, summarySystemPrompt)
          .then(res => { computedQuote.desc = res; })
          .catch(e => console.error('Failed to auto-generate summary', e));

        const upgradePromises = computedQuote.items.map((item, idx) => {
          const clientSpec = item.client_spec?.trim();
          const proposedSpec = (item.proposed_spec || item.our_offer || '')?.trim();
          if (clientSpec && proposedSpec && !item.upgrade_summary) {
            const upPrompt = `Briefly summarize the practical difference (1 short sentence) between these specifications for a glass/aluminium item:\nClient Specified: ${clientSpec}\nMeaven Proposed: ${proposedSpec}`;
            const upSystem = "You are a structural glass engineer for meaven.in. Return ONLY one short sentence (max 12 words) explaining the practical benefit of Meaven's proposed spec. Example: 'Upgraded to Saint-Gobain toughened glass for superior load resistance.'";
            return generateTextWithAI(upPrompt, upSystem)
              .then(res => { item.upgrade_summary = res; })
              .catch(e => console.error('Failed to auto-generate upgrade summary for item ' + idx, e));
          }
          return Promise.resolve();
        });

        await Promise.all([summaryPromise, ...upgradePromises]);
      } catch (e) {
        console.error('Failed auto-generating summaries during parsing', e);
      }
    }

    setParsedAIResult(computedQuote);
  };

  const handleLoadAIResult = () => {
    if (!parsedAIResult) return;
    setActiveQuote(parsedAIResult);
    setParsedAIResult(null);
    setIsDirty(true);
    setActiveTab('form');
  };

  const simulateAI = (text) => {
    let data;
    if (text.includes('Chandru') || text.includes('228') || text.includes('320')) {
      data = {
        client_name: 'Mr. Chandru',
        gstin: '—',
        quote_number: 'MEA-2026-0747',
        date: '26 June 2026',
        validity: '15 Days',
        reference: 'HSR Office Partition',
        adjustment: 0,
        format: 'proposal',
        items: [
          {
            name: 'Meaven Minimalist Fixed Partition Series',
            specs: ['Saint Gobain · 12mm', 'Toughened', 'Clear', 'Hardware: Ivory Channel'],
            desc: 'High-transparency fixed glass system designed for maximum light flow and structural rigidity.',
            hardware: 'Standard top/bottom Ivory profile channels, premium soft gaskets, and clear setting blocks.',
            qty: 228,
            unit: 'sqft',
            rate: 320,
            sizes: ['Standard Partition Panels']
          },
          {
            name: 'Meaven Precision Swing Door System',
            specs: ['12mm Toughened', 'Ozone Hardware', 'Hydraulic Soft-Close'],
            desc: 'Frameless swing system with integrated hydraulic control for seamless transition and "soft-close" safety.',
            hardware: 'Ozone Hydraulic Bottom Patch (Soft-Close) · Top Patch · Corner Lock · 300mm Back-to-Back pull handles',
            qty: 2,
            unit: 'Units',
            rate: 23000,
            sizes: ['Single door leaf']
          },
          {
            name: 'Transportation & Logistics',
            specs: ['Delivery included'],
            desc: 'Includes delivery to site, unloading, and shifting.',
            qty: 1,
            unit: 'lumpsum',
            rate: 2000,
            sizes: []
          }
        ],
        paymentSchedule: [
          { pct: 60, milestone: 'Advance — on order confirmation' },
          { pct: 30, milestone: 'Before dispatch from factory' },
          { pct: 10, milestone: 'On installation completion' }
        ]
      };
    } else if (text.includes('Prashad') || text.includes('EST-000565') || text.includes('186')) {
      data = {
        client_name: 'Mr. Prashad',
        gstin: '29AAMCM4939R2ZA',
        quote_number: 'EST-000565',
        date: '30 July 2024',
        validity: 'Subject to confirmation',
        reference: 'Prashad Villa Pergola',
        adjustment: -18025,
        format: 'estimate',
        items: [
          {
            name: 'Shower Enclosures — Sliding',
            specs: ['Saint Gobain · 8MM', 'Toughened', 'Clear', 'Hardware: Gold', 'No Profile Channels'],
            desc: 'Premium sliding glass shower partition.',
            hardware: 'A1 Kit · B3 Track · OGC-4 · Sl-HN-50 · D-Seal · H-Seal · Wall Track Holder · Silicone Clear',
            qty: 186,
            unit: 'sqft',
            rate: 750,
            sizes: ['1950 × 2100 mm', '1980 × 2100 mm', '1920 × 2100 mm', '2040 × 2100 mm']
          },
          {
            name: 'Pergola Glass',
            specs: ['Saint Gobain · SCN-145', 'Toughened + Laminated', 'Clear'],
            desc: '6MM + 1.5MM Laminated + 6MM composite build for pergola application',
            qty: 300,
            unit: 'sqft',
            rate: 690,
            sizes: []
          },
          {
            name: 'Glass Railing — 304 Gold',
            specs: ['12MM · Toughened', 'Grade 304 · Gold Finish', 'Clear', 'Installation Included'],
            desc: 'Heavy duty railing system with premium gold-plated hardware panels.',
            hardware: 'Grade 304 heavy-duty gold-finished spigots, base cover caps, and handrail connectors.',
            qty: 250,
            unit: 'sqft',
            rate: 900,
            sizes: []
          },
          {
            name: 'Transportation',
            specs: ['Lumpsum'],
            desc: 'Includes delivery to site, unloading at ground floor, and internal shifting',
            qty: 1,
            unit: 'lumpsum',
            rate: 7000,
            sizes: []
          }
        ],
        paymentSchedule: [
          { pct: 50, milestone: 'Advance — on order confirmation' },
          { pct: 45, milestone: 'Before glass is dispatched from factory' },
          { pct: 5, milestone: 'On day of work completion' }
        ]
      };
    } else {
      data = {
        client_name: 'Acme Glass Corp',
        gstin: '—',
        quote_number: getNextSeqQuoteNumber(quotes),
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        validity: '15 Days',
        reference: 'Standard glass partition setup',
        adjustment: 0,
        format: 'estimate',
        items: [
          {
            name: 'Meaven Minimalist Fixed Partition Series',
            specs: ['12mm Fixed Glass'],
            desc: 'Standard commercial fixed partition glass solution.',
            qty: 100,
            unit: 'sqft',
            rate: 450,
            sizes: []
          }
        ],
        paymentSchedule: [
          { pct: 60, milestone: 'Advance — on order confirmation' },
          { pct: 40, milestone: 'Upon delivery and completion' }
        ]
      };
    }

    handleParsedAIQuote(data);
    alert('AI simulated data calculated and staged successfully!');
  };

  // Reset to new quote template — triggers mode selection wizard
  const handleResetQuote = () => {
    if (isDirty) {
      const confirmReset = window.confirm("You have unsaved changes in your active quote. If you start a new quote, you will lose your unsaved edits. Are you sure you want to proceed?");
      if (!confirmReset) return;
    }
    setShowNewQuoteModal(true);
  };

  const handleStartManualQuote = () => {
    setActiveQuote({
      quote_number: getNextSeqQuoteNumber(quotes),
      client_name: '',
      gstin: '',
      date: new Date().toISOString().split('T')[0],
      validity: '15 Days',
      reference: '',
      status: 'Draft',
      format: 'proposal',
      items: [],
      payment_schedule: [...settings.paymentSchedule],
      timeline_steps: [...settings.timelineSteps],
      notes: [...settings.notes],
      terms: [...settings.terms],
      adjustment: 0,
      subtotal: 0,
      tax: 0,
      total: 0
    });
    setIsDirty(false);
    setShowFormAiPrompt(false);
    setShowNewQuoteModal(false);
    setActiveTab('form');
  };

  const handleStartAIQuote = () => {
    setActiveQuote({
      quote_number: getNextSeqQuoteNumber(quotes),
      client_name: '',
      gstin: '',
      date: new Date().toISOString().split('T')[0],
      validity: '15 Days',
      reference: '',
      status: 'Draft',
      format: 'proposal',
      items: [],
      payment_schedule: [...settings.paymentSchedule],
      timeline_steps: [...settings.timelineSteps],
      notes: [...settings.notes],
      terms: [...settings.terms],
      adjustment: 0,
      subtotal: 0,
      tax: 0,
      total: 0
    });
    setAiPrompt('');
    setIsDirty(false);
    setShowFormAiPrompt(true);
    setShowNewQuoteModal(false);
    setActiveTab('form');
  };

  const handleGenerateAIForForm = async () => {
    if (!aiPrompt.trim()) return;
    setLoadingFormAI(true);
    
    const selectedModel = settings.selectedModel || 'gemini-2.5-flash';
    const systemPrompt = GEMINI_SYSTEM_PROMPT;
    let parsed = null;

    try {
      if (selectedModel.startsWith('gemini')) {
        const key = settings.geminiApiKey?.trim();
        if (!key) throw new Error("No Gemini API Key found. Please add it in Settings.");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: systemPrompt },
                { text: "Parse this request: " + aiPrompt }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        parsed = cleanAndParseJSON(jsonText);
      } 
      else if (selectedModel.startsWith('gpt')) {
        const key = settings.openaiApiKey?.trim();
        if (!key) throw new Error("No OpenAI API Key found. Please add it in Settings.");
        const url = 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: "Parse this request: " + aiPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        parsed = cleanAndParseJSON(jsonText);
      }
      else if (selectedModel.startsWith('claude')) {
        const key = settings.anthropicApiKey?.trim();
        if (!key) throw new Error("No Anthropic API Key found. Please add it in Settings.");
        const url = 'https://api.anthropic.com/v1/messages';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 4000,
            system: systemPrompt,
            messages: [
              { role: 'user', content: "Parse this request: " + aiPrompt }
            ]
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.content[0].text;
        parsed = cleanAndParseJSON(jsonText);
      }
      else if (selectedModel.startsWith('grok')) {
        const key = settings.xaiApiKey?.trim();
        if (!key) throw new Error("No xAI (Grok) API Key found. Please add it in Settings.");
        const url = 'https://api.x.ai/v1/chat/completions';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: "Parse this request: " + aiPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        parsed = cleanAndParseJSON(jsonText);
      }

      if (parsed) {
        const computedQuote = {
          quote_number: parsed.quote_number || parsed.quoteNumber || activeQuote.quote_number || 'MEA-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)),
          client_name: parsed.client_name || parsed.clientName || '',
          gstin: parsed.gstin || '',
          date: parsed.date ? getIsoDate(parsed.date) : new Date().toISOString().split('T')[0],
          validity: parsed.validity || '15 Days',
          reference: parsed.reference || parsed.subject || '',
          status: 'Draft',
          format: parsed.format || 'proposal',
          desc: parsed.desc || '',
          items: (parsed.items || []).map(item => ({
            name: item.name || '',
            desc: item.desc || item.description || '',
            qty: parseFloat(item.qty) || 1,
            unit: item.unit || 'sqft',
            rate: parseFloat(item.rate) || 0,
            discount: parseFloat(item.discount) || 0,
            specs: item.specs || item.tags || [],
            sizes: item.sizes || [],
            client_spec: item.client_spec || '',
            proposed_spec: item.proposed_spec || item.our_offer || '',
            upgrade_summary: item.upgrade_summary || ''
          })),
          payment_schedule: (parsed.payment_schedule && parsed.payment_schedule.length > 0) ? parsed.payment_schedule : (parsed.paymentSchedule && parsed.paymentSchedule.length > 0) ? parsed.paymentSchedule : [...settings.paymentSchedule],
          timeline_steps: (parsed.timeline_steps && parsed.timeline_steps.length > 0) ? parsed.timeline_steps : (parsed.timelineSteps && parsed.timelineSteps.length > 0) ? parsed.timelineSteps : [...settings.timelineSteps],
          notes: parsed.notes || [...settings.notes],
          terms: parsed.terms || [...settings.terms],
          adjustment: parseFloat(parsed.adjustment) || 0
        };

        // Auto-generate summaries via AI
        const key = settings.geminiApiKey?.trim() || settings.openaiApiKey?.trim();
        if (key) {
          try {
            const itemsList = computedQuote.items.map(item => `- ${item.name}: ${item.qty} ${item.unit} (${item.specs?.join(', ') || ''})`).join('\n');
            const summaryPrompt = `Generate a professional executive summary (2-4 sentences) for meaven.in. Scope of work items:\n${itemsList}\nDo not mention any prices.`;
            const summarySystemPrompt = "You are a professional copywriter for meaven.in (premium glass and aluminium execution). Write a concise summary focusing on structural execution certainty and precise architectural alignment. Return ONLY the paragraph.";
            
            const summaryPromise = generateTextWithAI(summaryPrompt, summarySystemPrompt)
              .then(res => { computedQuote.desc = res; })
              .catch(e => console.error('Failed to auto-generate summary', e));

            const upgradePromises = computedQuote.items.map((item, idx) => {
              const clientSpec = item.client_spec?.trim();
              const proposedSpec = (item.proposed_spec || item.our_offer || '')?.trim();
              if (clientSpec && proposedSpec && !item.upgrade_summary) {
                const upPrompt = `Briefly summarize the practical difference (1 short sentence) between these specifications for a glass/aluminium item:\nClient Specified: ${clientSpec}\nMeaven Proposed: ${proposedSpec}`;
                const upSystem = "You are a structural glass engineer for meaven.in. Return ONLY one short sentence (max 12 words) explaining the practical benefit of Meaven's proposed spec. Example: 'Upgraded to Saint-Gobain toughened glass for superior load resistance.'";
                return generateTextWithAI(upPrompt, upSystem)
                  .then(res => { item.upgrade_summary = res; })
                  .catch(e => console.error('Failed to auto-generate upgrade summary for item ' + idx, e));
              }
              return Promise.resolve();
            });

            await Promise.all([summaryPromise, ...upgradePromises]);
          } catch (e) {
            console.error('Failed auto-generating summaries', e);
          }
        }

        setActiveQuote(computedQuote);
        setIsDirty(true);
        setShowFormAiPrompt(false);
        alert('AI Quote parsed and loaded successfully!');
      } else {
        throw new Error("Empty response received from AI model.");
      }

    } catch (err) {
      console.error(err);
      alert(`AI Live API failed (${selectedModel}): ${err.message}. Falling back to simulation mode.`);
      
      // Simulator mode fallback
      const simulatorOutput = {
        client_name: 'Simulated Client Ltd',
        date: new Date().toISOString().split('T')[0],
        validity: '15 Days',
        quote_number: getNextSeqQuoteNumber(quotes),
        reference: 'Standard Structural Glazing Works',
        status: 'Draft',
        format: 'proposal',
        desc: 'Meaven is pleased to submit this proposal for premium glass and aluminium works. Our design ensures maximum safety and durability.',
        items: [
          {
            name: 'Meaven Minimalist Partition',
            desc: 'Frameless glass partition installation',
            qty: 120,
            unit: 'sqft',
            rate: 650,
            discount: 0,
            specs: ['10mm Toughened', 'Saint-Gobain Glass', 'Dorma Patch Fittings'],
            sizes: ['1200 × 2400 mm'],
            client_spec: '10mm Ordinary Glass',
            proposed_spec: '10mm Toughened Saint-Gobain Glass',
            upgrade_summary: 'Upgraded to Saint-Gobain toughened glass for superior structural safety.'
          }
        ],
        payment_schedule: [...settings.paymentSchedule],
        timeline_steps: [...settings.timelineSteps],
        notes: [...settings.notes],
        terms: [...settings.terms],
        adjustment: 0
      };
      
      setActiveQuote(simulatorOutput);
      setIsDirty(true);
      setShowFormAiPrompt(false);
    } finally {
      setLoadingFormAI(false);
    }
  };

  // Save current quote draft
  const handleSaveQuoteDraft = async () => {
    if (!activeQuote.client_name.trim()) {
      alert('Billed To (Client Name) is required before saving.');
      return;
    }
    const saved = await saveQuote(activeQuote);
    if (saved) {
      setActiveQuote(saved);
      setIsDirty(false);
      if (saved._isLocalFallback) {
        alert('Warning: Quote saved to local browser cache ONLY (Failed to sync to Supabase cloud database). Check your database connection/credentials.');
      } else {
        alert('Quote saved successfully to cloud database!');
      }
    } else {
      alert('Error: Failed to save quote.');
    }
    loadData();
  };

  // CRUD Client helpers
  const handleSaveClientCRM = async (client) => {
    await saveClient(client);
    loadData();
  };

  const handleDeleteClientCRM = async (id) => {
    await deleteClient(id);
    loadData();
  };

  // Settings save handler
  const handleSaveSettingsConfig = (newSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    const supabase = getSupabase();
    setDbConnected(!!supabase);
    loadData();
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const updated = { ...settings, companyLogo: event.target.result };
        saveSettings(updated);
        setSettings(updated);
        alert('Company logo uploaded successfully and persisted!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    const updated = { ...settings, companyLogo: null };
    saveSettings(updated);
    setSettings(updated);
    alert('Logo reset to default SVG wordmark.');
  };

  const handlePrint = async () => {
    // Automatically save the draft first if we are editing and a client name is entered
    if (!previewQuote && activeQuote.client_name?.trim()) {
      const saved = await saveQuote(activeQuote);
      if (saved) {
        setActiveQuote(saved);
      }
      setIsDirty(false);
      loadData();
    }
    // Force DOM update to hide headers/sidebars before browser blocks loop
    setIsPrinting(true);
    // Show instruction overlay before print dialog
    setShowPrintTip(true);
    setTimeout(() => {
      setShowPrintTip(false);
      window.print();
      setIsPrinting(false);
    }, 2000);
  };

  // 1. Loading active Auth session
  if (dbConnected && loadingSession) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1B2B45 0%, #0F172A 100%)',
        fontFamily: 'Inter, sans-serif',
        color: '#FFFFFF'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#C9A96E',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          letterSpacing: '-0.02em',
          marginBottom: '16px'
        }}>
          meaven
        </div>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#C9A96E',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Check if DB is connected and user is not authenticated
  if (dbConnected && !session) {
    return <Login onLoginSuccess={(s) => setSession(s)} />;
  }

  // 3. Forced Password Reset Flow
  if (session && forcePasswordReset) {
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
          borderRadius: '0px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          borderTop: '5px solid #C9A96E',
          padding: '40px 32px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1B2B45', margin: '0 0 10px 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Set Permanent Password
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
            For security reasons, you must change your temporary password on your first login.
          </p>

          {resetError && (
            <div style={{ background: '#FDF2F2', border: '1px solid #FDE8E8', color: '#E02424', padding: '10px', fontSize: '12px', borderRadius: '4px', marginBottom: '20px', textAlign: 'left' }}>
              {resetError}
            </div>
          )}

          <form onSubmit={handleForcePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1B2B45', marginBottom: '6px' }}>
                New Password
              </label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '11px 12px', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1B2B45', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '11px 12px', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1B2B45',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: updatingPassword ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: '10px'
              }}
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* 1. FAR-LEFT VERTICAL NAVIGATION ICON BAR */}
      {!isPrinting && (
        <div className="sidebar-nav no-print" style={{ position: 'relative' }}>
        {/* Tab Switchers (AI is first) */}
        <div 
          onClick={() => navigateToTab('ai')}
          className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          data-tooltip="AI Assistant"
          style={{ marginTop: '8px' }}
        >
          <Sparkles size={20} />
        </div>

        <div 
          onClick={() => navigateToTab('form')}
          className={`nav-item ${activeTab === 'form' ? 'active' : ''}`}
          data-tooltip="Active Form"
        >
          <FileText size={20} />
        </div>

        <div 
          onClick={() => navigateToTab('history')}
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          data-tooltip="Quotes History"
        >
          <History size={20} />
        </div>

        <div 
          onClick={() => navigateToTab('clients')}
          className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`}
          data-tooltip="Clients CRM"
        >
          <Users size={20} />
        </div>

        {isAdmin && (
          <div 
            onClick={() => navigateToTab('settings')}
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            data-tooltip="Settings"
          >
            <SettingsIcon size={20} />
          </div>
        )}

        {/* Bottom actions and indicators */}
        <div className="mt-auto flex flex-col items-center gap-3">
          {session && (
            <div 
              onClick={async () => {
                if (activeTab === 'form' && isDirty) {
                  const confirmLeave = window.confirm("You have unsaved changes in your active quote. If you log out, you will lose your unsaved edits. Are you sure you want to proceed?");
                  if (!confirmLeave) return;
                }
                const supabase = getSupabase();
                if (supabase) {
                  await supabase.auth.signOut();
                  setSession(null);
                }
              }}
              className="nav-item cursor-pointer text-zinc-400 hover:text-red-500"
              data-tooltip="Log Out"
              style={{ margin: 0 }}
            >
              <LogOut size={20} />
            </div>
          )}

          <div 
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              pointerEvents: 'auto',
              opacity: 0.8
            }}
            title={dbConnected ? "Supabase Connected" : "Local Storage Mode"}
          >
            <Database size={11} style={{ color: dbConnected ? '#10B981' : '#9CA3AF' }} />
            <span className="text-[9px] font-bold text-zinc-500 tracking-wider">v2.0</span>
          </div>
        </div>
      </div>
      )}

      {/* 2. SIDEBAR TAB PANEL (400px wide) */}
      {!isPrinting && (
        <div className="sidebar-panel no-print">
        
        {/* PANEL: AI ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in">
            <div className="panel-header">
              <h2><span>AI</span> Assistant</h2>
              <p>Type prompts to let the AI build your specifications list.</p>
            </div>
            
            <div className="panel-body space-y-4 sub-panel-content">
              {/* Preset buttons row at top */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)'
              }}>
                {['Glass Partition', 'Shower Enclosure', 'Railing', 'Pergola Glass'].map((preset) => {
                  const getPresetId = (name) => {
                    if (name.includes('Partition')) return 1;
                    if (name.includes('Shower')) return 2;
                    if (name.includes('Railing')) return 3;
                    if (name.includes('Pergola')) return 4;
                    return 1;
                  };
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleLoadPresetPrompt(getPresetId(preset))}
                      className="btn-outline"
                      style={{
                        borderRadius: '20px',
                        padding: '5px 12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        height: 'auto',
                        width: 'auto'
                      }}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>



              {/* Parsed result confirmation card */}
              {parsedAIResult && (
                <div style={{
                  margin: '12px 14px',
                  border: '1px solid var(--border)',
                  background: 'var(--white)',
                  padding: '14px'
                }}>
                  {/* Header */}
                  <div style={{
                    fontSize: '9px',
                    fontWeight: '700',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--steel)',
                    marginBottom: '10px',
                    textAlign: 'left'
                  }}>
                    Parsed Result
                  </div>

                  {/* Data rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--muted)' }}>Client</span>
                      <span style={{ color: 'var(--navy)', fontWeight: '600' }}>{parsedAIResult.client_name || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--muted)' }}>Items</span>
                      <span style={{ color: 'var(--navy)', fontWeight: '600' }}>{parsedAIResult.items?.length || 0} items</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--muted)' }}>Est. Total</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--navy)', fontWeight: '700' }}>
                        ₹{Math.round(parsedAIResult.total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleLoadAIResult}
                      className="btn"
                      style={{ flex: 1, padding: '10px 0', justifyContent: 'center', width: 'auto' }}
                    >
                      Load into Form
                    </button>
                    <button
                      type="button"
                      onClick={() => setParsedAIResult(null)}
                      className="btn-outline"
                      style={{ flex: 1, padding: '10px 0', justifyContent: 'center', width: 'auto' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Card Container for AI Assistant Inputs */}
              <div className="bg-white border border-[var(--ui-border)] p-4 rounded-xl space-y-4 shadow-sm text-left">
                <div className="flex items-center gap-1.5 border-b border-zinc-150 pb-2 mb-1">
                  <span className="text-[10px] font-extrabold text-[var(--ui-accent, #B8933E)] uppercase tracking-wider">AI Quote Parameters</span>
                </div>

                {/* Active Model / Provider Selection */}
                <div className="form-group mb-0">
                  <label className="input-label">AI Engine Model</label>
                  <select
                    value={settings.selectedModel || 'gemini-2.5-flash'}
                    onChange={(e) => {
                      const updated = { ...settings, selectedModel: e.target.value };
                      saveSettings(updated);
                      setSettings(updated);
                    }}
                    className="input-field cursor-pointer"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    <optgroup label="Google Gemini">
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </optgroup>
                    <optgroup label="OpenAI">
                      <option value="gpt-4o">GPT-4o (OpenAI)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                    </optgroup>
                    <optgroup label="Anthropic Claude">
                      <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
                      <option value="claude-haiku-4-5">Claude 4.5 Haiku</option>
                    </optgroup>
                    <optgroup label="xAI Grok">
                      <option value="grok-2-1212">Grok 2</option>
                      <option value="grok-beta">Grok Beta</option>
                      <option value="grok-4.1-fast">Grok 4.1 Fast</option>
                      <option value="grok-4.3">Grok 4.3</option>
                    </optgroup>
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="input-label">Prompt Description / BOQ Text</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows="8"
                    placeholder="e.g. Estimate Mr. Prashad: Gold hardware sliding shower enclosure 186 sqft at 750/sqft..."
                    className="input-field font-sans resize-none text-xs"
                    style={{ padding: '8px 10px', width: '100%', border: '1px solid var(--border)' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={loadingAI}
                  className="btn w-full py-2 flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  {loadingAI ? 'AI is parsing...' : 'Generate Quote'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: FORM EDITOR */}
        {activeTab === 'form' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in text-left">
            <div className="panel-header flex justify-between items-center py-4">
              <div>
                <h2><span>Quote</span> Form</h2>
                <p>Edit quote items and values manually.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={handleResetQuote}
                  className="btn-outline"
                >
                  <Plus size={13} /> New Quote
                </button>
                <button
                  onClick={handleSaveQuoteDraft}
                  className="btn"
                  style={{ width: 'auto' }}
                >
                  <Save size={13} /> Save Draft
                </button>
              </div>
            </div>
            
            <div className="panel-body space-y-4 sub-panel-content">
              {showFormAiPrompt && (
                <div className="bg-white border border-[var(--ui-border)] p-4 rounded-xl space-y-4 shadow-sm text-left">
                  <div className="flex justify-between items-center mb-1 border-b border-zinc-150 pb-2">
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5" style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                      <Sparkles size={14} className="text-[var(--ui-accent, #B8933E)] animate-pulse" /> AI Quote Creator
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setShowFormAiPrompt(false)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-650 font-bold uppercase tracking-wider cursor-pointer"
                      style={{ background: 'none', border: 'none' }}
                    >
                      Skip / Manual
                    </button>
                  </div>
                  
                  {/* Model Selector */}
                  <div className="form-group mb-0">
                    <label className="input-label">AI Engine Model</label>
                    <select
                      value={settings.selectedModel || 'gemini-2.5-flash'}
                      onChange={(e) => {
                        const updated = { ...settings, selectedModel: e.target.value };
                        saveSettings(updated);
                        setSettings(updated);
                      }}
                      className="input-field cursor-pointer"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    >
                      <optgroup label="Google Gemini">
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      </optgroup>
                      <optgroup label="OpenAI">
                        <option value="gpt-4o">GPT-4o (OpenAI)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                      </optgroup>
                      <optgroup label="Anthropic Claude">
                        <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
                        <option value="claude-haiku-4-5">Claude 4.5 Haiku</option>
                      </optgroup>
                      <optgroup label="xAI Grok">
                        <option value="grok-2-1212">Grok 2</option>
                        <option value="grok-beta">Grok Beta</option>
                        <option value="grok-4.1-fast">Grok 4.1 Fast</option>
                        <option value="grok-4.3">Grok 4.3</option>
                      </optgroup>
                    </select>
                  </div>
 
                  {/* BOQ Prompt Area */}
                  <div className="form-group mb-0">
                    <label className="input-label">Describe Project / Paste BOQ Text</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows="7"
                      placeholder="Describe the items, dimensions, rates, client details, payment terms, or paste raw specifications/emails here..."
                      className="input-field font-sans resize-none text-xs"
                      style={{ padding: '8px 10px', width: '100%', border: '1px solid var(--border)' }}
                    />
                  </div>
 
                  {/* Preset helpers */}
                  <div style={{ marginTop: '12px' }}>
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider mb-2">Example Presets</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLoadPresetPrompt(1)}
                        className="btn-outline"
                        style={{
                          borderRadius: '20px',
                          padding: '5px 12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          height: 'auto',
                          width: 'auto'
                        }}
                      >
                        Minimalist Partition
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadPresetPrompt(2)}
                        className="btn-outline"
                        style={{
                          borderRadius: '20px',
                          padding: '5px 12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          height: 'auto',
                          width: 'auto'
                        }}
                      >
                        Shower Enclosures
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadPresetPrompt(3)}
                        className="btn-outline"
                        style={{
                          borderRadius: '20px',
                          padding: '5px 12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          height: 'auto',
                          width: 'auto'
                        }}
                      >
                        Frameless Doors
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadPresetPrompt(4)}
                        className="btn-outline"
                        style={{
                          borderRadius: '20px',
                          padding: '5px 12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          height: 'auto',
                          width: 'auto'
                        }}
                      >
                        Glass Pergola
                      </button>
                    </div>
                  </div>
 
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFormAiPrompt(false)}
                      className="btn-outline flex-1"
                      style={{
                        justifyContent: 'center',
                        padding: '10px 0'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAIForForm}
                      disabled={loadingFormAI}
                      className="btn flex-1"
                      style={{
                        width: 'auto',
                        justifyContent: 'center',
                        padding: '10px 0',
                        cursor: loadingFormAI ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Sparkles size={13} />
                      {loadingFormAI ? 'AI is processing...' : 'Generate Form'}
                    </button>
                  </div>
                </div>
              )}

              {!showFormAiPrompt && (
                <>
                  {/* Card 1: Client & Contact Billing Details */}
              <div className="bg-white border border-[var(--ui-border)] p-4 rounded-xl space-y-4 shadow-sm text-left">
                <div className="flex items-center gap-1.5 border-b border-zinc-150 pb-2 mb-1">
                  <span className="text-[10px] font-extrabold text-[var(--ui-accent, #B8933E)] uppercase tracking-wider">Client &amp; Contact Info</span>
                </div>

                {/* Client Dropdown selector */}
                <div className="form-group mb-0">
                  <label className="input-label">Select Saved Contact</label>
                  <select
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option value="">-- Select repeat client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="input-label">Billed To (Client) *</label>
                    <input 
                      type="text"
                      value={activeQuote.client_name}
                      onChange={(e) => updateQuoteField('client_name', e.target.value)}
                      placeholder="Client Name"
                      className="input-field"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="input-label">Client GSTIN</label>
                    <input 
                      type="text"
                      value={activeQuote.gstin}
                      onChange={(e) => updateQuoteField('gstin', e.target.value)}
                      placeholder="29AAMCM..."
                      className="input-field font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Quote Details & Meta */}
              <div className="bg-white border border-[var(--ui-border)] p-4 rounded-xl space-y-4 shadow-sm text-left">
                <div className="flex items-center gap-1.5 border-b border-zinc-150 pb-2 mb-1">
                  <span className="text-[10px] font-extrabold text-[var(--ui-accent, #B8933E)] uppercase tracking-wider">Quote Details</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="input-label">Estimate Number</label>
                    <input 
                      type="text"
                      value={activeQuote.quote_number}
                      onChange={(e) => updateQuoteField('quote_number', e.target.value)}
                      className="input-field font-mono"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="input-label">Project Reference</label>
                    <input 
                      type="text"
                      value={activeQuote.reference || ''}
                      onChange={(e) => updateQuoteField('reference', e.target.value)}
                      placeholder="e.g. HSR Office Site"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="input-label">Date</label>
                    <input 
                      type="date"
                      value={getIsoDate(activeQuote.date)}
                      onChange={(e) => updateQuoteField('date', e.target.value)}
                      className="input-field cursor-pointer"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="input-label">Validity</label>
                    <input 
                      type="text"
                      value={activeQuote.validity}
                      onChange={(e) => updateQuoteField('validity', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="form-group mb-0">
                    <label className="input-label">Status</label>
                    <select
                      value={activeQuote.status}
                      onChange={(e) => updateQuoteField('status', e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Approved">Approved</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="input-label">Adjustment (₹)</label>
                    <input 
                      type="number"
                      value={activeQuote.adjustment}
                      onChange={(e) => updateQuoteField('adjustment', parseFloat(e.target.value) || 0)}
                      className="input-field font-mono"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="input-label">Discount %</label>
                    <input 
                      type="number"
                      value={activeQuote.quote_discount_pct || activeQuote.quoteDiscountPct || 0}
                      onChange={(e) => updateQuoteField('quote_discount_pct', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="input-field font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Executive Summary (AI) */}
              <div className="bg-white border border-[var(--ui-border)] p-4 rounded-xl space-y-3 shadow-sm text-left">
                <div className="flex justify-between items-center mb-1">
                  <label className="input-label mb-0" style={{ fontSize: '10px', fontWeight: '800', color: 'var(--ui-text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Executive Summary</label>
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="btn-outline"
                    style={{
                      borderRadius: '20px',
                      padding: '4px 10.5px',
                      fontSize: '10px',
                      fontWeight: '700',
                      height: 'auto',
                      width: 'auto'
                    }}
                  >
                    {generatingSummary ? 'Generating...' : '✨ AI Generate'}
                  </button>
                </div>
                <textarea
                  rows="3"
                  value={activeQuote.desc || ''}
                  onChange={(e) => updateQuoteField('desc', e.target.value)}
                  placeholder="Summarize the scope of work..."
                  className="input-field font-sans resize-none h-16"
                  style={{ padding: '8px 10px', fontSize: '11.5px' }}
                />
              </div>

              {/* Items List Section */}
              <div className="border-t border-[var(--ui-border)] pt-4 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[var(--ui-accent)] uppercase tracking-wider">Line Items List ({activeQuote.items?.length || 0})</span>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="btn-outline"
                    style={{ padding: '6px 12px', fontSize: '11px', height: 'auto', width: 'auto' }}
                  >
                    + Add Custom Item
                  </button>
                </div>
 
                {/* Predefined select catalog shortcut */}
                <div className="bg-white border border-[var(--ui-border)] p-2.5 rounded-xl mb-3 flex gap-2 items-center shadow-sm">
                  <select
                    id="catalogSelector"
                    className="input-field cursor-pointer py-1 text-xs"
                    style={{ height: '32px', padding: '4px 8px' }}
                  >
                    {settings.predefinedProducts.map((p, idx) => (
                      <option key={idx} value={idx}>{p.name} (₹{p.rate})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = document.getElementById('catalogSelector').value;
                      const product = settings.predefinedProducts[idx];
                      if (product) handleAddItem(product);
                    }}
                    className="btn"
                    style={{
                      height: '32px',
                      width: 'auto',
                      padding: '0 14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-3.5">
                  {activeQuote.items?.map((item, idx) => (
                    <div className="item-edit-row" key={idx}>
                      <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-2 mb-2">
                        <span className="font-mono text-xs font-bold text-[var(--ui-accent)]">Item {String(idx+1).padStart(2, '0')}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, 'up')}
                            className="p-1 hover:bg-zinc-200 text-zinc-600 rounded"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, 'down')}
                            className="p-1 hover:bg-zinc-200 text-zinc-600 rounded"
                          >
                            <ChevronDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 hover:bg-zinc-200 text-rose-500 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="form-group mb-2">
                          <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Item Name</label>
                          <input 
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                            className="input-field font-semibold"
                            style={{ padding: '6px 10px', fontSize: '11.5px' }}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div className="form-group mb-0">
                            <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Qty</label>
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleUpdateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                              className="input-field text-center font-mono"
                              style={{ padding: '6px 8px', fontSize: '11.5px' }}
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Unit</label>
                            <input 
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                              className="input-field text-center"
                              style={{ padding: '6px 8px', fontSize: '11.5px' }}
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Rate (₹)</label>
                            <input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                              className="input-field text-center font-mono"
                              style={{ padding: '6px 8px', fontSize: '11.5px' }}
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Disc %</label>
                            <input 
                              type="number"
                              value={item.discount || 0}
                              onChange={(e) => handleUpdateItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                              className="input-field text-center font-mono"
                              style={{ padding: '6px 8px', fontSize: '11.5px' }}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="form-group mb-2">
                          <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Specs (comma separated)</label>
                          <input 
                            type="text"
                            value={item.specs?.join(', ')}
                            onChange={(e) => handleUpdateItemSpecs(idx, e.target.value)}
                            className="input-field"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          />
                        </div>

                        <div className="form-group mb-2">
                          <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Short Description</label>
                          <textarea 
                            rows="2"
                            value={item.desc}
                            onChange={(e) => handleUpdateItem(idx, 'desc', e.target.value)}
                            className="input-field font-sans resize-none h-14"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="form-group mb-0">
                            <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Client Spec (Comparison)</label>
                            <input 
                              type="text"
                              value={item.client_spec || ''}
                              onChange={(e) => handleUpdateItem(idx, 'client_spec', e.target.value)}
                              placeholder="e.g. Standard 10mm glass"
                              className="input-field"
                              style={{ padding: '6px 8px', fontSize: '11px' }}
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Our Proposed Spec (Comparison)</label>
                            <input 
                              type="text"
                              value={item.proposed_spec || item.our_offer || ''}
                              onChange={(e) => {
                                handleUpdateItem(idx, 'proposed_spec', e.target.value);
                                handleUpdateItem(idx, 'our_offer', e.target.value);
                              }}
                              placeholder="e.g. Saint-Gobain 10mm Toughened"
                              className="input-field"
                              style={{ padding: '6px 8px', fontSize: '11px' }}
                            />
                          </div>
                        </div>

                        {/* Upgrade Summary (AI Generated) */}
                        <div className="grid grid-cols-[1fr_80px] gap-2 items-end mb-2">
                          <div className="form-group mb-0">
                            <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Upgrade Summary (AI Generated)</label>
                            <input 
                              type="text"
                              value={item.upgrade_summary || ''}
                              onChange={(e) => handleUpdateItem(idx, 'upgrade_summary', e.target.value)}
                              placeholder="e.g. Upgraded to premium Saint-Gobain toughened glass for safety"
                              className="input-field"
                              style={{ padding: '6px 8px', fontSize: '11px' }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGenerateUpgradeSummary(idx)}
                            disabled={generatingUpgradeIdx === idx}
                            className="btn-outline py-1 text-[10px]"
                            style={{ height: '28px', padding: '0 4px', fontSize: '9px' }}
                          >
                            {generatingUpgradeIdx === idx ? 'Gen...' : '✨ AI Upgrade'}
                          </button>
                        </div>

                        <div className="form-group mb-2">
                          <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Hardware details (optional)</label>
                          <input 
                            type="text"
                            value={item.hardware || ''}
                            onChange={(e) => handleUpdateItem(idx, 'hardware', e.target.value)}
                            placeholder="e.g. A1 Kit · B3 Track · Silicone Clear"
                            className="input-field"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          />
                        </div>

                        {/* Dimensions tag list */}
                        <div className="form-group mb-0">
                          <label className="input-label" style={{ fontSize: '8px', marginBottom: '3px' }}>Dimensions / Sizes</label>
                          {item.sizes && item.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {item.sizes.map((sz, szIdx) => (
                                <span 
                                  key={szIdx} 
                                  className="inline-flex items-center gap-1.5 bg-zinc-200 border border-zinc-300 text-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono"
                                >
                                  {sz}
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveSizeFromItem(idx, szIdx)}
                                    className="text-rose-600 hover:text-red-700 font-bold"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {activeSizeItemIdx === idx ? (
                            <div className="grid grid-cols-[1fr_1fr_60px_40px] gap-1 items-center bg-zinc-50 p-2 rounded border border-zinc-200">
                              <input 
                                type="number" 
                                placeholder="W" 
                                value={sizeW}
                                onChange={(e) => setSizeW(e.target.value)}
                                className="input-field text-center font-mono"
                                style={{ padding: '4px 6px', fontSize: '10.5px' }}
                              />
                              <input 
                                type="number" 
                                placeholder="H" 
                                value={sizeH}
                                onChange={(e) => setSizeH(e.target.value)}
                                className="input-field text-center font-mono"
                                style={{ padding: '4px 6px', fontSize: '10.5px' }}
                              />
                              <select
                                value={sizeUnit}
                                onChange={(e) => setSizeUnit(e.target.value)}
                                className="input-field cursor-pointer"
                                style={{ padding: '4px 6px', fontSize: '10.5px' }}
                              >
                                <option value="mm">mm</option>
                                <option value="inches">inch</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleAddSizeToItem(idx)}
                                className="p-1 bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-white rounded flex justify-center items-center h-[26px]"
                              >
                                <CheckCircle size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSizeW('');
                                setSizeH('');
                                setActiveSizeItemIdx(idx);
                              }}
                              className="text-[10px] text-[var(--ui-accent)] hover:underline font-semibold block"
                            >
                              + Add Size Tag
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Schedule Settings */}
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                marginTop: '16px'
              }}>
                {/* Section header row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    color: 'var(--navy)'
                  }}>
                    Payment Schedule
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: 'var(--steel)',
                      background: 'var(--steel-pale)',
                      border: '1px solid rgba(58,97,134,0.2)',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    + Add
                  </button>
                </div>

                {/* Section content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeQuote.payment_schedule?.map((ms, idx) => (
                    <div key={idx} style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 28px',
                      gap: '6px',
                      alignItems: 'center'
                    }}>
                      <input
                        type="number"
                        placeholder="%"
                        value={ms.pct}
                        onChange={(e) => handleMilestoneChange(idx, 'pct', e.target.value)}
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--navy)',
                          background: 'var(--steel-pale)',
                          border: '1px solid rgba(58,97,134,0.2)',
                          padding: '7px 10px',
                          textAlign: 'center'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Milestone description..."
                        value={ms.milestone}
                        onChange={(e) => handleMilestoneChange(idx, 'milestone', e.target.value)}
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          color: 'var(--text)',
                          background: 'var(--white)',
                          border: '1px solid var(--border)',
                          padding: '7px 10px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        style={{
                          color: 'var(--red)',
                          background: 'transparent',
                          border: 'none',
                          fontSize: '16px',
                          cursor: 'pointer',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Steps (Visible only in proposal layout) */}
              {activeQuote.format === 'proposal' && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '16px',
                  marginTop: '16px'
                }}>
                  {/* Section header row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.10em',
                      color: 'var(--navy)'
                    }}>
                      Project Timeline
                    </span>
                    <button
                      type="button"
                      onClick={handleAddTimelineStep}
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: 'var(--steel)',
                        background: 'var(--steel-pale)',
                        border: '1px solid rgba(58,97,134,0.2)',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Section content */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeQuote.timeline_steps?.map((step, idx) => (
                      <div key={idx} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 28px',
                        gap: '6px',
                        alignItems: 'center'
                      }}>
                        <input
                          type="text"
                          placeholder="Timeline step details..."
                          value={step}
                          onChange={(e) => handleTimelineChange(idx, e.target.value)}
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '12px',
                            color: 'var(--text)',
                            background: 'var(--white)',
                            border: '1px solid var(--border)',
                            padding: '7px 10px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTimelineStep(idx)}
                          style={{
                            color: 'var(--red)',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '16px',
                            cursor: 'pointer',
                            lineHeight: 1
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Care Notes */}
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                marginTop: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    color: 'var(--navy)'
                  }}>
                    Care Notes
                  </span>
                </div>
                <textarea
                  placeholder="One entry per line..."
                  value={activeQuote.notes?.join('\n')}
                  onChange={(e) => handleTextareaListChange('notes', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: 'var(--text)',
                    background: 'var(--white)',
                    border: '1px solid var(--border)',
                    padding: '10px 12px',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: '1.6'
                  }}
                />
              </div>

              {/* Terms & Conditions */}
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                marginTop: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    color: 'var(--navy)'
                  }}>
                    Terms &amp; Conditions
                  </span>
                </div>
                <textarea
                  placeholder="One entry per line..."
                  value={activeQuote.terms?.join('\n')}
                  onChange={(e) => handleTextareaListChange('terms', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: 'var(--text)',
                    background: 'var(--white)',
                    border: '1px solid var(--border)',
                    padding: '10px 12px',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    )}

        {/* PANEL: HISTORY / DASHBOARD */}
        {activeTab === 'history' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in">
            <div className="panel-header">
              <h2><span>Quotes</span> Log</h2>
              <p>Select, duplicate, or delete historical quote records.</p>
            </div>
            
            <div className="panel-body overflow-y-auto sub-panel-content">
              <Dashboard 
                quotes={quotes}
                clients={clients}
                previewQuote={previewQuote}
                onPreviewQuote={(q) => setPreviewQuote(q)}
                onEditQuote={(q) => {
                  setActiveQuote({ ...q });
                  setIsDirty(false);
                  setPreviewQuote(null);
                  setActiveTab('form');
                }}
                onDuplicateQuote={handleDuplicateQuote}
                onDeleteQuote={handleDeleteQuote}
                onCreateNewQuote={handleResetQuote}
                onToggleStatus={handleToggleQuoteStatus}
                onViewSettings={() => setActiveTab('settings')}
                onViewClients={() => setActiveTab('clients')}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        )}

        {/* PANEL: CLIENTS CRM */}
        {activeTab === 'clients' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in">
            <div className="panel-header">
              <h2><span>Clients</span> Registry</h2>
              <p>Select contacts to pre-fill billing headers.</p>
            </div>
            
            {/* No panel-body wrapper — Clients manages its own scroll layout */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Clients 
                clients={clients}
                onSaveClient={handleSaveClientCRM}
                onDeleteClient={handleDeleteClientCRM}
                onBack={() => setActiveTab('form')}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        )}

        {/* PANEL: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in">
            <div className="panel-header">
              <h2><span>System</span> Settings</h2>
              <p>Manage default notes, catalog prices, API keys, and logo.</p>
            </div>
            
            <div className="panel-body overflow-y-auto">
              <Settings 
                settings={settings}
                onSaveSettings={handleSaveSettingsConfig}
                onBack={() => setActiveTab('form')}
                currentUserEmail={userEmail}
              />
            </div>
          </div>
        )}

      </div>
      )}

      {/* 3. RIGHT PREVIEW PANE (Flex fill, viewport preview canvas) */}
      <div className="preview-pane">
        
        {/* Document Format Controls Toolbar */}
        {!isPrinting && (
          <div className="preview-toolbar no-print">
            <div className="format-toggle">
              <button
                onClick={() => updateQuoteField('format', 'estimate')}
                className={`toggle-btn ${(previewQuote || activeQuote).format === 'estimate' ? 'active' : ''}`}
              >
                Premium Estimate
              </button>
              <button
                onClick={() => updateQuoteField('format', 'proposal')}
                className={`toggle-btn ${(previewQuote || activeQuote).format === 'proposal' ? 'active' : ''}`}
              >
                Project Proposal
              </button>
            </div>
          </div>
        )}

        {/* Live Preview Canvas */}
        <div className="w-full pb-28 flex justify-center">
          <DocumentPreview quote={previewQuote || activeQuote} settings={settings} />
        </div>

        {/* Bottom bar: Print / Save PDF button (full width, navy fill) */}
        {!isPrinting && (
          <div className="bottom-print-bar no-print">
            <button
              onClick={handlePrint}
              className="print-btn"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
          </div>
        )}
      </div>

      {/* 4. NEW QUOTE WIZARD DIALOG OVERLAY */}
      {showNewQuoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E2DE',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
            padding: '24px',
            maxWidth: '360px',
            width: '100%',
            fontFamily: 'Inter, sans-serif',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '800',
              color: '#1A1A1A',
              marginBottom: '4px',
              fontFamily: 'Outfit, sans-serif',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>New Quote Setup</h3>
            <p style={{
              fontSize: '11px',
              color: '#6B7280',
              marginBottom: '20px',
              textAlign: 'center'
            }}>Select your preferred project builder method.</p>
            
            <div style={{ marginBottom: '24px' }}>
              {/* Option 1: AI Assistant */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: newQuoteOption === 'ai' ? '1.5px solid var(--ui-accent, #B8933E)' : '1px solid #E2E2DE',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: newQuoteOption === 'ai' ? '#FBF6EE' : '#FFFFFF',
                  transition: 'all 0.2s ease',
                  marginBottom: '10px'
                }}
                onClick={() => setNewQuoteOption('ai')}
              >
                <input 
                  type="radio" 
                  name="newQuoteMode" 
                  value="ai" 
                  checked={newQuoteOption === 'ai'} 
                  onChange={() => setNewQuoteOption('ai')}
                  style={{
                    width: '15px',
                    height: '15px',
                    accentColor: 'var(--ui-accent, #B8933E)',
                    cursor: 'pointer'
                  }}
                />
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', display: 'block' }}>Build with AI Assistant</span>
                  <span style={{ fontSize: '10px', color: '#6B7280', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>Parse BOQ texts and emails to auto-populate form</span>
                </div>
              </label>
              
              {/* Option 2: Build Yourself */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: newQuoteOption === 'manual' ? '1.5px solid var(--ui-accent, #B8933E)' : '1px solid #E2E2DE',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: newQuoteOption === 'manual' ? '#FBF6EE' : '#FFFFFF',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setNewQuoteOption('manual')}
              >
                <input 
                  type="radio" 
                  name="newQuoteMode" 
                  value="manual" 
                  checked={newQuoteOption === 'manual'} 
                  onChange={() => setNewQuoteOption('manual')}
                  style={{
                    width: '15px',
                    height: '15px',
                    accentColor: 'var(--ui-accent, #B8933E)',
                    cursor: 'pointer'
                  }}
                />
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', display: 'block' }}>Self Build / Build Manually</span>
                  <span style={{ fontSize: '10px', color: '#6B7280', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>Fill out quotes, rates, and terms manually</span>
                </div>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowNewQuoteModal(false)}
                className="btn-outline"
                style={{ flex: 1, padding: '10px 0', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (newQuoteOption === 'ai') {
                    handleStartAIQuote();
                  } else {
                    handleStartManualQuote();
                  }
                }}
                className="btn"
                style={{ flex: 1, padding: '10px 0', justifyContent: 'center' }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PrintTip overlay JSX */}
      {showPrintTip && (
        <div className="no-print print-tip-overlay" style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1B2B45',
          color: '#fff',
          padding: '12px 20px',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          zIndex: 9999,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          ⚠️ In the print dialog, uncheck <strong>"Headers and footers"</strong> to remove the URL from the PDF.
        </div>
      )}

    </div>
  );
}
