import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, FileText, Settings, Users, Plus, 
  Trash2, ChevronUp, ChevronDown, Save, Printer, Check 
} from 'lucide-react';
import DocumentPreview from './DocumentPreview';

export default function Builder({ 
  quote: initialQuote, 
  clients, 
  settings, 
  onSaveQuote, 
  onBack 
}) {
  const [activeTab, setActiveTab] = useState('ai');
  const [quote, setQuote] = useState({
    quote_number: 'MEA-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)),
    client_name: '',
    gstin: '',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
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
    total: 0,
    ...initialQuote
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');

  // Calculate totals whenever items, adjustment or format changes
  useEffect(() => {
    let sub = 0;
    (quote.items || []).forEach(item => {
      sub += (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    });

    let taxAmount = 0;
    let finalTot = sub;

    if (quote.format === 'proposal') {
      taxAmount = sub * 0.18;
      finalTot = sub + taxAmount + (parseFloat(quote.adjustment) || 0);
    } else {
      // Estimate layout - GST is computed but not added as a separate row in totals, or it is inclusive. 
      // We will follow target: Subtotal + Adjustment is final total
      finalTot = sub + (parseFloat(quote.adjustment) || 0);
    }

    setQuote(prev => ({
      ...prev,
      subtotal: sub,
      tax: taxAmount,
      total: finalTot
    }));
  }, [quote.items, quote.adjustment, quote.format]);

  // Handle Client Select
  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setQuote(prev => ({
        ...prev,
        client_name: client.name,
        gstin: client.gstin || '',
      }));
    }
  };

  // Form Field Updates
  const updateField = (field, val) => {
    setQuote(prev => ({ ...prev, [field]: val }));
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
          sizes: []
        }
      : {
          name: 'New Custom Glass Item',
          specs: ['10mm Toughened'],
          desc: 'Description of glass systems...',
          qty: 10,
          unit: 'sqft',
          rate: 500,
          sizes: []
        };
    
    setQuote(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const handleUpdateItem = (index, field, val) => {
    const itemsList = [...quote.items];
    itemsList[index][field] = val;
    setQuote(prev => ({ ...prev, items: itemsList }));
  };

  const handleUpdateItemSpecs = (index, commaString) => {
    const itemsList = [...quote.items];
    itemsList[index].specs = commaString.split(',').map(s => s.trim()).filter(s => s);
    setQuote(prev => ({ ...prev, items: itemsList }));
  };

  const handleAddSizeToItem = (index, w, h, unit = 'mm') => {
    if (!w || !h) return;
    const itemsList = [...quote.items];
    const newSize = `${w} × ${h} ${unit}`;
    itemsList[index].sizes = [...(itemsList[index].sizes || []), newSize];
    setQuote(prev => ({ ...prev, items: itemsList }));
  };

  const handleRemoveSizeFromItem = (itemIndex, sizeIndex) => {
    const itemsList = [...quote.items];
    itemsList[itemIndex].sizes = itemsList[itemIndex].sizes.filter((_, idx) => idx !== sizeIndex);
    setQuote(prev => ({ ...prev, items: itemsList }));
  };

  const handleRemoveItem = (index) => {
    const itemsList = quote.items.filter((_, idx) => idx !== index);
    setQuote(prev => ({ ...prev, items: itemsList }));
  };

  const handleMoveItem = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === quote.items.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const itemsList = [...quote.items];
    const temp = itemsList[index];
    itemsList[index] = itemsList[targetIdx];
    itemsList[targetIdx] = temp;

    setQuote(prev => ({ ...prev, items: itemsList }));
  };

  // Payment Schedule Milestones
  const handleMilestoneChange = (index, field, val) => {
    const list = [...quote.payment_schedule];
    list[index][field] = field === 'pct' ? (parseFloat(val) || 0) : val;
    setQuote(prev => ({ ...prev, payment_schedule: list }));
  };

  // Timeline list updates
  const handleTimelineChange = (index, val) => {
    const list = [...quote.timeline_steps];
    list[index] = val;
    setQuote(prev => ({ ...prev, timeline_steps: list }));
  };

  // Notes and terms updates
  const handleTextareaListChange = (field, textValue) => {
    const list = textValue.split('\n').filter(l => l.trim() !== '');
    setQuote(prev => ({ ...prev, [field]: list }));
  };

  // Preset Prompts loader
  const loadPresetPrompt = (presetId) => {
    if (presetId === 1) {
      setAiPrompt(`Draft a proposal for Mr. Chandru. 
He wants 228 sqft of our Meaven Minimalist Fixed Partition Series at 320/sqft, and 2 swing door units at 23000/unit.
Also add 2000 for transport and logistics.
Use our standard execution certainty project intro and a 10-day timeline. Payment is 60% advance, 30% dispatch, 10% handover.`);
    } else if (presetId === 2) {
      setAiPrompt(`Estimate number EST-000565 for Mr. Prashad, GSTIN: 29AAMCM4939R2ZA. 
Quote:
- Shower Enclosures (sliding) 186 sqft at 750/sqft. Specs: Saint Gobain 8MM Toughened Clear, Hardware Gold, No Profile. Sizes: 1950x2100, 1980x2100, 1920x2100, 2040x2100. Hardware A1 Kit, B3 Track.
- Pergola glass 300 sqft at 690/sqft. Specs: Saint Gobain SCN-145, Toughened + Laminated. 6MM + 1.5MM Laminated + 6MM composite build.
- Glass Railing 304 Gold 250 sqft at 900/sqft. Specs: 12MM Toughened, Grade 304, Gold Finish.
- Transportation 1 lumpsum at 7000.
Apply a discount adjustment of -18025. Payment is 50% advance, 45% dispatch, 5% completion.`);
    }
  };

  // AI Prompt Parsing Handler
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a description first.');
      return;
    }

    setLoadingAI(true);
    const key = settings.geminiApiKey?.trim();

    if (key) {
      // LIVE GEMINI API MODE
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const systemPrompt = `You are a structured parser for Meaven Designs, a glass solution company. 
Your job is to read a raw quote description or request text, and output a clean JSON object representing the quote.
Output ONLY raw JSON matching this format (no markdown code fences like \`\`\`json):
{
  "client_name": "...",
  "gstin": "...",
  "estimate_no": "...",
  "date": "...",
  "validity": "...",
  "reference": "...",
  "adjustment": 0,
  "format": "proposal" or "estimate",
  "items": [
    {
      "name": "Item Name",
      "specs": ["spec1", "spec2"],
      "desc": "Short description",
      "qty": 100,
      "unit": "sqft" or "Units" or "lumpsum",
      "rate": 500,
      "sizes": ["size 1"]
    }
  ],
  "paymentSchedule": [
    { "pct": 50, "milestone": "..." },
    { "pct": 50, "milestone": "..." }
  ]
}`;

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
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(jsonText);

        // Load into state
        setQuote(prev => ({
          ...prev,
          client_name: parsed.client_name || prev.client_name,
          gstin: parsed.gstin || prev.gstin,
          quote_number: parsed.estimate_no || prev.quote_number,
          date: parsed.date || prev.date,
          validity: parsed.validity || prev.validity,
          reference: parsed.reference || prev.reference,
          adjustment: parsed.adjustment || 0,
          format: parsed.format || prev.format,
          items: parsed.items || [],
          payment_schedule: parsed.paymentSchedule || prev.payment_schedule
        }));

        setActiveTab('manual');
        alert('AI successfully loaded quote details!');
      } catch (err) {
        console.error('Gemini API call failed, using simulator:', err);
        alert('Gemini Live API failed. Falling back to Local Simulator Mode.');
        simulateAI(aiPrompt);
      } finally {
        setLoadingAI(false);
      }
    } else {
      // SIMULATOR MODE
      await new Promise(r => setTimeout(r, 1000));
      simulateAI(aiPrompt);
      setLoadingAI(false);
    }
  };

  const simulateAI = (text) => {
    // Simulator mock logic matching keywords
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
            qty: 228,
            unit: 'sqft',
            rate: 320,
            sizes: ['Standard Partition Panels']
          },
          {
            name: 'Meaven Precision Swing Door System',
            specs: ['12mm Toughened', 'Ozone Hardware', 'Hydraulic Soft-Close'],
            desc: 'Frameless swing system with integrated hydraulic control for seamless transition and "soft-close" safety.',
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
        quote_number: 'MEA-' + Math.floor(1000 + Math.random() * 9000),
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

    setQuote(prev => ({
      ...prev,
      ...data,
      payment_schedule: data.paymentSchedule || prev.payment_schedule
    }));
    setActiveTab('manual');
    alert('AI generated quote details successfully loaded!');
  };

  // Dimensions inputs states
  const [sizeW, setSizeW] = useState('');
  const [sizeH, setSizeH] = useState('');
  const [sizeUnit, setSizeUnit] = useState('mm');
  const [activeItemSizeIdx, setActiveItemSizeIdx] = useState(null);

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      
      {/* LEFT SIDEBAR: INPUT FORMS */}
      <div className="w-full lg:w-[480px] shrink-0 bg-[var(--ui-surface)] border-r border-[var(--ui-border)] flex flex-col h-full z-10 no-print sidebar">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-1.5 hover:bg-zinc-800 text-[var(--ui-text-muted)] hover:text-white rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="font-extrabold text-white font-outfit text-md">
                MEAVEN <span className="text-[var(--ui-accent)]">Builder</span>
              </h2>
              <span className="text-[10px] text-[var(--ui-text-muted)] block">Drafting quote details</span>
            </div>
          </div>
          <button
            onClick={() => onSaveQuote(quote)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-zinc-950 rounded-lg text-xs font-semibold transition-colors shadow-lg"
          >
            <Save size={14} /> Save Draft
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[var(--ui-bg)] border-b border-[var(--ui-border)]">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 text-center ${
              activeTab === 'ai' ? 'text-[var(--ui-accent)] border-[var(--ui-accent)] bg-[var(--ui-surface)]' : 'text-[var(--ui-text-muted)] border-transparent'
            }`}
          >
            AI Assistant
          </button>
          
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 text-center ${
              activeTab === 'manual' ? 'text-[var(--ui-accent)] border-[var(--ui-accent)] bg-[var(--ui-surface)]' : 'text-[var(--ui-text-muted)] border-transparent'
            }`}
          >
            Edit Form
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 text-center ${
              activeTab === 'items' ? 'text-[var(--ui-accent)] border-[var(--ui-accent)] bg-[var(--ui-surface)]' : 'text-[var(--ui-text-muted)] border-transparent'
            }`}
          >
            Items ({quote.items?.length || 0})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* TAB A: AI PANELS */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[var(--ui-card)] border border-[var(--ui-border)] p-3.5 rounded-lg text-xs text-[var(--ui-text-muted)] flex items-start gap-2">
                <Sparkles size={14} className="text-[var(--ui-accent)] shrink-0 mt-0.5" />
                <div>
                  {settings.geminiApiKey ? (
                    <span className="text-emerald-400 font-semibold block">🟢 Gemini Live AI Mode Active</span>
                  ) : (
                    <span className="text-amber-400 font-semibold block">🟠 AI Simulator Mode Active</span>
                  )}
                  <span>Describe the project or paste client requests below to auto-build items, prices, specs, and totals.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                  Enter BOQ details / Prompt description
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows="7"
                  className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--ui-accent)] resize-none"
                  placeholder="e.g. Estimate for Mr. Prashad: Gold hardware sliding shower enclosure 186 sqft at 750/sqft..."
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={loadingAI}
                className="w-full py-2.5 bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] disabled:opacity-50 text-zinc-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {loadingAI ? (
                  <>
                    <span className="h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                    AI is calculating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Generate from AI
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-[var(--ui-border)]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-2">
                  Try Demo Prompt Presets
                </label>
                <div className="space-y-2.5">
                  <div 
                    onClick={() => loadPresetPrompt(1)}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="block text-xs font-bold text-white mb-0.5">Preset 1: Standard Partition BOQ</span>
                    <p className="text-[10px] text-[var(--ui-text-muted)] line-clamp-2">
                      "Draft a proposal for Mr. Chandru. Quote 228 sqft partition at 320/sqft and 2 swing door units at 23000..."
                    </p>
                  </div>
                  
                  <div 
                    onClick={() => loadPresetPrompt(2)}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="block text-xs font-bold text-white mb-0.5">Preset 2: Multi-Item Gold Glass Railing</span>
                    <p className="text-[10px] text-[var(--ui-text-muted)] line-clamp-2">
                      "Estimate EST-000565 for Mr. Prashad. Shower enclosures 186 sqft, pergola glass 300 sqft..."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB B: ESTIMATE DETAILS */}
          {activeTab === 'manual' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                  Select Saved Client (Optional)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ui-accent)] cursor-pointer"
                >
                  <option value="">-- Choose saved contact --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                    Client / Billed To *
                  </label>
                  <input 
                    type="text"
                    value={quote.client_name}
                    onChange={(e) => updateField('client_name', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ui-accent)]"
                    placeholder="Mr. Prashad"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                    Client GSTIN
                  </label>
                  <input 
                    type="text"
                    value={quote.gstin}
                    onChange={(e) => updateField('gstin', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[var(--ui-accent)]"
                    placeholder="29AAMCM..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                    Quote Number *
                  </label>
                  <input 
                    type="text"
                    value={quote.quote_number}
                    onChange={(e) => updateField('quote_number', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[var(--ui-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                    Reference / Project
                  </label>
                  <input 
                    type="text"
                    value={quote.reference || ''}
                    onChange={(e) => updateField('reference', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ui-accent)]"
                    placeholder="HSR Site Villa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                    Date
                  </label>
                  <input 
                    type="text"
                    value={quote.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ui-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                    Validity
                  </label>
                  <input 
                    type="text"
                    value={quote.validity}
                    onChange={(e) => updateField('validity', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ui-accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                    Status
                  </label>
                  <select 
                    value={quote.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ui-accent)] cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                    Adjustment (Discounts are negative)
                  </label>
                  <input 
                    type="number"
                    value={quote.adjustment}
                    onChange={(e) => updateField('adjustment', parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ui-accent)]"
                  />
                </div>
              </div>

              {/* Payment Schedule Settings */}
              <div className="border-t border-[var(--ui-border)] pt-4 mt-2">
                <span className="block text-xs font-bold text-[var(--ui-accent)] uppercase tracking-wider mb-3">Payment Milestones</span>
                {quote.payment_schedule?.map((ms, idx) => (
                  <div key={idx} className="grid grid-cols-[60px_1fr] gap-2 mb-2">
                    <input 
                      type="number"
                      value={ms.pct}
                      onChange={(e) => handleMilestoneChange(idx, 'pct', e.target.value)}
                      placeholder="%"
                      className="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded text-xs text-white p-2 focus:outline-none text-center"
                    />
                    <input 
                      type="text"
                      value={ms.milestone}
                      onChange={(e) => handleMilestoneChange(idx, 'milestone', e.target.value)}
                      placeholder="Milestone description..."
                      className="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded text-xs text-white p-2 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Timeline Steps (Visible only in proposal layout) */}
              {quote.format === 'proposal' && (
                <div className="border-t border-[var(--ui-border)] pt-4 mt-2">
                  <span className="block text-xs font-bold text-[var(--ui-accent)] uppercase tracking-wider mb-3">Project Timeline (Day-by-Day)</span>
                  {quote.timeline_steps?.map((step, idx) => (
                    <div key={idx} className="mb-2">
                      <label className="block text-[9px] text-[var(--ui-text-muted)] mb-0.5">Step {idx+1}</label>
                      <input 
                        type="text"
                        value={step}
                        onChange={(e) => handleTimelineChange(idx, e.target.value)}
                        className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded text-xs text-white p-2 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* T&C Textareas */}
              <div className="border-t border-[var(--ui-border)] pt-4 mt-2 grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">Care Notes</span>
                  <textarea
                    rows="4"
                    value={quote.notes?.join('\n')}
                    onChange={(e) => handleTextareaListChange('notes', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded p-2 text-[10px] text-white focus:outline-none resize-none font-sans"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">Terms &amp; Conditions</span>
                  <textarea
                    rows="4"
                    value={quote.terms?.join('\n')}
                    onChange={(e) => handleTextareaListChange('terms', e.target.value)}
                    className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded p-2 text-[10px] text-white focus:outline-none resize-none font-sans"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB C: LINE ITEMS LIST */}
          {activeTab === 'items' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[var(--ui-card)] border border-[var(--ui-border)] p-3 rounded-lg">
                <label className="block text-[9px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-1.5">Add Predefined Product</label>
                <div className="flex gap-2">
                  <select
                    id="predefinedSelect"
                    className="flex-1 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    {settings.predefinedProducts.map((p, idx) => (
                      <option key={idx} value={idx}>{p.name} (₹{p.rate})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = document.getElementById('predefinedSelect').value;
                      const product = settings.predefinedProducts[idx];
                      if (product) handleAddItem(product);
                    }}
                    className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Active Items List</span>
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="text-xs text-[var(--ui-accent)] hover:underline font-bold"
                >
                  + Add Empty Item
                </button>
              </div>

              <div className="space-y-4">
                {quote.items?.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 bg-[var(--ui-card)] border border-[var(--ui-border)] rounded-xl relative space-y-3"
                  >
                    {/* Item Controls Header */}
                    <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-[var(--ui-accent)]">Item {String(idx+1).padStart(2, '0')}</span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, 'up')}
                          className="p-1 hover:bg-zinc-800 text-[var(--ui-text-muted)] hover:text-white rounded"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, 'down')}
                          className="p-1 hover:bg-zinc-800 text-[var(--ui-text-muted)] hover:text-white rounded"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 hover:bg-zinc-800 text-rose-500 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[8px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-0.5">Item Name</label>
                        <input 
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-0.5">Qty</label>
                          <input 
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-0.5">Unit</label>
                          <input 
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                            className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-0.5">Rate (₹)</label>
                          <input 
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleUpdateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-0.5">Specifications (comma separated)</label>
                        <input 
                          type="text"
                          value={item.specs?.join(', ')}
                          onChange={(e) => handleUpdateItemSpecs(idx, e.target.value)}
                          className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-0.5">Short Description</label>
                        <textarea 
                          rows="2"
                          value={item.desc}
                          onChange={(e) => handleUpdateItem(idx, 'desc', e.target.value)}
                          className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded px-2.5 py-1 text-xs text-white focus:outline-none resize-none font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-0.5">Hardware Details (optional)</label>
                        <input 
                          type="text"
                          value={item.hardware || ''}
                          onChange={(e) => handleUpdateItem(idx, 'hardware', e.target.value)}
                          placeholder="e.g. A1 Kit · B3 Track · Silicone Clear"
                          className="w-full bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* Sizes Panel */}
                      <div>
                        <label className="block text-[8px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">Dimensions / Sizes</label>
                        {item.sizes && item.sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.sizes.map((sz, szIdx) => (
                              <span 
                                key={szIdx} 
                                className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 pl-2 pr-1.5 py-0.5 rounded text-[10px]"
                              >
                                {sz}
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveSizeFromItem(idx, szIdx)}
                                  className="text-[var(--ui-danger)] hover:text-red-400 font-bold"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {activeItemSizeIdx === idx ? (
                          <div className="grid grid-cols-[1fr_1fr_60px_40px] gap-1 items-center bg-[var(--ui-bg)] p-2 rounded border border-[var(--ui-border)]">
                            <input 
                              type="number" 
                              placeholder="W" 
                              value={sizeW}
                              onChange={(e) => setSizeW(e.target.value)}
                              className="w-full bg-[var(--ui-card)] border border-[var(--ui-border)] rounded p-1 text-[10px] text-white text-center"
                            />
                            <input 
                              type="number" 
                              placeholder="H" 
                              value={sizeH}
                              onChange={(e) => setSizeH(e.target.value)}
                              className="w-full bg-[var(--ui-card)] border border-[var(--ui-border)] rounded p-1 text-[10px] text-white text-center"
                            />
                            <select
                              value={sizeUnit}
                              onChange={(e) => setSizeUnit(e.target.value)}
                              className="bg-[var(--ui-card)] border border-[var(--ui-border)] rounded p-1 text-[10px] text-white"
                            >
                              <option value="mm">mm</option>
                              <option value="inches">inch</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddSizeToItem(idx, sizeW, sizeH, sizeUnit);
                                setSizeW('');
                                setSizeH('');
                                setActiveItemSizeIdx(null);
                              }}
                              className="p-1 bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-zinc-950 rounded flex justify-center items-center"
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveItemSizeIdx(idx)}
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
          )}

        </div>
      </div>

      {/* RIGHT SIDEBAR: LIVE A4 PREVIEW */}
      <div className="flex-1 bg-[#EBEAE6] overflow-y-auto flex flex-col items-center h-full relative preview-pane">
        
        {/* Document Format Controls Toolbar */}
        <div className="w-full max-w-[820px] bg-[var(--ui-card)] border border-[var(--ui-border)] rounded-lg p-3 my-4 flex items-center justify-between shadow-md no-print preview-toolbar px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateField('format', 'proposal')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                quote.format === 'proposal' 
                  ? 'bg-[var(--ui-accent)] text-zinc-950' 
                  : 'bg-zinc-800 text-[var(--ui-text-muted)] hover:text-white'
              }`}
            >
              1. Project Proposal
            </button>
            
            <button
              onClick={() => updateField('format', 'estimate')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                quote.format === 'estimate' 
                  ? 'bg-[var(--ui-accent)] text-zinc-950' 
                  : 'bg-zinc-800 text-[var(--ui-text-muted)] hover:text-white'
              }`}
            >
              2. Premium Estimate
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold border border-[var(--ui-border)] transition-colors"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-zinc-900 border border-[var(--ui-border)] text-zinc-300 hover:text-white text-xs font-semibold rounded transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Live Canvas */}
        <div className="w-full px-4 pb-20 flex justify-center">
          <DocumentPreview quote={quote} settings={settings} />
        </div>
      </div>

    </div>
  );
}
