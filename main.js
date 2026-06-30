function renderSkills(skills) {
  document.getElementById('skills-container').innerHTML = skills.map(cat => `
    <div class="skill-category">
      <div class="skill-category-title">${cat.category}</div>
      <div class="skill-tags">
        ${cat.tags.map(t => `<span class="skill-tag">${t}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function projectLinks(p) {
  const github = p.github
    ? `<a href="${p.github}" target="_blank" rel="noopener"><img src="icons/github.svg" alt="GitHub"> GitHub</a>`
    : '';
  const demo = p.demo
    ? `<a href="${p.demo}" target="_blank" rel="noopener"><img src="icons/external.svg" alt="Live Demo"> Live Demo</a>`
    : '';
  return github + demo;
}

function renderProjects(projects) {
  const featured = projects.find(p => p.featured);
  const others   = projects.filter(p => !p.featured);
  let html = '';

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

    html += `
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
    html += `<p class="other-projects-heading">Other Projects</p>
      <div class="other-projects-grid">
        ${others.map(p => `
          <div class="other-project-card">
            ${p.image
              ? `<img src="${p.image}" alt="${p.name} screenshot" class="other-project-img" />`
              : `<div class="other-project-card-header">
                   <span class="other-project-icon">${p.icon || '💡'}</span>
                   <div class="other-project-card-links">${projectLinks(p)}</div>
                 </div>`
            }
            ${p.image ? `<div class="other-project-card-header other-project-card-header--below">
              <div class="other-project-name">${p.name}</div>
              <div class="other-project-card-links">${projectLinks(p)}</div>
            </div>` : `<div class="other-project-name">${p.name}</div>`}
            <div class="other-project-desc">${p.description}</div>
            <div class="other-project-tech">
              ${p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  document.getElementById('projects-container').innerHTML = html;
}

function renderExperience(experience) {
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

  document.getElementById('experience-container').innerHTML =
    `<div class="tab-list" id="tabList">${tabBtns}</div>${tabPanels}`;

  document.getElementById('tabList').addEventListener('click', ev => {
    const btn = ev.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
}

function initObservers() {
  document.querySelectorAll('section:not(#hero)').forEach(s => {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    }, { threshold: 0.1 }).observe(s);
  });

  const navLinks = document.querySelectorAll('#navLinks a');
  document.querySelectorAll('section').forEach(s => {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`#navLinks a[data-section="${s.id}"]`);
        if (link) link.classList.add('active');
      }
    }, { threshold: 0.4 }).observe(s);
  });
}

// In production the build script pre-renders these containers, so skip the
// fetch. In dev (Live Server) they're empty, so fetch and render normally.
if (document.getElementById('skills-container').children.length) {
  // Pre-rendered by build.js — just wire up the experience tab listener
  const tabList = document.getElementById('tabList');
  if (tabList) {
    tabList.addEventListener('click', ev => {
      const btn = ev.target.closest('.tab-btn');
      if (!btn) return;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  }
  initObservers();
} else {
  fetch('data.json')
    .then(r => r.json())
    .then(data => {
      renderSkills(data.skills);
      renderProjects(data.projects);
      renderExperience(data.experience);
      initObservers();
    })
    .catch(err => console.error('Failed to load data.json:', err));
}

// Cursor glow
const glow = document.getElementById('cursorGlow');
document.addEventListener('mousemove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top  = e.clientY + 'px';
});

// Mobile menu
const menuBtn    = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

menuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  menuBtn.textContent = mobileMenu.classList.contains('open') ? 'Close' : 'Menu';
});

window.closeMobileMenu = function () {
  mobileMenu.classList.remove('open');
  menuBtn.textContent = 'Menu';
};
