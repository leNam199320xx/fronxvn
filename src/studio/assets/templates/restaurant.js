/**
 * Template: Restaurant
 * 2 pages — Home + Menu
 */
export default {
    id: 'builtin-restaurant',
    name: 'Restaurant',
    category: 'business',
    description: 'Restaurant website with hero, about, and menu page.',
    pages: 2,
    thumbnail: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
  <rect width="200" height="130" fill="#1c0a00"/>
  <rect x="0" y="0" width="200" height="55" fill="#2d1200"/>
  <rect x="40" y="16" width="120" height="12" rx="2" fill="#c9a96e" opacity="0.9"/>
  <rect x="60" y="34" width="80" height="6" rx="2" fill="#fff" opacity="0.3"/>
  <rect x="10" y="65" width="85" height="55" rx="3" fill="#2d1200"/>
  <rect x="103" y="65" width="87" height="55" rx="3" fill="#2d1200"/>
</svg>`)}`,
    pages_data: [
        {
            id: 'tpl-rest-home',
            name: 'Home',
            html: `<nav data-editor-element data-type="section" data-name="Nav" id="tpl-rs-nav" style="position:absolute;left:0;top:0;width:1200px;height:64px;background:rgba(28,10,0,0.95);display:flex;align-items:center;justify-content:space-between;padding:0 48px;box-sizing:border-box;z-index:10;">
  <span data-editor-element data-type="text" data-name="Logo" id="tpl-rs-logo" style="position:relative;font-size:22px;font-weight:800;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;">Bistro</span>
  <div data-editor-element data-type="row" id="tpl-rs-links" data-container="true" style="position:relative;display:flex;gap:32px;">
    <a data-editor-element data-type="link" id="tpl-rs-n1" href="#" style="position:relative;color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;letter-spacing:1px;">Menu</a>
    <a data-editor-element data-type="link" id="tpl-rs-n2" href="#" style="position:relative;color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;letter-spacing:1px;">About</a>
    <a data-editor-element data-type="link" id="tpl-rs-n3" href="#" style="position:relative;color:rgba(255,255,255,0.8);text-decoration:none;font-size:14px;letter-spacing:1px;">Contact</a>
  </div>
  <button data-editor-element data-type="button" id="tpl-rs-resv" style="position:relative;padding:10px 24px;background:#c9a96e;color:#1c0a00;border:none;border-radius:4px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:1px;text-transform:uppercase;">Reserve</button>
</nav>
<section data-editor-element data-type="section" data-name="Hero" id="tpl-rs-hero" style="position:absolute;left:0;top:0;width:1200px;height:600px;background:linear-gradient(to bottom,rgba(28,10,0,0.7),rgba(28,10,0,0.9)),linear-gradient(135deg,#3d1a00,#1c0a00);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding-top:64px;box-sizing:border-box;">
  <p data-editor-element data-type="text" id="tpl-rs-pre" style="position:relative;font-size:13px;color:#c9a96e;letter-spacing:6px;text-transform:uppercase;margin:0;">Fine Dining Experience</p>
  <h1 data-editor-element data-type="heading" id="tpl-rs-h1" style="position:relative;font-size:64px;font-weight:900;color:#fff;margin:0;text-align:center;line-height:1.1;font-style:italic;">Where Every Meal<br>Tells a Story</h1>
  <p data-editor-element data-type="paragraph" id="tpl-rs-sub" style="position:relative;font-size:16px;color:rgba(255,255,255,0.6);text-align:center;max-width:480px;margin:0;line-height:1.7;">Award-winning cuisine crafted from locally sourced ingredients. Open Tuesday–Sunday, 6pm–11pm.</p>
  <div data-editor-element data-type="row" id="tpl-rs-ctarow" data-container="true" style="position:relative;display:flex;gap:16px;margin-top:8px;">
    <button data-editor-element data-type="button" id="tpl-rs-b1" style="position:relative;padding:16px 36px;background:#c9a96e;color:#1c0a00;border:none;border-radius:4px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:1px;text-transform:uppercase;">Reserve a Table</button>
    <button data-editor-element data-type="button" id="tpl-rs-b2" style="position:relative;padding:16px 36px;background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);border-radius:4px;font-size:15px;cursor:pointer;letter-spacing:1px;">View Menu</button>
  </div>
</section>
<section data-editor-element data-type="section" data-name="About" id="tpl-rs-about" style="position:absolute;left:0;top:620px;width:1200px;min-height:320px;background:#fff;display:flex;align-items:center;gap:60px;padding:60px 80px;box-sizing:border-box;">
  <div data-editor-element data-type="div" id="tpl-rs-aboutimg" style="position:relative;width:400px;height:280px;background:linear-gradient(135deg,#c9a96e,#8b6914);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:60px;">🍽</div>
  <div data-editor-element data-type="div" id="tpl-rs-abouttxt" data-container="true" style="position:relative;display:flex;flex-direction:column;gap:16px;">
    <p data-editor-element data-type="text" id="tpl-rs-asubt" style="position:relative;font-size:12px;color:#c9a96e;letter-spacing:4px;text-transform:uppercase;margin:0;">Our Story</p>
    <h2 data-editor-element data-type="heading" id="tpl-rs-ah2" style="position:relative;font-size:36px;font-weight:800;color:#1c0a00;margin:0;line-height:1.2;">A Passion for Exceptional Food</h2>
    <p data-editor-element data-type="paragraph" id="tpl-rs-ap" style="position:relative;font-size:16px;color:#555;margin:0;line-height:1.8;">Founded in 2010, Bistro has been at the forefront of modern cuisine. Our chefs bring decades of experience from Michelin-starred restaurants around the world.</p>
  </div>
</section>`,
            bpStyles: {},
            meta: { title: 'Bistro Restaurant' }
        },
        {
            id: 'tpl-rest-menu',
            name: 'Menu',
            html: `<nav data-editor-element data-type="section" data-name="Nav" id="tpl-rsm-nav" style="position:absolute;left:0;top:0;width:1200px;height:64px;background:#1c0a00;display:flex;align-items:center;justify-content:space-between;padding:0 48px;box-sizing:border-box;">
  <span data-editor-element data-type="text" id="tpl-rsm-logo" style="position:relative;font-size:22px;font-weight:800;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;">Bistro</span>
</nav>
<section data-editor-element data-type="section" data-name="Menu Header" id="tpl-rsm-hdr" style="position:absolute;left:0;top:64px;width:1200px;height:140px;background:#2d1200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
  <p data-editor-element data-type="text" id="tpl-rsm-pre" style="position:relative;font-size:11px;color:#c9a96e;letter-spacing:6px;text-transform:uppercase;margin:0;">Savor the Season</p>
  <h1 data-editor-element data-type="heading" id="tpl-rsm-h1" style="position:relative;font-size:40px;font-weight:900;color:#fff;margin:0;font-style:italic;">Our Menu</h1>
</section>
<section data-editor-element data-type="section" data-name="Menu Items" id="tpl-rsm-items" style="position:absolute;left:0;top:224px;width:1200px;padding:48px 80px;box-sizing:border-box;background:#fff;">
  <h2 data-editor-element data-type="heading" id="tpl-rsm-cat1" style="position:relative;font-size:14px;font-weight:700;color:#c9a96e;letter-spacing:4px;text-transform:uppercase;margin:0 0 24px;padding-bottom:12px;border-bottom:1px solid #f0e6d3;">Starters</h2>
  <div data-editor-element data-type="div" id="tpl-rsm-s1" data-container="true" style="position:relative;display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px;">
    <div data-editor-element data-type="card" data-name="Dish" id="tpl-rsm-d1" data-container="true" style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;padding:16px 0;border-bottom:1px solid #f5f5f5;">
      <div data-editor-element data-type="div" id="tpl-rsm-d1t" data-container="true" style="position:relative;display:flex;flex-direction:column;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:16px;font-weight:600;color:#1c0a00;">Burrata Salad</span><span data-editor-element data-type="text" style="position:relative;font-size:13px;color:#999;">heirloom tomatoes, basil oil, sea salt</span></div>
      <span data-editor-element data-type="text" style="position:relative;font-size:16px;font-weight:700;color:#c9a96e;white-space:nowrap;margin-left:16px;">$18</span>
    </div>
    <div data-editor-element data-type="card" data-name="Dish" id="tpl-rsm-d2" data-container="true" style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;padding:16px 0;border-bottom:1px solid #f5f5f5;">
      <div data-editor-element data-type="div" id="tpl-rsm-d2t" data-container="true" style="position:relative;display:flex;flex-direction:column;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:16px;font-weight:600;color:#1c0a00;">Seared Scallops</span><span data-editor-element data-type="text" style="position:relative;font-size:13px;color:#999;">cauliflower purée, pancetta crisp</span></div>
      <span data-editor-element data-type="text" style="position:relative;font-size:16px;font-weight:700;color:#c9a96e;white-space:nowrap;margin-left:16px;">$24</span>
    </div>
  </div>
  <h2 data-editor-element data-type="heading" id="tpl-rsm-cat2" style="position:relative;font-size:14px;font-weight:700;color:#c9a96e;letter-spacing:4px;text-transform:uppercase;margin:0 0 24px;padding-bottom:12px;border-bottom:1px solid #f0e6d3;">Mains</h2>
  <div data-editor-element data-type="div" id="tpl-rsm-s2" data-container="true" style="position:relative;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <div data-editor-element data-type="card" data-name="Dish" id="tpl-rsm-d3" data-container="true" style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;padding:16px 0;border-bottom:1px solid #f5f5f5;">
      <div data-editor-element data-type="div" id="tpl-rsm-d3t" data-container="true" style="position:relative;display:flex;flex-direction:column;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:16px;font-weight:600;color:#1c0a00;">Wagyu Beef Tenderloin</span><span data-editor-element data-type="text" style="position:relative;font-size:13px;color:#999;">truffle jus, potato gratin, asparagus</span></div>
      <span data-editor-element data-type="text" style="position:relative;font-size:16px;font-weight:700;color:#c9a96e;white-space:nowrap;margin-left:16px;">$68</span>
    </div>
    <div data-editor-element data-type="card" data-name="Dish" id="tpl-rsm-d4" data-container="true" style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;padding:16px 0;border-bottom:1px solid #f5f5f5;">
      <div data-editor-element data-type="div" id="tpl-rsm-d4t" data-container="true" style="position:relative;display:flex;flex-direction:column;gap:4px;"><span data-editor-element data-type="text" style="position:relative;font-size:16px;font-weight:600;color:#1c0a00;">Pan-Roasted Salmon</span><span data-editor-element data-type="text" style="position:relative;font-size:13px;color:#999;">lemon beurre blanc, fennel, capers</span></div>
      <span data-editor-element data-type="text" style="position:relative;font-size:16px;font-weight:700;color:#c9a96e;white-space:nowrap;margin-left:16px;">$42</span>
    </div>
  </div>
</section>`,
            bpStyles: {},
            meta: { title: 'Bistro - Menu' }
        }
    ]
};
