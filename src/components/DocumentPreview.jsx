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
  const quoteNumber = quote.quote_number || quote.estimate_no || '';

  const sectionHeadingStyle = {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--navy, #1B2B45)',
    borderBottom: '1px solid var(--border, #E2E2DE)',
    paddingBottom: '8px',
    marginBottom: '14px',
    letterSpacing: '-0.01em'
  };

  return (
    <div className="doc-container" id="docCanvas">
      
      {/* 1. HEADER (Navy background, Plus Jakarta Sans) */}
      <div className="doc-header" style={{ background: 'var(--navy)', color: 'var(--white)', padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="doc-logo-box" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {settings.companyLogo ? (
            <img 
              src={settings.companyLogo} 
              alt="meaven.in Logo" 
              style={{ height: `${settings.logoHeight || 40}px`, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '24px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--gold)' }}>
              meaven.in
            </span>
          )}
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '26px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold)' }}>
            {quote.format === 'proposal' ? 'Proposal' : 'Quotation'}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
            No: {quote.estimate_no || quote.quote_number || '—'} &nbsp;·&nbsp; {displayDate()}
          </div>
          <div className="validity-pill" style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--navy)', fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: '10px', marginTop: '6px' }}>
            Valid: {quote.validity || '15 Days'}
          </div>
        </div>
      </div>

      {/* 2. SUBJECT BAND (steel-pale bg, steel left border 3px, no side margins) */}
      {quote.reference && (
        <div style={{ background: 'var(--steel-pale)', borderLeft: '3px solid var(--steel)', padding: '12px 24px', margin: '20px 0 10px', textAlign: 'left' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--steel)', display: 'block', marginBottom: '2px' }}>
            Subject / Project Reference
          </span>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', color: 'var(--navy)', fontWeight: '600', }}>
            {quote.reference}
          </span>
        </div>
      )}

      {/* 3. METADATA BAND */}
      <div className="doc-meta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', padding: '15px 30px', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>Billed To</span>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', fontWeight: '700', color: 'var(--navy)' }}>{quote.client_name || '—'}</p>
        </div>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>Client GSTIN</span>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text)' }}>{quote.gstin || '—'}</p>
        </div>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>Date Issued</span>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text)' }}>{displayDate()}</p>
        </div>
      </div>

      {/* PROPOSAL EXECUTIVE SUMMARY & COMPOSITIONS */}
      {quote.format === 'proposal' && (
        <div style={{ padding: '0 30px', textAlign: 'left' }}>
          {/* Executive Summary */}
          <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
            <h2 style={sectionHeadingStyle}>
              Executive Summary
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12.5px', color: 'var(--text)', lineHeight: '1.6' }}>
              {quote.desc || 'Meaven is pleased to submit this commercial-grade glass and aluminium solution proposal. Our solution utilizes certified Tier-1 processing systems to achieve structural execution certainty and precise architectural alignment.'}
            </p>
          </div>

          {/* The Meaven Difference Specification Comparison */}
          {items.some(item => item.client_spec || item.our_offer) && (
            <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
              <h2 style={sectionHeadingStyle}>
                The Meaven Difference: Specifications Comparison
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.filter(item => item.client_spec || item.our_offer).map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ background: 'var(--red-pale)', padding: '12px', borderRadius: '3px', borderLeft: '3px solid var(--red)' }}>
                      <span style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--red)', display: 'block', marginBottom: '4px' }}>
                        Client Specified / Standard
                      </span>
                      <strong style={{ fontSize: '11px', display: 'block', color: '#111' }}>{item.name}</strong>
                      <p style={{ fontSize: '10.5px', color: '#333', marginTop: '2px' }}>{item.client_spec || 'Standard generic specifications'}</p>
                    </div>
                    <div style={{ background: 'var(--green-pale)', padding: '12px', borderRadius: '3px', borderLeft: '3px solid var(--green)' }}>
                      <span style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--green)', display: 'block', marginBottom: '4px' }}>
                        Our Proposed Offer (meaven.in)
                      </span>
                      <strong style={{ fontSize: '11px', display: 'block', color: '#111' }}>{item.name}</strong>
                      <p style={{ fontSize: '10.5px', color: '#333', marginTop: '2px' }}>{item.our_offer || 'Premium high-tensile glass alignment'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '20px 0 0' }}>
            <h2 style={sectionHeadingStyle}>
              Commercial Specifications
            </h2>
          </div>
        </div>
      )}

      {/* 4. LINE ITEMS SECTION */}
      <div style={{ padding: '15px 30px' }}>
        {/* Table Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '35px 1fr 50px 140px 100px', borderBottom: '2px solid var(--navy)', paddingBottom: '8px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', textAlign: 'left' }}>
          <span>#</span>
          <span>Item &amp; Specifications</span>
          <span style={{ textAlign: 'right', paddingLeft: '8px' }}>Qty</span>
          <span style={{ textAlign: 'right', paddingLeft: '8px' }}>Rate</span>
          <span style={{ textAlign: 'right', paddingLeft: '12px' }}>Amount</span>
        </div>

        {/* Dynamic Item Rows */}
        <div className="divide-y divide-[var(--border)]">
          {items.map((item, index) => {
            const itemDiscount = parseFloat(item.discount) || 0;
            const itemGrossAmount = (item.qty || 0) * (item.rate || 0);
            const itemNetAmount = itemGrossAmount * (1 - itemDiscount / 100);

            return (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '35px 1fr 50px 140px 100px', paddingTop: '14px', paddingBottom: '14px', textAlign: 'left', alignItems: 'start', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                {/* Large italic number (Visible color) */}
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '20px', color: 'rgba(58, 97, 134, 0.2)', fontWeight: '700', lineHeight: 1 }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                
                <div style={{ paddingRight: '15px' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', fontWeight: '700', color: 'var(--navy)' }}>
                    {item.name}
                  </div>
                  
                  {/* Spec tags (Key spec chips vs generic specs) */}
                  {item.specs && item.specs.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {item.specs.map((spec, sidx) => {
                        const isKeySpec = spec.toLowerCase().includes('saint') || 
                                          spec.toLowerCase().includes('mm') || 
                                          spec.toLowerCase().includes('ozone') || 
                                          spec.toLowerCase().includes('dorma') || 
                                          spec.toLowerCase().includes('toughened');
                        return (
                          <span 
                            key={sidx} 
                            style={{ 
                              fontSize: '9px', 
                              fontWeight: '600', 
                              padding: '2px 8px', 
                              borderRadius: '4px',
                              background: isKeySpec ? 'var(--gold-pale)' : '#F2F2EF', 
                              color: isKeySpec ? 'var(--gold)' : 'var(--muted)',
                              border: isKeySpec ? '1px solid rgba(184,147,62,0.15)' : '1px solid #E2E2DE'
                            }}
                          >
                            {spec}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Hardware display below specs */}
                  {item.hardware && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5' }}>
                      <strong>Hardware:</strong>&nbsp; {item.hardware}
                    </div>
                  )}

                  {/* Short Description */}
                  {item.desc && (
                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px', lineHeight: '1.5' }}>
                      {item.desc}
                    </p>
                  )}

                  {/* Size pills */}
                  {item.sizes && item.sizes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {item.sizes.map((sz, szidx) => (
                        <span 
                          key={szidx} 
                          style={{ 
                            fontFamily: 'JetBrains Mono, monospace', 
                            fontSize: '9.5px', 
                            background: 'var(--steel-pale)', 
                            color: 'var(--steel)', 
                            padding: '1px 6px', 
                            borderRadius: '3px',
                            border: '1px solid rgba(58,97,134,0.1)'
                          }}
                        >
                          {sz}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qty / Rate / Amount Column Data */}
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text)', textAlign: 'right', paddingLeft: '8px' }}>
                  {item.qty} <span style={{ fontSize: '9px', color: 'var(--muted)' }}>{item.unit}</span>
                </div>
                
                <div style={{ textAlign: 'right', paddingLeft: '8px', whiteSpace: 'nowrap' }}>
                  {itemDiscount > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--muted)', textDecoration: 'line-through' }}>
                        ₹{Math.round(item.rate || 0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>→</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--green)', fontWeight: '600' }}>
                        ₹{Math.round(item.rate * (1 - itemDiscount / 100)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text)' }}>
                      ₹{Math.round(item.rate || 0).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: '600', color: 'var(--navy)', textAlign: 'right', paddingLeft: '12px' }}>
                  ₹{Math.round(itemNetAmount).toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TOTALS BLOCK */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px 30px' }}>
        <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
            <span>Subtotal (Gross)</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ₹{Math.round(grossSubtotal).toLocaleString('en-IN')}
            </span>
          </div>

          {totalItemDiscounts > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: 'var(--green)' }}>
              <span>Item Discounts</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                − ₹{Math.round(totalItemDiscounts).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {quoteDiscountPct > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--green)' }}>
              <span>Quote Discount ({quoteDiscountPct}%)</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                − ₹{Math.round(quoteDiscountAmount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Conditional Adjusted Subtotal row: only render when discounts are present */}
          {(totalItemDiscounts > 0 || quoteDiscountPct > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '600', color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
              <span>Adjusted Subtotal</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{Math.round(adjustedSubtotal).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {flatAdjustment !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: flatAdjustment < 0 ? 'var(--red)' : 'var(--text)' }}>
              <span>Adjustment / Offset</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {flatAdjustment < 0 ? '− ' : '+ '}₹{Math.abs(Math.round(flatAdjustment)).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              GST (18%) <span style={{ fontSize: '8px', background: 'var(--steel-pale)', color: 'var(--steel)', padding: '1px 4px', borderRadius: '3px', fontWeight: '700' }}>TAX</span>
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ₹{Math.round(tax).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Grand Total Box (Set borderRadius to 0px to prevent clipping) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--navy)', color: 'var(--white)', padding: '10px 14px', borderRadius: '0px', marginTop: '6px' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Grand Total
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', fontWeight: '700' }}>
              ₹{Math.round(grandTotal).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 6. TOTAL IN WORDS (Full width styled band) */}
      <div style={{ background: 'var(--steel-pale)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '14px 40px', margin: '10px 0 20px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--steel)', display: 'block', marginBottom: '2px' }}>
          Amount in Words
        </span>
        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', color: 'var(--navy)', fontWeight: '700', }}>
          {numberToWords(grandTotal)}
        </span>
      </div>

      {/* 7. PROJECT TIMELINE & STEPS (Proposal Layout Only) */}
      {quote.format === 'proposal' && (quote.timeline_steps || []).length > 0 && (
        <div style={{ padding: '15px 30px', textAlign: 'left' }}>
          <h2 style={sectionHeadingStyle}>
            Project Execution Timeline
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px', color: 'var(--text)' }}>
            {(quote.timeline_steps || []).map((step, sidx) => {
              if (!step.trim()) return null;
              const hasColon = step.includes(':');
              return (
                <div key={sidx} style={{ paddingBottom: '6px', borderBottom: '1px dashed #E2E2DE', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: '700', fontSize: '14px', lineHeight: '1.2', userSelect: 'none' }}>•</span>
                  <p style={{ margin: 0 }}>
                    {hasColon ? (
                      <>
                        <strong>{step.split(':')[0]}:</strong>
                        {step.split(':').slice(1).join(':')}
                      </>
                    ) : step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. PAYMENT SCHEDULE (3 Column premium Card Grid - borderRadius 0px) */}
      {(quote.payment_schedule || []).length > 0 && (
        <div style={{ padding: '15px 30px', textAlign: 'left' }}>
          <h2 style={sectionHeadingStyle}>
            {quote.format === 'proposal' ? 'Terms of Partnership' : 'Payment Schedule'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            {(quote.payment_schedule || []).slice(0, 3).map((ms, idx) => {
              const borderColors = ['var(--navy)', 'var(--steel)', 'var(--gold)'];
              const pctValue = parseFloat(ms.pct) || 0;
              const milestoneAmount = grandTotal * (pctValue / 100);

              return (
                <div 
                  key={idx} 
                  style={{ 
                    background: 'var(--white)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '0px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ padding: '14px' }}>
                    <span style={{ fontSize: '8px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Milestone {idx + 1}
                    </span>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '38px', fontWeight: '700', color: 'var(--navy)', lineHeight: 1.1, margin: '4px 0' }}>
                      {ms.pct}<span style={{ fontSize: '18px', fontWeight: '600' }}>%</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text)', lineHeight: '1.4', minHeight: '36px' }}>
                      {ms.milestone}
                    </p>
                  </div>
                  
                  <div style={{ padding: '8px 14px', background: 'var(--steel-pale)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase' }}>Est. Amount</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', fontWeight: '700', color: 'var(--navy)' }}>
                      ₹{Math.round(milestoneAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Bottom Color Indicator Bar */}
                  <div style={{ height: '4px', background: borderColors[idx] }}></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9. NOTES & T&C (2 Column grid) */}
      <div style={{ padding: '15px 30px', textAlign: 'left' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Notes column */}
          <div>
            <h3 style={sectionHeadingStyle}>
              Care Notes &amp; Scope Inclusions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(quote.notes || []).map((note, idx) => {
                const hasColon = note.includes(':');
                return (
                  <div key={idx} style={{ fontSize: '11px', paddingBottom: '6px', borderBottom: '1px solid #E6E5E0' }}>
                    {hasColon ? (
                      <>
                        <strong style={{ display: 'block', color: 'var(--navy)', marginBottom: '2px' }}>{note.split(':')[0]}</strong>
                        <span style={{ color: 'var(--muted)' }}>{note.split(':').slice(1).join(':')}</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text)' }}>{note}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terms column */}
          <div>
            <h3 style={sectionHeadingStyle}>
              Terms &amp; Conditions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(quote.terms || []).map((term, idx) => {
                const hasColon = term.includes(':');
                return (
                  <div key={idx} style={{ fontSize: '11px', paddingBottom: '6px', borderBottom: '1px solid #E6E5E0' }}>
                    {hasColon ? (
                      <>
                        <strong style={{ display: 'block', color: 'var(--navy)', marginBottom: '2px' }}>{term.split(':')[0]}</strong>
                        <span style={{ color: 'var(--muted)' }}>{term.split(':').slice(1).join(':')}</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text)' }}>{term}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 10. FOOTER (Light cream background, Plus Jakarta Sans + JetBrains typography) */}
      <div className="doc-footer" style={{ background: '#FAF9F5', color: '#1A1A1A', padding: '24px 30px', marginTop: '30px', textAlign: 'left', borderTop: '4px solid #C9A96E' }}>
        <div style={{ paddingBottom: '20px', borderBottom: '1px solid #E2E2DE' }}>
          {/* Bank details */}
          <div>
            <span style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.10em', color: '#C9A96E', display: 'block', marginBottom: '8px' }}>
              Corporate Bank Beneficiary
            </span>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10.5px',
              color: '#1A1A1A',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              lineHeight: '1.6'
            }}>
              <div><strong>Entity:</strong> {settings.bankDetails?.name}</div>
              <div><strong>A/C No:</strong> {settings.bankDetails?.accountNo}</div>
              <div><strong>IFSC:  </strong> {settings.bankDetails?.ifsc}</div>
              <div><strong>Bank:  </strong> {settings.bankDetails?.bankName}</div>
            </div>
          </div>
        </div>

        {/* Corporate Address & GSTIN footer strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#444444',
          paddingTop: '12px',
          fontFamily: 'JetBrains Mono, monospace',
          borderTop: '1px solid #E2E2DE'
        }}>
          <span>GSTIN: {settings.bankDetails?.gstin} · {settings.bankDetails?.address}</span>
        </div>

        {/* System generated note — replaces signature */}
        <div style={{
          textAlign: 'center',
          paddingTop: '16px',
          borderTop: '1px solid #E2E2DE',
          marginTop: '16px'
        }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '9px',
            color: '#666666',
            letterSpacing: '0.04em',
            fontStyle: 'normal',
            margin: 0
          }}>
            This is a system generated document and does not require a seal or signature.
          </p>
        </div>
      </div>

    </div>
  );
}
