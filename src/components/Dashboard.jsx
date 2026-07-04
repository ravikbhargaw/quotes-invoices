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
          {filteredQuotes.map((q) => (
            <div key={q.id} className="quote-card bg-white border border-[var(--ui-border)] rounded-xl p-4 shadow-sm hover:shadow transition-shadow duration-200">
              
              {/* Card Metadata List */}
              <div className="space-y-2 text-xs mb-3.5">
                
                {/* 1. Quote Number */}
                <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                  <span className="text-[10px] text-[var(--ui-text-muted)] font-semibold uppercase tracking-wider">Quote Number</span>
                  <span className="font-bold text-zinc-900 font-mono text-[11.5px]">
                    {q.quote_number}
                  </span>
                </div>

                {/* 2. Customer Name */}
                <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                  <span className="text-[10px] text-[var(--ui-text-muted)] font-semibold uppercase tracking-wider">Customer Name</span>
                  <span className="font-semibold text-zinc-800 text-right max-w-[150px] truncate">
                    {q.client_name || 'Unnamed Client'}
                  </span>
                </div>

                {/* 3. Date Created */}
                <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                  <span className="text-[10px] text-[var(--ui-text-muted)] font-semibold uppercase tracking-wider">Date Created</span>
                  <span className="text-zinc-600 font-medium">
                    {q.date || 'No Date'}
                  </span>
                </div>

                {/* 4. Total Value (EX GST) */}
                <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                  <span className="text-[10px] text-[var(--ui-text-muted)] font-semibold uppercase tracking-wider">Total Value (EX GST)</span>
                  <span className="font-mono text-zinc-700 font-semibold">
                    ₹{Math.round(parseFloat(q.subtotal) || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 5. Grand Value (Inc. GST) */}
                <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                  <span className="text-[10px] text-[var(--ui-text-muted)] font-semibold uppercase tracking-wider">Grand Value (Inc. GST)</span>
                  <span className="font-mono text-[var(--ui-accent, #B8933E)] font-bold text-xs">
                    ₹{Math.round(parseFloat(q.total) || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 6. Status */}
                <div className="flex justify-between items-center pb-0.5">
                  <span className="text-[10px] text-[var(--ui-text-muted)] font-semibold uppercase tracking-wider">Status</span>
                  <span 
                    onClick={() => onToggleStatus && onToggleStatus(q)}
                    className={`text-[8.5px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider transition-colors select-none ${getStatusStyle(q.status)}`}
                    title="Click to toggle status"
                  >
                    {q.status}
                  </span>
                </div>

              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 border-t border-[var(--ui-border)] pt-2.5">
                <button 
                  onClick={() => onEditQuote(q)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                  title="Load & Edit Quote"
                >
                  <Edit3 size={11} /> Load
                </button>
                
                <button 
                  onClick={() => onDuplicateQuote(q)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                  title="Duplicate Quote"
                >
                  <Copy size={11} /> Dup
                </button>
                
                {isAdmin && (
                  <button 
                    onClick={() => onDeleteQuote(q.id)}
                    className="flex-none flex items-center justify-center bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:text-rose-700 p-1.5 rounded-lg transition-colors"
                    title="Delete Quote"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
