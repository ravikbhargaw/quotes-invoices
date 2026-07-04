import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit3, Trash2, Mail, Phone, MapPin, Building, CreditCard, ArrowLeft, Users } from 'lucide-react';

export default function Clients({ clients, onSaveClient, onDeleteClient, isAdmin }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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

  /* ── Add / Edit Form ─────────────────────────────────────── */
  if (isEditing && editingClient) {
    return (
      <div
        className="animate-fade-in no-print"
        style={{ padding: '0', overflowY: 'auto', height: 'calc(100vh - 68px)' }}
      >
        {/* Form header bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          borderBottom: '1px solid #ECEAE4',
          background: '#FFFFFF',
          flexShrink: 0,
        }}>
          <button
            onClick={handleCloseForm}
            style={{
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#F4F3EF', border: '1px solid #E2DFD8',
              borderRadius: '8px', cursor: 'pointer', color: '#6B7280',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={13} />
          </button>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#12213F', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {editingClient.id ? 'Edit Client Record' : 'Add New Contact'}
            </div>
            <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '1px' }}>
              {editingClient.id ? 'Update contact details below' : 'Fill in the details to save a new client'}
            </div>
          </div>
        </div>

        {/* Form body */}
        <div style={{ padding: '16px 16px 32px', background: '#F7F6F2', minHeight: 0 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {[
              { label: 'Client Name *', field: 'name', type: 'text', placeholder: 'e.g. Mr. Chandru', required: true },
              { label: 'Company Name', field: 'company', type: 'text', placeholder: 'e.g. Acme Designs' },
              { label: 'GSTIN', field: 'gstin', type: 'text', placeholder: 'e.g. 29AAMCM4939R2ZA', mono: true, upper: true },
              { label: 'Email Address', field: 'email', type: 'email', placeholder: 'e.g. client@company.com' },
              { label: 'Phone Number', field: 'phone', type: 'text', placeholder: 'e.g. +91 99000 12345' },
            ].map(({ label, field, type, placeholder, required, mono, upper }) => (
              <div key={field}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                  {label}
                </div>
                <input
                  type={type}
                  value={editingClient[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={placeholder}
                  required={required}
                  className="input-field"
                  style={{
                    fontFamily: mono ? 'monospace' : 'inherit',
                    textTransform: upper ? 'uppercase' : 'none',
                    background: '#FFFFFF',
                    border: '1px solid #E2DFD8',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    fontSize: '12px',
                    color: '#12213F',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>
            ))}

            {/* Address */}
            <div>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                Billing Address
              </div>
              <textarea
                rows={3}
                value={editingClient.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Billing address details..."
                className="input-field"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2DFD8',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  color: '#12213F',
                  width: '100%',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button type="submit" className="btn" style={{ flex: 1, fontSize: '11.5px', padding: '9px 0', borderRadius: '10px' }}>
                {editingClient.id ? 'Update Contact' : 'Save Contact'}
              </button>
              <button
                type="button"
                onClick={handleCloseForm}
                style={{
                  padding: '9px 16px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: '1px solid #E2DFD8',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  color: '#6B7280',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ── List View ────────────────────────────────────────────── */
  return (
    <div
      className="animate-fade-in no-print"
      style={{ overflowY: 'auto', height: 'calc(100vh - 68px)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Search + Add bar — white card pinned at top */}
      <div style={{
        padding: '14px 14px 12px',
        background: '#FFFFFF',
        borderBottom: '1px solid #ECEAE4',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
      }}>
        {/* Search field */}
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search by name, company, GSTIN…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#F7F6F2',
              border: '1px solid #E2DFD8',
              borderRadius: '10px',
              padding: '8px 12px 8px 32px',
              fontSize: '12px',
              color: '#12213F',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Add contact button */}
        <button
          onClick={handleOpenAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            background: 'linear-gradient(135deg, #B98A2E 0%, #8A6417 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 0',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.02em',
            boxShadow: '0 3px 10px rgba(185,138,46,0.3)',
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add New Contact
        </button>
      </div>

      {/* List body */}
      <div style={{ flex: 1, padding: '14px 14px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Count label */}
        {filteredClients.length > 0 && (
          <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '2px' }}>
            {filteredClients.length} Contact{filteredClients.length !== 1 ? 's' : ''}
          </div>
        )}

        {filteredClients.length === 0 ? (
          /* ── Premium empty state ── */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 24px',
            background: '#FFFFFF',
            border: '1.5px dashed #E2DFD8',
            borderRadius: '16px',
            marginTop: '8px',
          }}>
            <div style={{
              width: '44px', height: '44px',
              background: '#FBF6EA',
              border: '1px solid #E9D6A6',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <Users size={20} color="#B98A2E" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#12213F', marginBottom: '6px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              No Contacts Yet
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.6, maxWidth: '200px' }}>
              Add repeat clients for rapid, auto-filled quotes — no retyping needed.
            </div>
            <button
              onClick={handleOpenAdd}
              style={{
                marginTop: '18px',
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent',
                border: '1px solid #E9D6A6',
                borderRadius: '8px',
                padding: '7px 16px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#8A6417',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Plus size={12} strokeWidth={2.5} /> Add First Contact
            </button>
          </div>
        ) : (
          filteredClients.map((c) => (
            <ClientCard
              key={c.id}
              c={c}
              isAdmin={isAdmin}
              onEdit={() => handleOpenEdit(c)}
              onDelete={() => onDeleteClient(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Isolated Client Card ─────────────────────────────────────────────────── */
function ClientCard({ c, isAdmin, onEdit, onDelete }) {
  const [editHover, setEditHover]   = useState(false);
  const [deleteHover, setDeleteHover] = useState(false);

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #EAE5D8',
      borderRadius: '14px',
      padding: '14px 16px',
      boxShadow: '0 1px 3px rgba(18,33,63,0.04), 0 4px 12px rgba(18,33,63,0.03)',
      transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
      textAlign: 'left',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: c.gstin || c.email || c.phone || c.address ? '10px' : '0' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#12213F', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.2, marginBottom: c.company ? '3px' : 0 }}>
            {c.name}
          </div>
          {c.company && (
            <div style={{ fontSize: '10.5px', color: '#767F9C', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building size={10} strokeWidth={1.5} />
              {c.company}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
          <button
            onClick={onEdit}
            onMouseEnter={() => setEditHover(true)}
            onMouseLeave={() => setEditHover(false)}
            title="Edit Contact"
            style={{
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: editHover ? '#F4F3EF' : 'transparent',
              border: `1px solid ${editHover ? '#E2DFD8' : 'transparent'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              color: editHover ? '#8A6417' : '#9CA3AF',
              transition: 'all 0.15s ease',
            }}
          >
            <Edit3 size={12} strokeWidth={2} stroke="currentColor" />
          </button>

          {isAdmin && (
            <button
              onClick={onDelete}
              onMouseEnter={() => setDeleteHover(true)}
              onMouseLeave={() => setDeleteHover(false)}
              title="Delete Contact"
              style={{
                width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: deleteHover ? '#FBF1EE' : 'transparent',
                border: `1px solid ${deleteHover ? '#F4D0CA' : 'transparent'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: deleteHover ? '#B4483A' : '#9CA3AF',
                transition: 'all 0.15s ease',
              }}
            >
              <Trash2 size={12} strokeWidth={2} stroke="currentColor" />
            </button>
          )}
        </div>
      </div>

      {/* Details row */}
      {(c.gstin || c.email || c.phone || c.address) && (
        <div style={{ borderTop: '1px solid #F0EDE6', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {c.gstin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', color: '#767F9C' }}>
              <CreditCard size={10} strokeWidth={1.5} style={{ flexShrink: 0, color: '#B98A2E' }} />
              <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em', fontSize: '9.5px' }}>GST: {c.gstin}</span>
            </div>
          )}
          {c.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', color: '#767F9C' }}>
              <Mail size={10} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
            </div>
          )}
          {c.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', color: '#767F9C' }}>
              <Phone size={10} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <span>{c.phone}</span>
            </div>
          )}
          {c.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '10px', color: '#767F9C' }}>
              <MapPin size={10} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.address}>{c.address}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
