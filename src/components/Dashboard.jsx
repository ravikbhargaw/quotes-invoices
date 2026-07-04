import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, FileText, Copy, Edit3, Trash2, 
  Database
} from 'lucide-react';

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

  // Stats Calculations (Compact)
  const stats = useMemo(() => {
    const total = quotes.length;
    const finalised = quotes.filter(q => q.status === 'Finalised' || q.status === 'Approved');
    const totalRevenue = finalised.reduce((sum, q) => sum + (parseFloat(q.total) || 0), 0);
    return {
      total,
      finalised: finalised.length,
      finalisedRevenue: totalRevenue
    };
  }, [quotes]);

  // Filter & Sort Quotes (Sorted by date descending by default)
  const filteredQuotes = useMemo(() => {
    const filtered = quotes.filter(q => {
      const matchesSearch = 
        q.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.reference && q.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort descending by updated_at / created_at timestamp to ensure the newest is always on top
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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Finalised':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 cursor-pointer';
      case 'Sent':
        return 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100 cursor-pointer';
      case 'Declined':
        return 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 cursor-pointer';
      default: // Draft
        return 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100 cursor-pointer';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in no-print">
      
      {/* Quick Summary Row */}
      <div className="grid grid-cols-2 gap-2 bg-white border border-[var(--ui-border)] p-4 rounded-xl text-xs shadow-sm">
        <div>
          <span className="text-[9px] text-[var(--ui-text-muted)] uppercase block font-bold tracking-wider">Finalised Projects</span>
          <strong className="text-md font-outfit text-[var(--ui-accent, #B8933E)]">
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

      {/* Filters Bar (Side-by-side for Sidebar) */}
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

        <button 
          onClick={onCreateNewQuote}
          className="btn text-xs py-1.5 w-full mt-1"
        >
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
          {filteredQuotes.map((q) => {
            // Safe date formatter to produce "DD MMM YYYY" (e.g. "04 Jul 2026")
            const formatDate = (dateStr) => {
              if (!dateStr) return 'No Date';
              const parsed = new Date(dateStr);
              if (isNaN(parsed.getTime())) return dateStr;
              const day = String(parsed.getDate()).padStart(2, '0');
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const month = months[parsed.getMonth()];
              const year = parsed.getFullYear();
              return `${day} ${month} ${year}`;
            };

            return (
              <div 
                key={q.id} 
                className="quote-log-card"
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)',
                  border: '1px solid #EAE5D8',
                  borderRadius: '16px',
                  padding: '16px 18px 14px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 1px 1px rgba(18,33,63,0.03), 0 4px 10px rgba(18,33,63,0.04), 0 16px 32px -14px rgba(18,33,63,0.14)',
                  textAlign: 'left'
                }}
              >
                {/* Top Accent Bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #0D1B33 0%, #B98A2E 55%, #E9D6A6 100%)'
                }} />

                {/* Row 1 — Quote ID + status pill */}
                <div className="flex justify-between items-center" style={{ marginBottom: '11px' }}>
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color: '#12213F',
                    letterSpacing: '0.6px',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {q.quote_number}
                  </span>
                  
                  {/* Status Pill */}
                  <div className="flex items-center" style={{
                    border: '1px solid #E4D2A0',
                    background: 'transparent',
                    borderRadius: '100px',
                    padding: '3px 9px 3px 7px',
                    gap: '5px',
                    cursor: 'pointer'
                  }} onClick={() => onToggleStatus && onToggleStatus(q)}>
                    <div style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#B98A2E',
                      boxShadow: '0 0 0 3px rgba(185,138,46,0.15)'
                    }} />
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      color: '#8A6417'
                    }}>
                      {q.status}
                    </span>
                  </div>
                </div>

                {/* Row 2 — Customer name + date */}
                <div className="flex justify-between items-baseline" style={{ gap: '10px', marginBottom: '12px' }}>
                  <h3 style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: '15.5px',
                    color: '#12213F',
                    letterSpacing: '-0.1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    margin: 0
                  }}>
                    {q.client_name || 'Unnamed Client'}
                  </h3>
                  <div style={{
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    <span style={{ color: '#767F9C', fontWeight: 400 }}>Created </span>
                    <span style={{ color: '#12213F', fontWeight: 600 }}>{formatDate(q.date)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, #EAE5D8 15%, #EAE5D8 85%, transparent)',
                  margin: '0 0 12px 0'
                }} />

                {/* Row 3 — Values */}
                <div className="flex justify-between items-end" style={{ marginBottom: '12px' }}>
                  {/* Left Block */}
                  <div className="flex flex-col items-start">
                    <span style={{
                      fontSize: '9px',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: '#767F9C',
                      marginBottom: '2px'
                    }}>
                      Value Ex. GST
                    </span>
                    <span style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: '#A6ACC0',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      ₹{Math.round(parseFloat(q.subtotal) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Right Block */}
                  <div className="flex flex-col items-end" style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '9px',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: '#8A6417',
                      marginBottom: '2px'
                    }}>
                      Grand Inc. GST
                    </span>
                    <div className="flex flex-col items-end">
                      <span style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontWeight: 800,
                        fontSize: '19px',
                        color: '#0D1B33',
                        letterSpacing: '-0.2px',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.1
                      }}>
                        ₹{Math.round(parseFloat(q.total) || 0).toLocaleString('en-IN')}
                      </span>
                      <div style={{
                        height: '2px',
                        marginTop: '3px',
                        width: '100%',
                        background: 'linear-gradient(90deg, transparent, #B98A2E 60%, #B98A2E)',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Row 4 — Action bar */}
                <div className="flex items-stretch" style={{
                  border: '1px solid #EAE5D8',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <button 
                    onClick={() => onEditQuote(q)}
                    className="flex-grow flex-1 flex items-center justify-center gap-[6px] m-0 py-[7px] px-0 bg-transparent border-t-0 border-b-0 border-l-0 border-r border-[#EAE5D8] text-[#12213F] hover:bg-[#FBF6EA] hover:text-[#8A6417] transition-all duration-150 cursor-pointer outline-none shadow-none font-sans font-semibold text-[11.5px]"
                    title="Load & Edit Quote"
                  >
                    <Edit3 size={13} strokeWidth={2} stroke="currentColor" /> Load
                  </button>

                  <button 
                    onClick={() => onDuplicateQuote(q)}
                    className="flex-grow flex-1 flex items-center justify-center gap-[6px] m-0 py-[7px] px-0 bg-transparent border-t-0 border-b-0 border-l-0 border-r border-[#EAE5D8] text-[#12213F] hover:bg-[#FBF6EA] hover:text-[#8A6417] transition-all duration-150 cursor-pointer outline-none shadow-none font-sans font-semibold text-[11.5px]"
                    title="Duplicate Quote"
                  >
                    <Copy size={13} strokeWidth={2} stroke="currentColor" /> Duplicate
                  </button>

                  <button 
                    onClick={() => onDeleteQuote(q.id)}
                    className="w-10 flex-none flex items-center justify-center m-0 p-0 bg-transparent border-none text-[#9C8A78] hover:bg-[#FBF1EE] hover:text-[#B4483A] transition-all duration-150 cursor-pointer outline-none shadow-none"
                    title="Delete Quote"
                  >
                    <Trash2 size={13} strokeWidth={2} stroke="currentColor" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
