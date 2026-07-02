import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit3, Trash2, Mail, Phone, MapPin, Building, CreditCard, ArrowLeft } from 'lucide-react';

export default function Clients({ clients, onSaveClient, onDeleteClient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState(null); // client object or null
  const [isEditing, setIsEditing] = useState(false);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleOpenAdd = () => {
    setEditingClient({ name: '', company: '', gstin: '', email: '', phone: '', address: '' });
    setIsEditing(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient({ ...client });
    setIsEditing(true);
  };

  const handleCloseForm = () => {
    setEditingClient(null);
    setIsEditing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingClient.name.trim()) {
      alert('Client Name is required');
      return;
    }
    onSaveClient(editingClient);
    handleCloseForm();
  };

  const handleInputChange = (field, value) => {
    setEditingClient(prev => ({ ...prev, [field]: value }));
  };

  if (isEditing && editingClient) {
    return (
      <div 
        className="space-y-4 animate-fade-in no-print text-left"
        style={{ padding: '16px 14px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}
      >
        <div className="flex items-center gap-2 border-b border-[var(--ui-border)] pb-3 mb-2">
          <button 
            onClick={handleCloseForm}
            className="p-1 hover:bg-zinc-200 text-zinc-600 rounded"
          >
            <ArrowLeft size={14} />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            {editingClient.id ? 'Edit Client Record' : 'Add New Client'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-group">
            <label className="input-label">Client Name *</label>
            <input 
              type="text"
              value={editingClient.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. Mr. Chandru"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label className="input-label">Company Name</label>
            <input 
              type="text"
              value={editingClient.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="e.g. Acme Designs"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="input-label">GSTIN</label>
            <input 
              type="text"
              value={editingClient.gstin}
              onChange={(e) => handleInputChange('gstin', e.target.value)}
              placeholder="e.g. 29AAMCM4939R2ZA"
              className="input-field font-mono uppercase"
            />
          </div>

          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email"
              value={editingClient.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="e.g. client@company.com"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="input-label">Phone Number</label>
            <input 
              type="text"
              value={editingClient.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="e.g. +91 99000 12345"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="input-label">Billing Address</label>
            <textarea 
              rows="3"
              value={editingClient.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Billing address details..."
              className="input-field font-sans resize-none h-20"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button 
              type="submit" 
              className="btn flex-1 py-2 text-xs"
            >
              Save Client
            </button>
            <button 
              type="button" 
              onClick={handleCloseForm}
              className="btn-outline px-4 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div 
      className="space-y-4 animate-fade-in no-print text-left"
      style={{ padding: '16px 14px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}
    >
      
      {/* Search & Actions Bar */}
      <div className="bg-[var(--ui-card)] border border-[var(--ui-border)] p-3 rounded-lg space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 text-[var(--ui-text-muted)]" size={14} />
          <input 
            type="text"
            placeholder="Search by name, company, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-8 text-xs" style={{ padding: '6px 8px 6px 28px' }}
          />
        </div>
        
        <button 
          onClick={handleOpenAdd}
          className="btn text-xs py-2 w-full"
        >
          <Plus size={14} /> Add New Contact
        </button>
      </div>

      {/* Clients Cards List */}
      {filteredClients.length === 0 ? (
        <div className="border border-[var(--ui-border)] border-dashed rounded-lg p-6 text-center text-xs">
          <Building className="mx-auto text-[var(--ui-text-muted)] mb-2" size={32} />
          <h4 className="font-semibold text-zinc-700">No Contacts Found</h4>
          <p className="text-[10px] text-[var(--ui-text-muted)] mt-1">
            Add repeat clients for rapid, auto-filled quotes.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {filteredClients.map((c) => (
            <div key={c.id} className="quote-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xs font-bold text-zinc-800">{c.name}</h3>
                  {c.company && (
                    <span className="text-[10px] text-[var(--ui-text-muted)] font-medium block">
                      {c.company}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenEdit(c)}
                    className="p-1 hover:bg-zinc-200 text-zinc-500 rounded"
                    title="Edit Contact"
                  >
                    <Edit3 size={11} />
                  </button>
                  <button 
                    onClick={() => onDeleteClient(c.id)}
                    className="p-1 hover:bg-zinc-200 text-rose-500 rounded"
                    title="Delete Contact"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-[10px] text-[var(--ui-text-muted)] border-t border-[var(--ui-border)] pt-2 mt-1">
                {c.gstin && (
                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    <CreditCard size={10} className="shrink-0" />
                    <span>GST: {c.gstin}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={10} className="shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={10} className="shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <MapPin size={10} className="shrink-0 mt-0.5" />
                    <span className="line-clamp-1" title={c.address}>{c.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
