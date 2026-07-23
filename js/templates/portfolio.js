/**
 * Template: Portfolio
 * 3 pages — Home, Projects, Contact
 */
export default {
    id: 'builtin-portfolio',
    name: 'Portfolio',
    category: 'portfolio',
    description: 'Personal portfolio with home, projects gallery and contact form.',
    pages: 3,
    thumbnail: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
  <rect width="200" height="130" fill="#0d0d0d"/>
  <rect x="0" y="0" width="200" height="60" fill="#111"/>
  <circle cx="100" cy="28" r="16" fill="#333"/>
  <rect x="60" y="48" width="80" height="6" rx="2" fill="#fff" opacity="0.6"/>
  <rect x="10" y="72" width="55" height="40" rx="3" fill="#1a1a1a"/>
  <rect x="73" y="72" width="55" height="40" rx="3" fill="#1a1a1a"/>
  <rect x="136" y="72" width="54" height="40" rx="3" fill="#1a1a1a"/>
</svg>`)}`,
    pages_data: [
        {
            id: 'tpl-pf-home',
            name: 'Home',
            html: `<nav data-editor-element data-type="section" data-name="Nav" id="tpl-pf-nav" style="position:absolute;left:0;top:0;width:1200px;height:60px;background:#111;display:flex;align-items:center;justify-content:space-between;padding:0 40px;box-sizing:border-box;">
  <span data-editor-element data-type="text" data-name="Logo" id="tpl-pf-logo" style="position:relative;font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;">PORTFOLIO</span>
  <div data-editor-element data-type="row" data-name="Nav Links" id="tpl-pf-navlinks" data-container="true" style="position:relative;display:flex;gap:28px;">
    <a data-editor-element data-type="link" id="tpl-pf-n1" href="#" style="position:relative;color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;">Work</a>
    <a data-editor-element data-type="link" id="tpl-pf-n2" href="#" style="position:relative;color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;">About</a>
    <a data-editor-element data-type="link" id="tpl-pf-n3" href="#" style="position:relative;color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;">Contact</a>
  </div>
</nav>
<section data-editor-element data-type="section" data-name="Hero" id="tpl-pf-hero" style="position:absolute;left:0;top:60px;width:1200px;height:560px;background:#0d0d0d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;">
  <div data-editor-element data-type="div" data-name="Avatar" id="tpl-pf-avatar" style="position:relative;width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:36px;color:#fff;">👤</div>
  <h1 data-editor-element data-type="heading" id="tpl-pf-h1" style="position:relative;font-size:52px;font-weight:800;color:#fff;margin:0;text-align:center;">Alex Johnson</h1>
  <p data-editor-element data-type="paragraph" id="tpl-pf-sub" style="position:relative;font-size:20px;color:rgba(255,255,255,0.5);margin:0;text-align:center;letter-spacing:4px;text-transform:uppercase;">UI/UX Designer &amp; Developer</p>
  <a data-editor-element data-type="button" id="tpl-pf-cta" href="#" style="position:relative;margin-top:12px;padding:14px 36px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:30px;font-size:15px;font-weight:600;">View My Work →</a>
</section>`,
            bpStyles: {},
            meta: { title: 'Portfolio - Home' }
        },
        {
            id: 'tpl-pf-projects',
            name: 'Projects',
            html: `<nav data-editor-element data-type="section" data-name="Nav" id="tpl-pf2-nav" style="position:absolute;left:0;top:0;width:1200px;height:60px;background:#111;display:flex;align-items:center;justify-content:space-between;padding:0 40px;box-sizing:border-box;">
  <span data-editor-element data-type="text" data-name="Logo" id="tpl-pf2-logo" style="position:relative;font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;">PORTFOLIO</span>
</nav>
<section data-editor-element data-type="section" data-name="Projects Grid" id="tpl-pf2-grid" style="position:absolute;left:0;top:80px;width:1200px;min-height:600px;background:#0d0d0d;padding:40px;">
  <h2 data-editor-element data-type="heading" id="tpl-pf2-h2" style="position:relative;font-size:36px;font-weight:800;color:#fff;margin:0 0 40px;text-align:center;">Selected Work</h2>
  <div data-editor-element data-type="row" data-name="Grid Row 1" id="tpl-pf2-r1" data-container="true" style="position:relative;display:flex;gap:20px;margin-bottom:20px;justify-content:center;">
    <div data-editor-element data-type="card" data-name="Project 1" id="tpl-pf2-p1" data-container="true" style="position:relative;width:360px;height:240px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;overflow:hidden;display:flex;align-items:flex-end;">
      <div data-editor-element data-type="div" id="tpl-pf2-p1o" style="position:relative;padding:20px;background:linear-gradient(transparent,rgba(0,0,0,0.7));width:100%;box-sizing:border-box;">
        <h3 data-editor-element data-type="heading" id="tpl-pf2-p1t" style="position:relative;font-size:18px;color:#fff;margin:0 0 4px;">Brand Identity</h3>
        <p data-editor-element data-type="paragraph" id="tpl-pf2-p1d" style="position:relative;font-size:12px;color:rgba(255,255,255,0.7);margin:0;">Branding, Visual Design</p>
      </div>
    </div>
    <div data-editor-element data-type="card" data-name="Project 2" id="tpl-pf2-p2" data-container="true" style="position:relative;width:360px;height:240px;background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:12px;overflow:hidden;display:flex;align-items:flex-end;">
      <div data-editor-element data-type="div" id="tpl-pf2-p2o" style="position:relative;padding:20px;background:linear-gradient(transparent,rgba(0,0,0,0.7));width:100%;box-sizing:border-box;">
        <h3 data-editor-element data-type="heading" id="tpl-pf2-p2t" style="position:relative;font-size:18px;color:#fff;margin:0 0 4px;">Mobile App Design</h3>
        <p data-editor-element data-type="paragraph" id="tpl-pf2-p2d" style="position:relative;font-size:12px;color:rgba(255,255,255,0.7);margin:0;">UI/UX, Prototyping</p>
      </div>
    </div>
    <div data-editor-element data-type="card" data-name="Project 3" id="tpl-pf2-p3" data-container="true" style="position:relative;width:360px;height:240px;background:linear-gradient(135deg,#4facfe,#00f2fe);border-radius:12px;overflow:hidden;display:flex;align-items:flex-end;">
      <div data-editor-element data-type="div" id="tpl-pf2-p3o" style="position:relative;padding:20px;background:linear-gradient(transparent,rgba(0,0,0,0.7));width:100%;box-sizing:border-box;">
        <h3 data-editor-element data-type="heading" id="tpl-pf2-p3t" style="position:relative;font-size:18px;color:#fff;margin:0 0 4px;">Web Platform</h3>
        <p data-editor-element data-type="paragraph" id="tpl-pf2-p3d" style="position:relative;font-size:12px;color:rgba(255,255,255,0.7);margin:0;">Frontend, Design System</p>
      </div>
    </div>
  </div>
</section>`,
            bpStyles: {},
            meta: { title: 'Portfolio - Projects' }
        },
        {
            id: 'tpl-pf-contact',
            name: 'Contact',
            html: `<nav data-editor-element data-type="section" data-name="Nav" id="tpl-pf3-nav" style="position:absolute;left:0;top:0;width:1200px;height:60px;background:#111;display:flex;align-items:center;justify-content:space-between;padding:0 40px;box-sizing:border-box;">
  <span data-editor-element data-type="text" data-name="Logo" id="tpl-pf3-logo" style="position:relative;font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;">PORTFOLIO</span>
</nav>
<section data-editor-element data-type="section" data-name="Contact Section" id="tpl-pf3-section" style="position:absolute;left:0;top:60px;width:1200px;min-height:600px;background:#0d0d0d;display:flex;flex-direction:column;align-items:center;padding:60px 40px;box-sizing:border-box;gap:40px;">
  <h2 data-editor-element data-type="heading" id="tpl-pf3-h2" style="position:relative;font-size:36px;font-weight:800;color:#fff;margin:0;text-align:center;">Get In Touch</h2>
  <p data-editor-element data-type="paragraph" id="tpl-pf3-sub" style="position:relative;font-size:16px;color:rgba(255,255,255,0.5);margin:0;text-align:center;max-width:500px;">Have a project in mind? I'd love to hear about it. Send me a message and I'll get back to you soon.</p>
  <form data-editor-element data-type="form" data-name="Contact Form" id="tpl-pf3-form" data-container="true" style="position:relative;width:500px;display:flex;flex-direction:column;gap:16px;">
    <input data-editor-element data-type="input" id="tpl-pf3-name" placeholder="Your Name" aria-label="Your Name" style="position:relative;width:100%;padding:14px 16px;background:#1a1a1a;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;">
    <input data-editor-element data-type="input" id="tpl-pf3-email" placeholder="Email Address" aria-label="Email Address" style="position:relative;width:100%;padding:14px 16px;background:#1a1a1a;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;">
    <textarea data-editor-element data-type="textarea" id="tpl-pf3-msg" placeholder="Your message..." aria-label="Message" style="position:relative;width:100%;padding:14px 16px;background:#1a1a1a;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;resize:vertical;min-height:120px;outline:none;font-family:inherit;"></textarea>
    <button data-editor-element data-type="button" id="tpl-pf3-btn" style="position:relative;padding:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">Send Message</button>
  </form>
</section>`,
            bpStyles: {},
            meta: { title: 'Portfolio - Contact' }
        }
    ]
};
