/**
 * Template: Coming Soon
 * 1 page — minimal splash page
 */
export default {
    id: 'builtin-coming-soon',
    name: 'Coming Soon',
    category: 'landing',
    description: 'Minimal splash page with countdown and email signup.',
    pages: 1,
    thumbnail: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
  <rect width="200" height="130" fill="#0a0a0a"/>
  <rect x="60" y="30" width="80" height="12" rx="3" fill="#fff" opacity="0.9"/>
  <rect x="70" y="52" width="60" height="6" rx="2" fill="#fff" opacity="0.4"/>
  <rect x="30" y="70" width="30" height="28" rx="4" fill="#1a1a1a"/>
  <rect x="68" y="70" width="30" height="28" rx="4" fill="#1a1a1a"/>
  <rect x="102" y="70" width="30" height="28" rx="4" fill="#1a1a1a"/>
  <rect x="140" y="70" width="30" height="28" rx="4" fill="#1a1a1a"/>
  <rect x="50" y="108" width="100" height="14" rx="4" fill="#333"/>
</svg>`)}`,
    pages_data: [
        {
            id: 'tpl-cs-p1',
            name: 'Coming Soon',
            html: `<section data-editor-element data-type="section" data-name="Coming Soon Page" id="tpl-cs-main" style="position:absolute;left:0;top:0;width:1200px;height:700px;background:radial-gradient(ellipse at center,#1a1a2e 0%,#0a0a0a 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;">
  <p data-editor-element data-type="text" data-name="Label" id="tpl-cs-label" style="position:relative;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:6px;text-transform:uppercase;margin:0;">We Are</p>
  <h1 data-editor-element data-type="heading" data-name="Title" id="tpl-cs-h1" style="position:relative;font-size:72px;font-weight:900;color:#fff;margin:0;text-align:center;letter-spacing:-2px;">Coming Soon</h1>
  <p data-editor-element data-type="paragraph" data-name="Description" id="tpl-cs-desc" style="position:relative;font-size:16px;color:rgba(255,255,255,0.5);text-align:center;max-width:480px;margin:0;line-height:1.6;">Something big is in the works. Leave your email and we'll notify you when we launch.</p>
  <div data-editor-element data-type="row" data-name="Countdown" id="tpl-cs-countdown" data-container="true" style="position:relative;display:flex;gap:16px;margin-top:8px;">
    <div data-editor-element data-type="card" data-name="Days" id="tpl-cs-days" data-container="true" style="position:relative;width:90px;height:90px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:32px;font-weight:800;color:#fff;line-height:1;">30</span><span data-editor-element data-type="text" style="position:relative;font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;">Days</span></div>
    <div data-editor-element data-type="card" data-name="Hours" id="tpl-cs-hrs" data-container="true" style="position:relative;width:90px;height:90px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:32px;font-weight:800;color:#fff;line-height:1;">12</span><span data-editor-element data-type="text" style="position:relative;font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;">Hours</span></div>
    <div data-editor-element data-type="card" data-name="Minutes" id="tpl-cs-mins" data-container="true" style="position:relative;width:90px;height:90px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:32px;font-weight:800;color:#fff;line-height:1;">45</span><span data-editor-element data-type="text" style="position:relative;font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;">Mins</span></div>
    <div data-editor-element data-type="card" data-name="Seconds" id="tpl-cs-secs" data-container="true" style="position:relative;width:90px;height:90px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:32px;font-weight:800;color:#fff;line-height:1;">00</span><span data-editor-element data-type="text" style="position:relative;font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;">Secs</span></div>
  </div>
  <div data-editor-element data-type="row" data-name="Email Form" id="tpl-cs-form" data-container="true" style="position:relative;display:flex;gap:8px;margin-top:8px;">
    <input data-editor-element data-type="input" id="tpl-cs-input" placeholder="Enter your email" aria-label="Email" style="position:relative;padding:14px 20px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-size:14px;width:280px;outline:none;box-sizing:border-box;">
    <button data-editor-element data-type="button" id="tpl-cs-btn" style="position:relative;padding:14px 24px;background:#fff;color:#0a0a0a;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;">Notify Me</button>
  </div>
</section>`,
            bpStyles: {},
            meta: { title: 'Coming Soon' }
        }
    ]
};
