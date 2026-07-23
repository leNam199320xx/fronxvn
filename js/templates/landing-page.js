/**
 * Template: Landing Page
 * 1 page — Hero + Features + CTA + Footer
 */
export default {
    id: 'builtin-landing-page',
    name: 'Landing Page',
    category: 'landing',
    description: 'Hero section, features grid, CTA banner and footer.',
    pages: 1,
    thumbnail: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
  <rect width="200" height="130" fill="#1a1a2e"/>
  <rect x="0" y="0" width="200" height="50" fill="#0f3460"/>
  <rect x="40" y="14" width="120" height="10" rx="2" fill="#e94560" opacity="0.9"/>
  <rect x="60" y="30" width="80" height="6" rx="2" fill="#fff" opacity="0.3"/>
  <rect x="10" y="60" width="55" height="35" rx="3" fill="#16213e"/>
  <rect x="73" y="60" width="55" height="35" rx="3" fill="#16213e"/>
  <rect x="135" y="60" width="55" height="35" rx="3" fill="#16213e"/>
  <rect x="50" y="105" width="100" height="18" rx="3" fill="#0f3460"/>
</svg>`)}`,
    pages_data: [
        {
            id: 'tpl-landing-p1',
            name: 'Home',
            html: `<section data-editor-element data-type="section" data-name="Hero" id="tpl-lp-hero" style="position:absolute;left:0;top:0;width:1200px;height:500px;background:linear-gradient(135deg,#0f3460 0%,#16213e 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;overflow:hidden;">
  <h1 data-editor-element data-type="heading" data-name="Hero Title" id="tpl-lp-h1" style="position:relative;font-size:48px;font-weight:800;color:#ffffff;text-align:center;margin:0;line-height:1.2;">Build Something Amazing</h1>
  <p data-editor-element data-type="paragraph" data-name="Hero Subtitle" id="tpl-lp-sub" style="position:relative;font-size:18px;color:rgba(255,255,255,0.7);text-align:center;margin:0;max-width:600px;">The fastest way to create beautiful websites without writing a single line of code.</p>
  <div data-editor-element data-type="row" data-name="Hero CTA Row" id="tpl-lp-ctarow" data-container="true" style="position:relative;display:flex;gap:12px;margin-top:8px;">
    <button data-editor-element data-type="button" data-name="Primary CTA" id="tpl-lp-btn1" style="position:relative;padding:14px 32px;background:#e94560;color:#fff;border:none;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer;">Get Started Free</button>
    <button data-editor-element data-type="button" data-name="Secondary CTA" id="tpl-lp-btn2" style="position:relative;padding:14px 32px;background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.4);border-radius:6px;font-size:16px;cursor:pointer;">Watch Demo</button>
  </div>
</section>
<section data-editor-element data-type="section" data-name="Features" id="tpl-lp-feat" style="position:absolute;left:0;top:520px;width:1200px;min-height:320px;background:#ffffff;padding:60px 40px;box-sizing:border-box;">
  <h2 data-editor-element data-type="heading" data-name="Features Title" id="tpl-lp-h2" style="position:relative;font-size:32px;font-weight:700;color:#1a1a2e;text-align:center;margin:0 0 40px;">Why Choose Us</h2>
  <div data-editor-element data-type="row" data-name="Features Row" id="tpl-lp-featrow" data-container="true" style="position:relative;display:flex;gap:24px;justify-content:center;flex-wrap:wrap;">
    <div data-editor-element data-type="card" data-name="Feature 1" id="tpl-lp-f1" data-container="true" style="position:relative;width:320px;padding:28px;background:#f8f9fa;border-radius:12px;text-align:center;">
      <div data-editor-element data-type="text" data-name="Icon" id="tpl-lp-f1i" style="position:relative;font-size:32px;margin-bottom:12px;">⚡</div>
      <h3 data-editor-element data-type="heading" data-name="Feature Title" id="tpl-lp-f1t" style="position:relative;font-size:18px;font-weight:600;color:#1a1a2e;margin:0 0 8px;">Lightning Fast</h3>
      <p data-editor-element data-type="paragraph" id="tpl-lp-f1p" style="position:relative;font-size:14px;color:#666;margin:0;line-height:1.6;">Built for speed from the ground up. Your sites load in milliseconds.</p>
    </div>
    <div data-editor-element data-type="card" data-name="Feature 2" id="tpl-lp-f2" data-container="true" style="position:relative;width:320px;padding:28px;background:#f8f9fa;border-radius:12px;text-align:center;">
      <div data-editor-element data-type="text" data-name="Icon" id="tpl-lp-f2i" style="position:relative;font-size:32px;margin-bottom:12px;">🎨</div>
      <h3 data-editor-element data-type="heading" data-name="Feature Title" id="tpl-lp-f2t" style="position:relative;font-size:18px;font-weight:600;color:#1a1a2e;margin:0 0 8px;">Beautiful Design</h3>
      <p data-editor-element data-type="paragraph" id="tpl-lp-f2p" style="position:relative;font-size:14px;color:#666;margin:0;line-height:1.6;">Pixel-perfect designs with our professional template library.</p>
    </div>
    <div data-editor-element data-type="card" data-name="Feature 3" id="tpl-lp-f3" data-container="true" style="position:relative;width:320px;padding:28px;background:#f8f9fa;border-radius:12px;text-align:center;">
      <div data-editor-element data-type="text" data-name="Icon" id="tpl-lp-f3i" style="position:relative;font-size:32px;margin-bottom:12px;">🔒</div>
      <h3 data-editor-element data-type="heading" data-name="Feature Title" id="tpl-lp-f3t" style="position:relative;font-size:18px;font-weight:600;color:#1a1a2e;margin:0 0 8px;">Secure & Reliable</h3>
      <p data-editor-element data-type="paragraph" id="tpl-lp-f3p" style="position:relative;font-size:14px;color:#666;margin:0;line-height:1.6;">Enterprise-grade security with 99.9% uptime guarantee.</p>
    </div>
  </div>
</section>
<section data-editor-element data-type="section" data-name="CTA Banner" id="tpl-lp-cta" style="position:absolute;left:0;top:920px;width:1200px;height:200px;background:linear-gradient(90deg,#e94560,#c62a47);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
  <h2 data-editor-element data-type="heading" data-name="CTA Title" id="tpl-lp-ctat" style="position:relative;font-size:28px;font-weight:700;color:#fff;margin:0;text-align:center;">Ready to get started?</h2>
  <button data-editor-element data-type="button" data-name="CTA Button" id="tpl-lp-ctab" style="position:relative;padding:14px 40px;background:#fff;color:#e94560;border:none;border-radius:6px;font-size:16px;font-weight:700;cursor:pointer;">Start For Free →</button>
</section>
<footer data-editor-element data-type="section" data-name="Footer" id="tpl-lp-footer" style="position:absolute;left:0;top:1140px;width:1200px;height:80px;background:#1a1a2e;display:flex;align-items:center;justify-content:center;">
  <p data-editor-element data-type="paragraph" id="tpl-lp-fp" style="position:relative;font-size:13px;color:rgba(255,255,255,0.4);margin:0;">© 2025 Your Company. All rights reserved.</p>
</footer>`,
            bpStyles: {},
            meta: { title: 'Landing Page', description: 'A beautiful landing page template.' }
        }
    ]
};
