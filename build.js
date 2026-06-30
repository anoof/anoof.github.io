const fs   = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
let   html = fs.readFileSync('index.html', 'utf8');

// ── Helpers ───────────────────────────────────────────────────────────────

function projectLinks(p) {
  const github = p.github
    ? `<a href="${p.github}" target="_blank" rel="noopener"><img src="icons/github.svg" alt="GitHub"> GitHub</a>`
    : '';
  const demo = p.demo
    ? `<a href="${p.demo}" target="_blank" rel="noopener"><img src="icons/external.svg" alt="Live Demo"> Live Demo</a>`
    : '';
  return github + demo;
}

// ── Renderers (mirror main.js logic) ────────────────────────────────────

function buildSkills(skills) {
  return skills.map(cat => `
    <div class="skill-category">
      <div class="skill-category-title">${cat.category}</div>
      <div class="skill-tags">
        ${cat.tags.map(t => `<span class="skill-tag">${t}</span>`).join('')}
      </div>
    </div>`).join('');
}

function buildProjects(projects) {
  const featured = projects.find(p => p.featured);
  const others   = projects.filter(p => !p.featured);
  let out = '';

  if (featured) {
    const descParas = Array.isArray(featured.description)
      ? featured.description.map(d => `<p>${d}</p>`).join('')
      : `<p>${featured.description}</p>`;

    const visual = featured.image
      ? `<img src="${featured.image}" alt="${featured.name} screenshot" class="project-visual-img" />`
      : `<div class="project-visual-inner">
           <span class="project-visual-icon">${featured.icon || '🚀'}</span>
           <div class="project-visual-label">${featured.visual_label || ''}</div>
           <div class="project-visual-sublabel">${featured.visual_sublabel || ''}</div>
         </div>`;

    out += `
      <div class="featured-project">
        <div class="project-visual">${visual}</div>
        <div class="project-content">
          <p class="project-label">Featured Project</p>
          <h3 class="project-name">${featured.name}</h3>
          <div class="project-desc">${descParas}</div>
          <div class="project-tech">
            ${featured.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
          </div>
          <div class="project-links">${projectLinks(featured)}</div>
        </div>
      </div>`;
  }

  if (others.length) {
    out += `<p class="other-projects-heading">Other Projects</p>
      <div class="other-projects-grid">
        ${others.map(p => `
          <div class="other-project-card">
            ${p.image
              ? `<img src="${p.image}" alt="${p.name} screenshot" class="other-project-img" />`
              : `<div class="other-project-card-header">
                   <span class="other-project-icon">${p.icon || '💡'}</span>
                   <div class="other-project-card-links">${projectLinks(p)}</div>
                 </div>`}
            ${p.image
              ? `<div class="other-project-card-header other-project-card-header--below">
                   <div class="other-project-name">${p.name}</div>
                   <div class="other-project-card-links">${projectLinks(p)}</div>
                 </div>`
              : `<div class="other-project-name">${p.name}</div>`}
            <div class="other-project-desc">${p.description}</div>
            <div class="other-project-tech">
              ${p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;
  }

  return out;
}

function buildExperience(experience) {
  const tabBtns = experience.map((e, i) =>
    `<button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${e.id}">${e.tab_label}</button>`
  ).join('');

  const tabPanels = experience.map((e, i) => {
    const company = e.company ? `<span class="exp-company">@ ${e.company}</span>` : '';
    const meta    = [e.date, e.location].filter(Boolean).join(' · ');
    const bullets = e.bullets.map(b => `<li>${b}</li>`).join('');
    return `
      <div class="tab-panel${i === 0 ? ' active' : ''}" id="tab-${e.id}">
        <p class="exp-role">${e.role} ${company}</p>
        <p class="exp-date">${meta}</p>
        <ul class="exp-bullets">${bullets}</ul>
      </div>`;
  }).join('');

  return `<div class="tab-list" id="tabList">${tabBtns}</div>${tabPanels}`;
}

// ── Inject into HTML ─────────────────────────────────────────────────────

html = html.replace(
  '<div class="skills-grid" id="skills-container"></div>',
  `<div class="skills-grid" id="skills-container">${buildSkills(data.skills)}</div>`
);

html = html.replace(
  '<div id="projects-container"></div>',
  `<div id="projects-container">${buildProjects(data.projects)}</div>`
);

html = html.replace(
  '<div class="experience-tabs" id="experience-container"></div>',
  `<div class="experience-tabs" id="experience-container">${buildExperience(data.experience)}</div>`
);

// ── Write dist ───────────────────────────────────────────────────────────

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);

const rootFiles = ['styles.css', 'main.js', 'data.json'];
rootFiles.forEach(f => fs.copyFileSync(f, path.join('dist', f)));

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

copyDir('icons',  'dist/icons');
copyDir('images', 'dist/images');

console.log('Build complete → dist/');
