import React from 'react';

export default function DocumentPreview({ quote, settings }) {
  if (!quote) return null;

  // 1. Calculations logic for double-level discounts
  const items = quote.items || [];
  
  // Gross subtotal (before any item-level discounts)
  const grossSubtotal = items.reduce((sum, item) => sum + ((item.qty || 0) * (item.rate || 0)), 0);
  
  // Sum of all line item discounts
  const totalItemDiscounts = items.reduce((sum, item) => {
    const discountPct = parseFloat(item.discount) || 0;
    if (discountPct > 0) {
      return sum + ((item.qty || 0) * (item.rate || 0) * (discountPct / 100));
    }
    return sum;
  }, 0);

  // Subtotal after line-item discounts
  const subtotalAfterItemDiscounts = grossSubtotal - totalItemDiscounts;

  // Quote-level discount calculation
  const quoteDiscountPct = parseFloat(quote.quote_discount_pct) || parseFloat(quote.quoteDiscountPct) || 0;
  const quoteDiscountAmount = subtotalAfterItemDiscounts * (quoteDiscountPct / 100);

  // Adjusted Subtotal (after both discounts, before flat adjustments and taxes)
  const adjustedSubtotal = subtotalAfterItemDiscounts - quoteDiscountAmount;

  // Flat adjustment
  const flatAdjustment = parseFloat(quote.adjustment) || 0;
  const taxableAmount = adjustedSubtotal + flatAdjustment;

  // GST @ 18%
  const tax = taxableAmount * 0.18;
  const grandTotal = taxableAmount + tax;

  // Number to Words in Indian Rupees
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    num = Math.round(num);
    if (num === 0) return 'Zero Rupees';
    if (num.toString().length > 9) return 'overflow';
    
    let crore = Math.floor(num / 10000000);
    let lakh = Math.floor((num % 10000000) / 100000);
    let thousand = Math.floor((num % 100000) / 1000);
    let hundred = Math.floor((num % 1000) / 100);
    let tens = num % 100;

    let words = 'Indian Rupee ';
    
    const convertTens = (n) => {
      if (n < 20) return a[n];
      let val = b[Math.floor(n / 10)];
      if (n % 10 > 0) val += '-' + a[n % 10];
      return val + ' ';
    };

    if (crore > 0) words += convertTens(crore) + 'Crore ';
    if (lakh > 0) words += convertTens(lakh) + 'Lakh ';
    if (thousand > 0) words += convertTens(thousand) + 'Thousand ';
    if (hundred > 0) words += convertTens(hundred) + 'Hundred ';
    if (tens > 0) {
      if (words !== 'Indian Rupee ') words += 'and ';
      words += convertTens(tens);
    }
    
    return words.trim() + ' Only';
  };

  const displayDate = () => {
    if (!quote.date) return '—';
    const d = new Date(quote.date);
    if (!isNaN(d.getTime())) {
      // Check if the format is ISO date YYYY-MM-DD or close to it
      if (/^\d{4}-\d{2}-\d{2}$/.test(quote.date) || !isNaN(Date.parse(quote.date))) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }
    return quote.date;
  };

  // Align field name mismatch: use either quote_number or estimate_no
  const quoteNumber = quote.quote_number || quote.estimate_no || '';  const colors = {
    ink: '#12213F',
    inkSoft: '#3C4A6B',
    navyDeep: '#0D1B33',
    gold: '#BD8C2E',
    goldSoft: '#E9D6A6',
    paper: '#FAF9F6',
    card: '#FFFFFF',
    line: '#E6E3DA',
    lineSoft: '#EFEDE6',
    standard: '#9A6A5A',
    proposed: '#2E6B52'
  };

  const sectionHeadingStyle = {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: '13px',
    fontWeight: '800',
    color: colors.ink,
    borderLeft: `4px solid ${colors.gold}`,
    paddingLeft: '10px',
    marginBottom: '16px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  };

  return (
    <div className="doc-container" id="docCanvas" style={{ background: colors.paper, color: colors.ink, fontFamily: 'Inter, sans-serif' }}>
      
      {/* A. HEADER — exact spec from Antigravity_Prompt_Header_Exact_Spec.md */}
      <div className="doc-header" style={{ 
        background: 'linear-gradient(160deg, #0D1B33 0%, #16294A 100%)',
        color: '#FFFFFF', 
        padding: '40px 44px 34px 44px',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        borderBottomLeftRadius: '20px', 
        borderBottomRightRadius: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Decorative glow — top-right corner, bleeds off edge */}
        <div style={{
          position: 'absolute',
          width: '220px',
          height: '220px',
          top: '-60px',
          right: '-60px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(189,140,46,0.18) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* All content above the glow */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ROW 1: Brand (left) + Proposal meta (right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>

            {/* LEFT: Brand block — logo on top, sub-label below, column layout */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>

              {/* Logo image (if uploaded) */}
              {settings.companyLogo && (
                <img 
                  src={settings.companyLogo} 
                  alt="Company Logo"
                  style={{ height: `${settings.logoHeight || 38}px`, objectFit: 'contain', display: 'block' }}
                />
              )}

              {/* Diamond-M fallback (only when no logo) */}
              {!settings.companyLogo && (
                <div style={{
                  width: '34px',
                  height: '34px',
                  border: '1.6px solid #E9D6A6',
                  borderRadius: '4px',
                  transform: 'rotate(45deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fontSize: '14px',
                    color: '#E9D6A6',
                    transform: 'rotate(-45deg)',
                    display: 'block',
                    lineHeight: 1
                  }}>M</span>
                </div>
              )}

              {/* Sub-label: directly below logo, left-aligned */}
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '9px',
                color: '#B9C2D6',
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}>
                Glass &amp; Aluminium Execution
              </span>
            </div>

            {/* RIGHT: Proposal meta — text-align right */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {/* Line 1: PROPOSAL label */}
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '10.5px',
                fontWeight: '600',
                letterSpacing: '2px',
                color: '#E9D6A6',
                textTransform: 'uppercase'
              }}>
                {quote.format === 'proposal' ? 'Proposal' : 'Estimate'}
              </span>

              {/* Line 2: Number · Date */}
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: '400',
                color: '#D7DDEB',
                marginTop: '4px'
              }}>
                {quoteNumber || '—'} · {displayDate()}
              </span>

              {/* Line 3: Validity pill */}
              {quote.validity && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  background: 'rgba(189,140,46,0.18)',
                  border: '1px solid rgba(233,214,166,0.4)',
                  color: '#E9D6A6',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  padding: '5px 12px',
                  borderRadius: '100px',
                  textTransform: 'uppercase'
                }}>
                  {(() => {
                    const days = parseInt(quote.validity) || 15;
                    if (quote.date) {
                      const expiry = new Date(quote.date);
                      expiry.setDate(expiry.getDate() + days);
                      const expiryStr = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
                      return `Valid ${days} Days · Until ${expiryStr}`;
                    }
                    return `Valid ${quote.validity}`;
                  })()}
                </span>
              )}
            </div>
          </div>

          {/* ROW 2: Subject line — margin-top 30px from Row 1 */}
          {quote.reference && (
            <div style={{ marginTop: '30px' }}>
              <span style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '10.5px',
                fontWeight: '600',
                letterSpacing: '2px',
                color: '#8D9BBB',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                Subject / Project Reference
              </span>
              <h1 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '24px',
                fontWeight: '700',
                lineHeight: 1.3,
                color: '#FFFFFF',
                margin: 0,
                maxWidth: '560px'
              }}>
                {quote.reference}
              </h1>
            </div>
          )}

          {/* ROW 3: Facts row — border-top divider, flex with fixed 40px gap (NOT space-between) */}
          <div style={{
            marginTop: '26px',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: '22px',
            display: 'flex',
            flexDirection: 'row',
            gap: '40px',
            flexWrap: 'wrap'
          }}>
            {/* Fact: Billed To */}
            <div>
              <span style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '1.5px',
                color: '#8D9BBB',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>Billed To</span>
              <span style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '14.5px',
                fontWeight: '600',
                color: '#FFFFFF'
              }}>{quote.client_name || '—'}</span>
            </div>

            {/* Fact: Date Issued */}
            <div>
              <span style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '1.5px',
                color: '#8D9BBB',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>Date Issued</span>
              <span style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '14.5px',
                fontWeight: '600',
                color: '#FFFFFF'
              }}>{displayDate()}</span>
            </div>

            {/* Fact: Client GSTIN */}
            <div>
              <span style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '1.5px',
                color: '#8D9BBB',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>Client GSTIN</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '14.5px',
                fontWeight: '600',
                color: '#FFFFFF'
              }}>{quote.gstin || '—'}</span>
            </div>
          </div>

        </div>{/* end z-index wrapper */}
      </div>

      {/* B. EXECUTIVE SUMMARY */}
      {quote.format === 'proposal' && quote.desc && (
        <div style={{ padding: '24px 32px 0 32px' }}>
          <div style={{ 
            background: colors.card, 
            borderRadius: '14px', 
            border: `1px solid ${colors.lineSoft}`, 
            boxShadow: '0 1px 2px rgba(18,33,63,0.04), 0 8px 24px rgba(18,33,63,0.05)', 
            padding: '24px',
            textAlign: 'left'
          }}>
            <h2 style={sectionHeadingStyle}>
              Executive Summary
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12.5px', color: colors.inkSoft, lineHeight: '1.6', margin: 0 }}>
              {quote.desc}
            </p>
          </div>
        </div>
      )}

      {/* C. SPECIFICATION COMPARISON */}
      {quote.format === 'proposal' && items.some(item => item.client_spec || item.proposed_spec || item.our_offer) && (
        <div style={{ padding: '24px 32px 0 32px', textAlign: 'left' }}>
          <h2 style={sectionHeadingStyle}>
            Where We've Upgraded Your Spec
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.filter(item => item.client_spec || item.proposed_spec || item.our_offer).map((item, idx) => {
              const proposedSpecVal = item.proposed_spec || item.our_offer || '';
              return (
                <div key={idx} style={{ 
                  background: colors.card, 
                  borderRadius: '14px', 
                  border: `1px solid ${colors.lineSoft}`, 
                  boxShadow: '0 1px 2px rgba(18,33,63,0.04), 0 8px 24px rgba(18,33,63,0.05)', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Two spec columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Client Spec */}
                    <div style={{ borderLeft: `3px solid ${colors.standard}`, paddingLeft: '12px' }}>
                      <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: colors.standard, letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                        Client Specified / Standard
                      </span>
                      <strong style={{ fontSize: '12px', color: colors.ink, display: 'block', marginBottom: '4px' }}>{item.name}</strong>
                      <p style={{ fontSize: '11px', color: colors.inkSoft, margin: 0, lineHeight: 1.4 }}>{item.client_spec || 'Standard generic specifications'}</p>
                    </div>

                    {/* Proposed Spec */}
                    <div style={{ background: '#F1F7F3', borderLeft: `3px solid ${colors.proposed}`, padding: '10px 12px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: colors.proposed, letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                        Meaven Proposed spec
                      </span>
                      <strong style={{ fontSize: '12px', color: colors.ink, display: 'block', marginBottom: '4px' }}>{item.name}</strong>
                      <p style={{ fontSize: '11px', color: colors.proposed, margin: 0, lineHeight: 1.4 }}>{proposedSpecVal || 'Premium high-tensile glass alignment'}</p>
                    </div>
                  </div>

                  {/* AI Upgrade summary callout line */}
                  {item.upgrade_summary && (
                    <div style={{ 
                      background: 'rgba(189, 140, 46, 0.05)', 
                      border: `1px dashed ${colors.gold}`, 
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: colors.gold,
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>✨</span>
                      <span><strong>Upgrade:</strong> {item.upgrade_summary}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* D. COMMERCIAL SPECIFICATIONS */}
      <div style={{ padding: '24px 32px 0 32px', textAlign: 'left' }}>
        <h2 style={sectionHeadingStyle}>
          Commercial Specifications
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((item, index) => {
            const itemDiscount = parseFloat(item.discount) || 0;
            const itemGrossAmount = (item.qty || 0) * (item.rate || 0);
            const itemNetAmount = itemGrossAmount * (1 - itemDiscount / 100);

            return (
              <div 
                key={index} 
                className="line-item"
                style={{ 
                  background: colors.card, 
                  borderRadius: '14px', 
                  border: `1px solid ${colors.lineSoft}`, 
                  boxShadow: '0 1px 2px rgba(18,33,63,0.04), 0 8px 24px rgba(18,33,63,0.05)', 
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 240px',
                  gap: '12px',
                  alignItems: 'start',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}
              >
                {/* 01, 02 Number */}
                <div style={{ 
                  fontFamily: 'Plus Jakarta Sans, sans-serif', 
                  fontSize: '18px', 
                  color: colors.gold, 
                  fontWeight: '800', 
                  lineHeight: 1.1 
                }}>
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Main Details Column */}
                <div style={{ paddingRight: '16px' }}>
                  <h3 style={{ 
                    fontFamily: 'Plus Jakarta Sans, sans-serif', 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: colors.ink,
                    margin: '0 0 6px 0'
                  }}>
                    {item.name}
                  </h3>

                  {/* Spec chips */}
                  {item.specs && item.specs.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {item.specs.map((spec, sidx) => (
                        <span key={sidx} style={{ 
                          fontSize: '9px', 
                          fontWeight: '600', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          background: colors.paper,
                          color: colors.inkSoft,
                          border: `1px solid ${colors.line}`
                        }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description / Hardware */}
                  {item.desc && (
                    <p style={{ fontSize: '11px', color: colors.inkSoft, margin: '0 0 6px 0', lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  )}
                  {item.hardware && (
                    <div style={{ fontSize: '11px', color: colors.inkSoft, margin: '0 0 6px 0', lineHeight: 1.5 }}>
                      <strong>Hardware:</strong> {item.hardware}
                    </div>
                  )}

                  {/* Dimension chips */}
                  {item.sizes && item.sizes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {item.sizes.map((sz, szidx) => (
                        <span key={szidx} style={{ 
                          fontFamily: 'JetBrains Mono, monospace', 
                          fontSize: '9px', 
                          background: 'rgba(58, 97, 134, 0.05)', 
                          color: colors.inkSoft, 
                          padding: '1px 6px', 
                          borderRadius: '3px',
                          border: `1px solid ${colors.lineSoft}`
                        }}>
                          {sz}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Columns: Qty, Rate, Amount (Fixed widths to prevent overlap) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '60px 100px 80px', 
                  gap: '8px', 
                  textAlign: 'right',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  {/* Qty */}
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: colors.ink, fontWeight: '500' }}>
                    {item.qty} <span style={{ fontSize: '8.5px', color: colors.inkSoft }}>{item.unit}</span>
                  </div>

                  {/* Rate */}
                  <div style={{ whiteSpace: 'nowrap' }}>
                    {itemDiscount > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'flex-end' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: colors.inkSoft, textDecoration: 'line-through' }}>
                          ₹{Math.round(item.rate || 0).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: colors.proposed, fontWeight: '600' }}>
                          ₹{Math.round(item.rate * (1 - itemDiscount / 100)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: colors.ink }}>
                        ₹{Math.round(item.rate || 0).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: '700', color: colors.ink }}>
                    ₹{Math.round(itemNetAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* E. TOTALS BLOCK */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 52px 0 32px' }}>
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: colors.inkSoft }}>
            <span>Subtotal (Gross)</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '500', color: colors.ink }}>
              ₹{Math.round(subtotalAfterItemDiscounts).toLocaleString('en-IN')}
            </span>
          </div>

          {quoteDiscountPct > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: colors.proposed, fontWeight: '600' }}>
              <span>Quote Discount ({quoteDiscountPct}%)</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                − ₹{Math.round(quoteDiscountAmount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Taxable Value */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '11.5px', 
            fontWeight: '600', 
            color: colors.ink, 
            borderTop: `1px solid ${colors.line}`, 
            paddingTop: '8px' 
          }}>
            <span>Taxable Value</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ₹{Math.round(taxableAmount).toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: colors.inkSoft }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              GST (18%) <span style={{ fontSize: '8px', background: 'rgba(58, 97, 134, 0.05)', color: colors.inkSoft, padding: '1px 4px', borderRadius: '3px', fontWeight: '700' }}>TAX</span>
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: colors.ink }}>
              ₹{Math.round(tax).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Grand Total Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: colors.navyDeep, 
            color: '#FFFFFF', 
            padding: '12px 16px', 
            borderRadius: '4px', 
            marginTop: '8px' 
          }}>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Grand Total
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', fontWeight: '800' }}>
              ₹{Math.round(grandTotal).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Amount in words */}
      <div style={{ 
        background: colors.paper, 
        borderTop: `1px solid ${colors.line}`, 
        borderBottom: `1px solid ${colors.line}`, 
        padding: '14px 20px', 
        margin: '24px 32px 0 32px', 
        textAlign: 'center' 
      }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.inkSoft, display: 'block', marginBottom: '2px' }}>
          Amount in Words
        </span>
        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13.5px', color: colors.ink, fontWeight: '700' }}>
          {numberToWords(grandTotal)}
        </span>
      </div>

      {/* F. PROJECT TIMELINE */}
      {quote.format === 'proposal' && (quote.timeline_steps || []).length > 0 && (
        <div style={{ padding: '24px 32px 0 32px', textAlign: 'left' }}>
          <h2 style={sectionHeadingStyle}>
            Project Execution Timeline
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${Math.min((quote.timeline_steps || []).length, 4)}, 1fr)`, 
            gap: '12px' 
          }}>
            {(quote.timeline_steps || []).map((step, sidx) => {
              if (!step.trim()) return null;
              const hasColon = step.includes(':');
              const title = hasColon ? step.split(':')[0] : `Step ${sidx + 1}`;
              const desc = hasColon ? step.split(':').slice(1).join(':') : step;
              return (
                <div key={sidx} className="timeline-card" style={{ 
                  background: colors.card, 
                  border: `1px solid ${colors.lineSoft}`, 
                  borderRadius: '14px', 
                  padding: '16px',
                  boxShadow: '0 1px 2px rgba(18,33,63,0.02)'
                }}>
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: '700', 
                    color: colors.gold, 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    {title}
                  </span>
                  <p style={{ fontSize: '11px', color: colors.inkSoft, margin: 0, lineHeight: 1.4 }}>
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* G. TERMS OF PARTNERSHIP */}
      {(quote.payment_schedule || []).length > 0 && (
        <div style={{ padding: '24px 32px 0 32px', textAlign: 'left' }}>
          <h2 style={sectionHeadingStyle}>
            {quote.format === 'proposal' ? 'Terms of Partnership' : 'Payment Schedule'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {(quote.payment_schedule || []).slice(0, 3).map((ms, idx) => {
              const pctValue = parseFloat(ms.pct) || 0;
              const milestoneAmount = grandTotal * (pctValue / 100);

              return (
                <div 
                  key={idx} 
                  className="payment-milestone-card"
                  style={{ 
                    background: colors.card, 
                    border: `1px solid ${colors.lineSoft}`, 
                    borderRadius: '14px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 2px rgba(18,33,63,0.02)'
                  }}
                >
                  <div style={{ padding: '16px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Milestone {idx + 1}
                    </span>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '32px', fontWeight: '800', color: colors.ink, lineHeight: 1.1, margin: '6px 0' }}>
                      {ms.pct}<span style={{ fontSize: '16px', fontWeight: '600' }}>%</span>
                    </div>
                    <p style={{ fontSize: '11px', color: colors.inkSoft, lineHeight: '1.4', margin: 0, minHeight: '36px' }}>
                      {ms.milestone}
                    </p>
                  </div>
                  
                  <div style={{ 
                    padding: '10px 16px', 
                    background: colors.paper, 
                    borderTop: `1px solid ${colors.lineSoft}`, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span style={{ fontSize: '8.5px', color: colors.inkSoft, textTransform: 'uppercase', fontWeight: '600' }}>Amount</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', fontWeight: '700', color: colors.ink }}>
                      ₹{Math.round(milestoneAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* H. CARE NOTES & TERMS AND CONDITIONS */}
      <div style={{ padding: '24px 32px 0 32px', textAlign: 'left' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Notes Card */}
          <div className="notes-card" style={{ 
            background: colors.card, 
            borderRadius: '14px', 
            border: `1px solid ${colors.lineSoft}`, 
            padding: '20px' 
          }}>
            <h3 style={{ ...sectionHeadingStyle, fontSize: '12px', borderLeftWidth: '3px', paddingLeft: '8px', marginBottom: '12px' }}>
              Care Notes &amp; Scope Inclusions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(quote.notes || []).map((note, idx) => {
                const hasColon = note.includes(':');
                return (
                  <div key={idx} style={{ fontSize: '11px', paddingBottom: '6px', borderBottom: `1px solid ${colors.lineSoft}` }}>
                    {hasColon ? (
                      <>
                        <strong style={{ display: 'block', color: colors.ink, marginBottom: '2px' }}>{note.split(':')[0]}</strong>
                        <span style={{ color: colors.inkSoft }}>{note.split(':').slice(1).join(':')}</span>
                      </>
                    ) : (
                      <span style={{ color: colors.ink }}>{note}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terms Card */}
          <div className="terms-card" style={{ 
            background: colors.card, 
            borderRadius: '14px', 
            border: `1px solid ${colors.lineSoft}`, 
            padding: '20px' 
          }}>
            <h3 style={{ ...sectionHeadingStyle, fontSize: '12px', borderLeftWidth: '3px', paddingLeft: '8px', marginBottom: '12px' }}>
              Terms &amp; Conditions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(quote.terms || []).map((term, idx) => {
                const hasColon = term.includes(':');
                return (
                  <div key={idx} style={{ fontSize: '11px', paddingBottom: '6px', borderBottom: `1px solid ${colors.lineSoft}` }}>
                    {hasColon ? (
                      <>
                        <strong style={{ display: 'block', color: colors.ink, marginBottom: '2px' }}>{term.split(':')[0]}</strong>
                        <span style={{ color: colors.inkSoft }}>{term.split(':').slice(1).join(':')}</span>
                      </>
                    ) : (
                      <span style={{ color: colors.ink }}>{term}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* I. BANK DETAILS & FOOTER */}
      <div className="doc-footer" style={{ 
        background: colors.navyDeep, 
        color: '#FFFFFF',
        padding: '20px 44px', 
        marginTop: '40px',
        textAlign: 'center',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Left-aligned Bank Details Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: '6px 0',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          lineHeight: '1.6',
          color: '#FFFFFF',
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto 16px 0',
          textAlign: 'left'
        }}>
          <span style={{ color: '#B9C2D6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Beneficiary Name:</span>
          <span>{settings.bankDetails?.name || 'MEAVEN DESIGNS PRIVATE LIMITED'}</span>
          
          <span style={{ color: '#B9C2D6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Number:</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{settings.bankDetails?.accountNo || '50200097556307'}</span>
          
          <span style={{ color: '#B9C2D6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bank / Branch:</span>
          <span>{settings.bankDetails?.bankName || 'HDFC Bank, Marathahalli'}</span>
          
          <span style={{ color: '#B9C2D6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IFSC:</span>
          <span style={{ color: '#E9D6A6', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{settings.bankDetails?.ifsc || 'HDFC0001756'}</span>
          
          <span style={{ color: '#B9C2D6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>GSTIN:</span>
          <span style={{ color: '#E9D6A6', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{settings.bankDetails?.gstin || '29AAMCM4939R2ZA'}</span>
        </div>

        {/* Divider and System generated note */}
        <div style={{
          borderTop: '1px solid rgba(233, 214, 166, 0.15)',
          paddingTop: '12px',
          marginTop: '16px',
          width: '100%',
          textAlign: 'center'
        }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '8.5px',
            color: '#B9C2D6',
            letterSpacing: '0.04em',
            margin: 0
          }}>
            Note: This is a system generated quote and doesn't need a signature.
          </p>
        </div>
      </div>
    </div>
  );
}
