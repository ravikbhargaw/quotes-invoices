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

    // Sort descending by date, fallback to ID
    return filtered.sort((a, b) => {
      const dateA = Date.parse(a.date);
      const dateB = Date.parse(b.date);
      if (isNaN(dateA) || isNaN(dateB)) {
        return (b.id || 0) - (a.id || 0); // fallback by ID order
      }
      return dateB - dateA;
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
      <div className="grid grid-cols-2 gap-2 bg-[var(--ui-card)] border border-[var(--ui-border)] p-3 rounded-lg text-xs">
        <div>
          <span className="text-[9px] text-[var(--ui-text-muted)] uppercase block font-semibold">Finalised Projects</span>
          <strong className="text-md font-outfit text-[var(--ui-accent)]">
            {stats.finalised} / {stats.total}
          </strong>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-[var(--ui-text-muted)] uppercase block font-semibold">Revenue Secured</span>
          <strong className="text-md font-mono text-zinc-800">
            ₹{stats.finalisedRevenue.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>

      {/* Filters Bar (Side-by-side for Sidebar) */}
      <div className="bg-[var(--ui-card)] border border-[var(--ui-border)] p-3 rounded-lg space-y-2">
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
        <div className="border border-[var(--ui-border)] border-dashed rounded-lg p-6 text-center text-xs">
          <h4 className="font-semibold text-zinc-700">No Quotes Found</h4>
          <p className="text-[10px] text-[var(--ui-text-muted)] mt-1">
            Create a new quote or adjust filters to view items.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {filteredQuotes.map((q) => (
            <div key={q.id} className="quote-card">
              <div className="flex items-start justify-between gap-1 mb-2">
                <div>
                  <span className="font-mono text-[9px] text-[var(--ui-text-muted)] block">
                    {q.quote_number} &nbsp;·&nbsp; {q.date || 'No Date'}
                  </span>
                  <h3 className="text-xs font-bold text-zinc-800 mt-0.5">
                    {q.client_name || 'Unnamed Client'}
                  </h3>
                  {q.reference && (
                    <span className="text-[9px] text-[var(--ui-accent)] font-medium">
                      Ref: {q.reference}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span 
                    onClick={() => onToggleStatus && onToggleStatus(q)}
                    className={`text-[8.5px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider transition-colors select-none ${getStatusStyle(q.status)}`}
                    title="Click to toggle status (Draft / Finalised)"
                  >
                    {q.status}
                  </span>
                  <span className="text-[8px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-medium uppercase border border-zinc-200">
                    {q.format === 'proposal' ? 'Proposal' : 'Estimate'}
                  </span>
                </div>
              </div>

              {/* Scope of Work Snippet */}
              <div className="bg-[var(--ui-bg)] rounded p-2 text-[10px] text-[var(--ui-text-muted)] line-clamp-1 mb-2">
                {q.items && q.items.length > 0 
                  ? q.items.map(item => `${item.qty} ${item.unit} x ${item.name}`).join(', ')
                  : 'No items defined'
                }
              </div>

              <div className="flex items-center justify-between border-t border-[var(--ui-border)] pt-2">
                <div>
                  <span className="text-[8px] text-[var(--ui-text-muted)] block uppercase tracking-wider">Total Value</span>
                  <span className="text-xs font-bold text-zinc-800 font-mono">
                    ₹{Math.round(parseFloat(q.total) || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onEditQuote(q)}
                    className="btn-outline px-2 py-1 text-[10px]"
                    title="Load & Edit"
                  >
                    <Edit3 size={10} /> Load
                  </button>
                  <button 
                    onClick={() => onDuplicateQuote(q)}
                    className="btn-outline px-2 py-1 text-[10px]"
                    title="Duplicate"
                  >
                    <Copy size={10} /> Dup
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => onDeleteQuote(q.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      title="Delete Quote"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
