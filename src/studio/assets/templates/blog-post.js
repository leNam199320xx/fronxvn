/**
 * Template: Blog Post
 * 2 pages — Article page + Archive listing
 */
export default {
    id: 'builtin-blog-post',
    name: 'Blog',
    category: 'blog',
    description: 'Article detail page and post archive listing.',
    pages: 2,
    thumbnail: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
  <rect width="200" height="130" fill="#fff"/>
  <rect x="0" y="0" width="200" height="36" fill="#f8fafc"/>
  <rect x="16" y="12" width="60" height="10" rx="2" fill="#cbd5e1"/>
  <rect x="16" y="48" width="168" height="14" rx="2" fill="#0f172a"/>
  <rect x="16" y="70" width="80" height="6" rx="2" fill="#94a3b8"/>
  <rect x="16" y="84" width="168" height="5" rx="2" fill="#e2e8f0"/>
  <rect x="16" y="95" width="168" height="5" rx="2" fill="#e2e8f0"/>
  <rect x="16" y="106" width="120" height="5" rx="2" fill="#e2e8f0"/>
</svg>`)}`,
    pages_data: [
        {
            id: 'tpl-blog-article',
            name: 'Article',
            html: `<nav data-editor-element data-type="section" data-name="Nav" id="tpl-bl-nav" style="position:absolute;left:0;top:0;width:1200px;height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 40px;box-sizing:border-box;gap:32px;">
  <span data-editor-element data-type="text" data-name="Logo" id="tpl-bl-logo" style="position:relative;font-size:18px;font-weight:800;color:#0f172a;">The Blog</span>
  <div data-editor-element data-type="row" id="tpl-bl-navlinks" data-container="true" style="position:relative;display:flex;gap:24px;">
    <a data-editor-element data-type="link" id="tpl-bl-n1" href="#" style="position:relative;color:#64748b;text-decoration:none;font-size:14px;">Home</a>
    <a data-editor-element data-type="link" id="tpl-bl-n2" href="#" style="position:relative;color:#64748b;text-decoration:none;font-size:14px;">Articles</a>
    <a data-editor-element data-type="link" id="tpl-bl-n3" href="#" style="position:relative;color:#64748b;text-decoration:none;font-size:14px;">About</a>
  </div>
</nav>
<article data-editor-element data-type="section" data-name="Article Body" id="tpl-bl-art" style="position:absolute;left:50%;top:96px;transform:translateX(-50%);width:720px;padding:0 0 60px;box-sizing:border-box;">
  <div data-editor-element data-type="div" id="tpl-bl-meta" style="position:relative;display:flex;align-items:center;gap:12px;margin-bottom:24px;">
    <span data-editor-element data-type="text" id="tpl-bl-cat" style="position:relative;background:#eff6ff;color:#3b82f6;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Design</span>
    <span data-editor-element data-type="text" id="tpl-bl-date" style="position:relative;font-size:13px;color:#94a3b8;">July 22, 2025 · 5 min read</span>
  </div>
  <h1 data-editor-element data-type="heading" id="tpl-bl-h1" style="position:relative;font-size:42px;font-weight:800;color:#0f172a;margin:0 0 20px;line-height:1.2;">How to Build Beautiful Websites Without Code</h1>
  <p data-editor-element data-type="paragraph" id="tpl-bl-lead" style="position:relative;font-size:20px;color:#475569;margin:0 0 32px;line-height:1.6;font-style:italic;">Visual editors have come a long way. Here's everything you need to know to build professional websites today.</p>
  <img data-editor-element data-type="image" id="tpl-bl-img" alt="Article cover image" style="position:relative;width:100%;height:360px;object-fit:cover;border-radius:12px;margin-bottom:32px;background:#e2e8f0;">
  <p data-editor-element data-type="paragraph" id="tpl-bl-p1" style="position:relative;font-size:16px;color:#334155;line-height:1.8;margin:0 0 16px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
  <p data-editor-element data-type="paragraph" id="tpl-bl-p2" style="position:relative;font-size:16px;color:#334155;line-height:1.8;margin:0 0 16px;">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
  <h2 data-editor-element data-type="heading" id="tpl-bl-h2" style="position:relative;font-size:28px;font-weight:700;color:#0f172a;margin:32px 0 16px;">Key Takeaways</h2>
  <p data-editor-element data-type="paragraph" id="tpl-bl-p3" style="position:relative;font-size:16px;color:#334155;line-height:1.8;margin:0;">Sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio, et tempus feugiat.</p>
</article>`,
            bpStyles: {},
            meta: { title: 'Blog - Article' }
        },
        {
            id: 'tpl-blog-archive',
            name: 'Archive',
            html: `<nav data-editor-element data-type="section" data-name="Nav" id="tpl-bl2-nav" style="position:absolute;left:0;top:0;width:1200px;height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 40px;box-sizing:border-box;gap:32px;">
  <span data-editor-element data-type="text" data-name="Logo" id="tpl-bl2-logo" style="position:relative;font-size:18px;font-weight:800;color:#0f172a;">The Blog</span>
</nav>
<section data-editor-element data-type="section" data-name="Archive" id="tpl-bl2-arch" style="position:absolute;left:0;top:80px;width:1200px;padding:40px;box-sizing:border-box;">
  <h1 data-editor-element data-type="heading" id="tpl-bl2-h1" style="position:relative;font-size:36px;font-weight:800;color:#0f172a;margin:0 0 32px;">All Articles</h1>
  <div data-editor-element data-type="div" id="tpl-bl2-list" data-container="true" style="position:relative;display:flex;flex-direction:column;gap:24px;max-width:720px;">
    <div data-editor-element data-type="card" data-name="Post 1" id="tpl-bl2-post1" data-container="true" style="position:relative;padding:24px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;display:flex;flex-direction:column;gap:8px;">
      <span data-editor-element data-type="text" id="tpl-bl2-p1cat" style="position:relative;font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;">Design</span>
      <h2 data-editor-element data-type="heading" id="tpl-bl2-p1t" style="position:relative;font-size:20px;font-weight:700;color:#0f172a;margin:0;">How to Build Beautiful Websites Without Code</h2>
      <p data-editor-element data-type="paragraph" id="tpl-bl2-p1d" style="position:relative;font-size:14px;color:#64748b;margin:0;line-height:1.6;">A deep dive into modern no-code tools and how they're changing web development.</p>
      <span data-editor-element data-type="text" id="tpl-bl2-p1date" style="position:relative;font-size:12px;color:#94a3b8;">July 22, 2025 · 5 min read</span>
    </div>
    <div data-editor-element data-type="card" data-name="Post 2" id="tpl-bl2-post2" data-container="true" style="position:relative;padding:24px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;display:flex;flex-direction:column;gap:8px;">
      <span data-editor-element data-type="text" id="tpl-bl2-p2cat" style="position:relative;font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1px;">Development</span>
      <h2 data-editor-element data-type="heading" id="tpl-bl2-p2t" style="position:relative;font-size:20px;font-weight:700;color:#0f172a;margin:0;">The Future of Web Development in 2025</h2>
      <p data-editor-element data-type="paragraph" id="tpl-bl2-p2d" style="position:relative;font-size:14px;color:#64748b;margin:0;line-height:1.6;">Exploring the latest trends shaping how we build for the web today.</p>
      <span data-editor-element data-type="text" id="tpl-bl2-p2date" style="position:relative;font-size:12px;color:#94a3b8;">July 15, 2025 · 8 min read</span>
    </div>
  </div>
</section>`,
            bpStyles: {},
            meta: { title: 'Blog - Archive' }
        }
    ]
};
