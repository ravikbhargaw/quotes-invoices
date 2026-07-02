## Pre-deployment checklist

### PDF Output
- [ ] Print a 3-item quote as PDF — verify all items visible
- [ ] Verify navy header background prints with color
- [ ] Verify bank details text is readable in footer
- [ ] Verify no localhost URL in PDF footer
- [ ] Verify template toggle buttons not visible in PDF
- [ ] Verify no line item splits across page break

### App Behaviour  
- [ ] AI parse produces correct JSON with estimate_no field
- [ ] Discount math: item discount + quote discount + GST cascades correctly
- [ ] Quotes log search works
- [ ] Load / Duplicate / Delete quote actions work
- [ ] Logo upload renders correctly in preview and PDF
- [ ] Default notes and terms are clean (no placeholders)

### Settings
- [ ] Bank details saved and visible in footer
- [ ] Logo height slider persists after refresh
- [ ] Supabase sync working (if configured)
