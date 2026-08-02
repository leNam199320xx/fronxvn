/**
 * Template: Pricing
 * 1 page — Pricing table + FAQ
 */
export default {
    id: 'builtin-pricing',
    name: 'Pricing',
    category: 'business',
    description: 'Clean pricing table with 3 tiers and FAQ section.',
    pages: 1,
    thumbnail: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
  <rect width="200" height="130" fill="#f8fafc"/>
  <rect x="10" y="10" width="55" height="75" rx="4" fill="#e2e8f0"/>
  <rect x="73" y="5" width="55" height="85" rx="4" fill="#3b82f6"/>
  <rect x="136" y="10" width="54" height="75" rx="4" fill="#e2e8f0"/>
  <rect x="20" y="95" width="160" height="6" rx="2" fill="#e2e8f0"/>
  <rect x="20" y="107" width="130" height="6" rx="2" fill="#e2e8f0"/>
  <rect x="20" y="119" width="145" height="6" rx="2" fill="#e2e8f0"/>
</svg>`)}`,
    pages_data: [
        {
            id: 'tpl-pricing-p1',
            name: 'Pricing',
            html: `<section data-editor-element data-type="section" data-name="Pricing Header" id="tpl-pr-hdr" style="position:absolute;left:0;top:0;width:1200px;height:160px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border-bottom:1px solid #e2e8f0;">
  <h1 data-editor-element data-type="heading" id="tpl-pr-h1" style="position:relative;font-size:40px;font-weight:800;color:#0f172a;margin:0;text-align:center;">Simple, Transparent Pricing</h1>
  <p data-editor-element data-type="paragraph" id="tpl-pr-sub" style="position:relative;font-size:16px;color:#64748b;margin:0;text-align:center;">Choose the plan that works for you. Cancel anytime.</p>
</section>
<section data-editor-element data-type="section" data-name="Pricing Cards" id="tpl-pr-cards" style="position:absolute;left:0;top:180px;width:1200px;min-height:400px;background:#f8fafc;display:flex;align-items:center;justify-content:center;gap:24px;padding:40px;box-sizing:border-box;">
  <div data-editor-element data-type="card" data-name="Starter Plan" id="tpl-pr-c1" data-container="true" style="position:relative;width:320px;padding:32px;background:#fff;border:2px solid #e2e8f0;border-radius:16px;display:flex;flex-direction:column;gap:16px;">
    <h3 data-editor-element data-type="heading" id="tpl-pr-c1t" style="position:relative;font-size:20px;font-weight:700;color:#0f172a;margin:0;">Starter</h3>
    <div data-editor-element data-type="div" id="tpl-pr-c1p" style="position:relative;display:flex;align-items:baseline;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:40px;font-weight:800;color:#0f172a;">$9</span><span data-editor-element data-type="text" style="position:relative;font-size:14px;color:#64748b;">/month</span></div>
    <ul data-editor-element data-type="list" id="tpl-pr-c1l" data-container="true" style="position:relative;list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;"><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:#475569;">✓ 5 Projects</li><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:#475569;">✓ 10GB Storage</li><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:#475569;">✓ Email Support</li></ul>
    <button data-editor-element data-type="button" id="tpl-pr-c1b" style="position:relative;padding:12px;background:#f1f5f9;color:#0f172a;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Get Started</button>
  </div>
  <div data-editor-element data-type="card" data-name="Pro Plan" id="tpl-pr-c2" data-container="true" style="position:relative;width:320px;padding:32px;background:#3b82f6;border:2px solid #3b82f6;border-radius:16px;display:flex;flex-direction:column;gap:16px;">
    <div data-editor-element data-type="div" id="tpl-pr-badge" style="position:relative;background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;width:fit-content;">MOST POPULAR</div>
    <h3 data-editor-element data-type="heading" id="tpl-pr-c2t" style="position:relative;font-size:20px;font-weight:700;color:#fff;margin:0;">Pro</h3>
    <div data-editor-element data-type="div" id="tpl-pr-c2p" style="position:relative;display:flex;align-items:baseline;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:40px;font-weight:800;color:#fff;">$29</span><span data-editor-element data-type="text" style="position:relative;font-size:14px;color:rgba(255,255,255,0.7);">/month</span></div>
    <ul data-editor-element data-type="list" id="tpl-pr-c2l" data-container="true" style="position:relative;list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;"><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:rgba(255,255,255,0.9);">✓ Unlimited Projects</li><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:rgba(255,255,255,0.9);">✓ 100GB Storage</li><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:rgba(255,255,255,0.9);">✓ Priority Support</li><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:rgba(255,255,255,0.9);">✓ Custom Domain</li></ul>
    <button data-editor-element data-type="button" id="tpl-pr-c2b" style="position:relative;padding:12px;background:#fff;color:#3b82f6;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">Get Started</button>
  </div>
  <div data-editor-element data-type="card" data-name="Enterprise Plan" id="tpl-pr-c3" data-container="true" style="position:relative;width:320px;padding:32px;background:#fff;border:2px solid #e2e8f0;border-radius:16px;display:flex;flex-direction:column;gap:16px;">
    <h3 data-editor-element data-type="heading" id="tpl-pr-c3t" style="position:relative;font-size:20px;font-weight:700;color:#0f172a;margin:0;">Enterprise</h3>
    <div data-editor-element data-type="div" id="tpl-pr-c3p" style="position:relative;display:flex;align-items:baseline;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:40px;font-weight:800;color:#0f172a;">$99</span><span data-editor-element data-type="text" style="position:relative;font-size:14px;color:#64748b;">/month</span></div>
    <ul data-editor-element data-type="list" id="tpl-pr-c3l" data-container="true" style="position:relative;list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;"><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:#475569;">✓ Everything in Pro</li><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:#475569;">✓ Unlimited Storage</li><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:#475569;">✓ SLA &amp; Dedicated Support</li><li data-editor-element data-type="text" style="position:relative;font-size:14px;color:#475569;">✓ SSO &amp; Advanced Security</li></ul>
    <button data-editor-element data-type="button" id="tpl-pr-c3b" style="position:relative;padding:12px;background:#f1f5f9;color:#0f172a;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Contact Sales</button>
  </div>
</section>`,
            bpStyles: {},
            meta: { title: 'Pricing' }
        }
    ]
};
