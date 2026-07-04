import React, { useState, useMemo } from 'react';
import { Plus, Search, Copy, Edit3, Trash2 } from 'lucide-react';

/* ─── Main Dashboard ──────────────────────────────────────────────────────── */
export default function Dashboard({ 
  quotes, 
  onEditQuote, 
  onDuplicateQuote, 
  onDeleteQuote, 
  onCreateNewQuote,
  onToggleStatus,
  isAdmin
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const stats = useMemo(() => {
    const total = quotes.length;
    const finalised = quotes.filter(q => q.status === 'Finalised' || q.status === 'Approved');
    const totalRevenue = finalised.reduce((sum, q) => sum + (parseFloat(q.total) || 0), 0);
    return { total, finalised: finalised.length, finalisedRevenue: totalRevenue };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    const filtered = quotes.filter(q => {
      const matchesSearch =
        q.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.reference && q.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const getVal = (val) => {
        if (!val) return 0;
        const parsed = new Date(val).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      const timeA = getVal(a.updated_at) || getVal(a.created_at) || getVal(a.date);
      const timeB = getVal(b.updated_at) || getVal(b.created_at) || getVal(b.date);
      return timeB - timeA;
    });
  }, [quotes, searchTerm, statusFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No Date';
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    const day = String(parsed.getDate()).padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
  };

  return (
    <div className="space-y-4 animate-fade-in no-print">

      {/* Quick Summary Row */}
      <div className="grid grid-cols-2 gap-2 bg-white border border-[var(--ui-border)] p-4 rounded-xl text-xs shadow-sm">
        <div>
          <span className="text-[9px] text-[var(--ui-text-muted)] uppercase block font-bold tracking-wider">Finalised Projects</span>
          <strong className="text-md font-outfit text-[var(--ui-accent,#B8933E)]">
            {stats.finalised} / {stats.total}
          </strong>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-[var(--ui-text-muted)] uppercase block font-bold tracking-wider">Revenue Secured</span>
          <strong className="text-md font-mono text-zinc-800">
            ₹{stats.finalisedRevenue.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>

      {/* Filters + New Quote */}
      <div className="bg-white border border-[var(--ui-border)] p-4 rounded-xl space-y-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-[var(--ui-text-muted)]" size={14} />
            <input
              type="text"
              placeholder="Search quote #, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-8 text-xs w-full"
              style={{ padding: '6px 8px 6px 28px' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field cursor-pointer text-xs w-full"
            style={{ padding: '6px 8px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Finalised">Finalised</option>
            <option value="Sent">Sent</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
        <button onClick={onCreateNewQuote} className="btn text-xs py-1.5 w-full mt-1">
          <Plus size={14} /> New Blank Quote
        </button>
      </div>

      {/* Quotes list */}
      {filteredQuotes.length === 0 ? (
        <div className="border border-[var(--ui-border)] border-dashed rounded-lg p-6 text-center text-xs mt-4">
          <h4 className="font-semibold text-zinc-700">No Quotes Found</h4>
          <p className="text-[10px] text-[var(--ui-text-muted)] mt-1">
            Create a new quote or adjust filters to view items.
          </p>
        </div>
      ) : (
        <div className="history-list mt-4">
          {filteredQuotes.map((q) => (
            <QuoteCard
              key={q.id}
              q={q}
              formatDate={formatDate}
              onEdit={() => onEditQuote(q)}
              onDuplicate={() => onDuplicateQuote(q)}
              onDelete={() => onDeleteQuote(q.id)}
              onToggleStatus={() => onToggleStatus && onToggleStatus(q)}
            />
          ))}
        </div>
      )}

    </div>
  );
}

/* ─── Isolated Quote Card — 100% inline styles, zero CSS conflict ─────────── */
function QuoteCard({ q, formatDate, onEdit, onDuplicate, onDelete, onToggleStatus }) {
  const [loadHover, setLoadHover]  = useState(false);
  const [dupHover,  setDupHover]   = useState(false);
  const [delHover,  setDelHover]   = useState(false);

  /* Shared base for all three action buttons */
  const btnBase = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '6px',
    margin:          0,
    padding:        '7px 0',
    border:         'none',
    outline:        'none',
    cursor:         'pointer',
    fontFamily:     'Inter, sans-serif',
    fontWeight:      600,
    fontSize:       '11.5px',
    lineHeight:      1,
    transition:     'background 0.15s ease, color 0.15s ease',
    userSelect:     'none',
  };

  return (
    <div
      style={{
        background:   'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)',
        border:       '1px solid #EAE5D8',
        borderRadius: '16px',
        padding:      '16px 18px 14px',
        position:     'relative',
        overflow:     'hidden',
        boxShadow:    '0 1px 1px rgba(18,33,63,0.03), 0 4px 10px rgba(18,33,63,0.04), 0 16px 32px -14px rgba(18,33,63,0.14)',
      }}
    >

      {/* ── Top accent bar ─────────────────────────────────────────────────── */}
      <div style={{
        position:   'absolute',
        top: 0, left: 0, right: 0,
        height:     '3px',
        background: 'linear-gradient(90deg, #0D1B33 0%, #B98A2E 55%, #E9D6A6 100%)',
      }} />

      {/* ── Row 1: Quote ID + Status pill ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
        
        <span style={{
          fontFamily:        'Plus Jakarta Sans, sans-serif',
          fontWeight:         700,
          fontSize:          '13.5px',
          color:             '#12213F',
          letterSpacing:     '0.6px',
          fontVariantNumeric:'tabular-nums',
        }}>
          {q.quote_number}
        </span>

        {/* Ghost status pill */}
        <div
          onClick={onToggleStatus}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '5px',
            border:       '1px solid #E4D2A0',
            borderRadius: '100px',
            padding:      '3px 9px 3px 7px',
            cursor:       'pointer',
            background:   'transparent',
          }}
        >
          {/* Glowing dot */}
          <div style={{
            width:       '5px',
            height:      '5px',
            borderRadius:'50%',
            background:  '#B98A2E',
            boxShadow:   '0 0 0 3px rgba(185,138,46,0.15)',
            flexShrink:   0,
          }} />
          <span style={{
            fontSize:      '9.5px',
            fontWeight:     700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color:         '#8A6417',
            lineHeight:     1,
          }}>
            {q.status}
          </span>
        </div>
      </div>

      {/* ── Row 2: Customer name (left, truncating) + Date (right, no-wrap) ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          fontFamily:    'Plus Jakarta Sans, sans-serif',
          fontWeight:     700,
          fontSize:      '15.5px',
          color:         '#12213F',
          letterSpacing: '-0.1px',
          whiteSpace:    'nowrap',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          minWidth:       0,       /* allows flex truncation */
        }}>
          {q.client_name || 'Unnamed Client'}
        </div>
        <div style={{ fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span style={{ color: '#767F9C', fontWeight: 400 }}>Created </span>
          <span style={{ color: '#12213F', fontWeight: 600 }}>{formatDate(q.date)}</span>
        </div>
      </div>

      {/* ── Fade-edge divider ───────────────────────────────────────────────── */}
      <div style={{
        height:     '1px',
        background: 'linear-gradient(90deg, transparent, #EAE5D8 15%, #EAE5D8 85%, transparent)',
        margin:     '0 0 12px 0',
      }} />

      {/* ── Row 3: Values ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>

        {/* Left: Value Ex. GST (muted, secondary) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{
            fontSize:      '9px',
            fontWeight:     600,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color:         '#767F9C',
            marginBottom:  '2px',
          }}>
            Value Ex. GST
          </span>
          <span style={{
            fontFamily:        'Plus Jakarta Sans, sans-serif',
            fontWeight:         700,
            fontSize:          '14px',
            color:             '#A6ACC0',
            fontVariantNumeric:'tabular-nums',
          }}>
            ₹{Math.round(parseFloat(q.subtotal) || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Right: Grand Inc. GST (hero number) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{
            fontSize:      '9px',
            fontWeight:     600,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color:         '#8A6417',
            marginBottom:  '2px',
          }}>
            Grand Inc. GST
          </span>
          <span style={{
            fontFamily:        'Plus Jakarta Sans, sans-serif',
            fontWeight:         800,
            fontSize:          '19px',
            color:             '#0D1B33',
            letterSpacing:     '-0.2px',
            fontVariantNumeric:'tabular-nums',
            lineHeight:         1.1,
          }}>
            ₹{Math.round(parseFloat(q.total) || 0).toLocaleString('en-IN')}
          </span>
          {/* Gold gradient underline accent below the hero number */}
          <div style={{
            height:       '2px',
            marginTop:    '3px',
            width:        '100%',
            background:   'linear-gradient(90deg, transparent, #B98A2E 60%, #B98A2E)',
            borderRadius: '2px',
          }} />
        </div>
      </div>

      {/* ── Row 4: Action bar ──────────────────────────────────────────────── */}
      {/* 
        One pill-shaped container. Load & Duplicate: flex:1 equal width.
        Delete: fixed 40px icon-only. Each separated by a 1px #EAE5D8 divider border.
        Hover states driven by React state (not CSS) so global stylesheet cannot override.
      */}
      <div style={{
        display:      'flex',
        alignItems:   'stretch',
        border:       '1px solid #EAE5D8',
        borderRadius: '10px',
        overflow:     'hidden',
      }}>

        {/* Load */}
        <button
          onClick={onEdit}
          onMouseEnter={() => setLoadHover(true)}
          onMouseLeave={() => setLoadHover(false)}
          title="Load & Edit Quote"
          style={{
            ...btnBase,
            flex:        1,
            borderRight: '1px solid #EAE5D8',
            background:  loadHover ? '#FBF6EA' : 'transparent',
            color:       loadHover ? '#8A6417' : '#12213F',
          }}
        >
          <Edit3 size={13} strokeWidth={2} stroke="currentColor" />
          Load
        </button>

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          onMouseEnter={() => setDupHover(true)}
          onMouseLeave={() => setDupHover(false)}
          title="Duplicate Quote"
          style={{
            ...btnBase,
            flex:        1,
            borderRight: '1px solid #EAE5D8',
            background:  dupHover ? '#FBF6EA' : 'transparent',
            color:       dupHover ? '#8A6417' : '#12213F',
          }}
        >
          <Copy size={13} strokeWidth={2} stroke="currentColor" />
          Duplicate
        </button>

        {/* Delete — fixed 40px, icon only */}
        <button
          onClick={onDelete}
          onMouseEnter={() => setDelHover(true)}
          onMouseLeave={() => setDelHover(false)}
          title="Delete Quote"
          style={{
            ...btnBase,
            flex:       'none',
            width:      '40px',
            padding:    '7px 0',
            background: delHover ? '#FBF1EE' : 'transparent',
            color:      delHover ? '#B4483A' : '#9C8A78',
          }}
        >
          <Trash2 size={13} strokeWidth={2} stroke="currentColor" />
        </button>

      </div>
    </div>
  );
}
