// Drawing examples for house style v0.2-beta. Written in the clean look (round 5 pick E1).
// The page script turns them into the sketch look (round 5 pick A2+B1+C2+D3) when the page asks for sketch.
// Class markers (read by the sketch step and by agents copying an example):
//   bx = box shape, bt = box title, gp = group frame, gl = group label, ed = one edge (line + head), el = edge label.
// Rules: page colors only, text >= 12 px, every label has a halo the color of what is behind it, nothing touches.
const halo = (bg = 'var(--halo, var(--surface))') => `stroke="${bg}" stroke-width="4" paint-order="stroke" stroke-linejoin="round"`;
const TONE = { plain: ['var(--surface)', 'var(--ink)'], accent: ['var(--accent-soft)', 'var(--accent)'], go: ['var(--go-soft)', 'var(--go)'] };

export function box(x, y, w, h, title, tone = 'plain', sub = '') {
  const [f, s] = TONE[tone];
  const ty = sub ? y + h / 2 - 2 : y + h / 2 + 5;
  return `<rect class="bx" x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${f}" stroke="${s}" stroke-width="1.5"/>` +
    `<text class="bt" x="${x + w / 2}" y="${ty}" text-anchor="middle" font-size="15" font-weight="600" fill="var(--ink)" ${halo(f)}>${title}</text>` +
    (sub ? `<text class="bs" x="${x + w / 2}" y="${ty + 17}" text-anchor="middle" font-size="13" fill="var(--muted)" ${halo(f)}>${sub}</text>` : '');
}
export function group(x, y, w, h, label, dashed = false) {
  return `<rect class="gp" x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${dashed ? 'none' : 'var(--sunk)'}" stroke="var(--muted)" stroke-width="1.25"${dashed ? ' stroke-dasharray="6 5"' : ''}/>` +
    `<text class="gl" x="${x + 14}" y="${y + 22}" font-size="13" fill="var(--muted)" ${halo(dashed ? undefined : 'var(--sunk)')}>${label}</text>`;
}
// head: a small filled triangle pointing along the last segment
function head(x, y, dx, dy, color) {
  const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, bx = x - ux * 10, by = y - uy * 10, px = -uy * 5, py = ux * 5;
  return `<path d="M${x} ${y}L${+(bx + px).toFixed(1)} ${+(by + py).toFixed(1)}L${+(bx - px).toFixed(1)} ${+(by - py).toFixed(1)}z" fill="${color}"/>`;
}
// edge through points [[x,y],...]; label at [lx,ly] with an anchor
export function edge(pts, label = '', at = null, anchor = 'middle', color = 'var(--ink)', dashed = false, bg) {
  const [ax, ay] = pts[pts.length - 2], [zx, zy] = pts[pts.length - 1];
  const L = Math.hypot(zx - ax, zy - ay) || 1, ex = zx - (zx - ax) / L * 9, ey = zy - (zy - ay) / L * 9;
  const d = 'M' + pts.slice(0, -1).map(p => p.join(' ')).join('L') + `L${+ex.toFixed(1)} ${+ey.toFixed(1)}`;
  let s = `<g class="ed"><path d="${d}" fill="none" stroke="${color}" stroke-width="1.5"${dashed ? ' stroke-dasharray="5 5"' : ''}/>${head(zx, zy, zx - ax, zy - ay, color)}</g>`;
  if (label) {
    const [lx, ly] = at || [(pts[0][0] + zx) / 2, Math.min(pts[0][1], zy) - 9];
    s += `<text class="el" x="${lx}" y="${ly}" text-anchor="${anchor}" font-size="13" font-weight="500" fill="var(--muted)" ${halo(bg)}>${label}</text>`;
  }
  return s;
}
const svg = (w, h, label, body) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" font-family="var(--font-body)">\n${body}\n</svg>`;

export const FLOW = svg(720, 100, 'Flow: you ask, the agent writes plan.html, a build session builds from it',
  box(10, 25, 120, 50, 'You') + edge([[130, 50], [200, 50]], 'asks') + box(200, 25, 120, 50, 'Agent', 'accent') +
  edge([[320, 50], [390, 50]], 'writes') + box(390, 25, 120, 50, 'plan.html') + edge([[510, 50], [580, 50]], 'feeds') + box(580, 25, 130, 50, 'Build', 'go'));

export const BEFORE_AFTER = svg(720, 210, 'Before: three loose notes. After: one plan page.',
  group(10, 10, 290, 190, 'Before', true) + box(40, 50, 110, 40, 'chat log') + box(170, 70, 110, 40, 'notes.txt') + box(60, 130, 140, 40, 'old plan.md') +
  edge([[310, 105], [410, 105]], 'html-plan', [360, 95]) +
  group(420, 10, 290, 190, 'After', true) + box(490, 80, 150, 50, 'plan.html', 'accent'));

const X = (v) => Math.round(v * 0.947); // the map was drawn 760 wide; squeeze x so it fits 720 without shrinking text
export const MAP = svg(720, 440, 'System map: your laptop runs Claude Code and the skill; online, the model API, GitHub and Vercel',
  group(X(8), 8, X(530), 424, 'Your laptop') + group(X(580), 8, X(170), 424, 'Online') +
  edge([[X(130), 82], [X(200), 82]], 'asks', [X(165), 71], 'middle', undefined, false, 'var(--sunk)') +
  edge([[X(320), 82], [X(410), 82]], 'reads', [X(365), 71], 'middle', undefined, false, 'var(--sunk)') +
  edge([[X(300), 60], [X(460), 16], [X(610), 70]], 'prompts', [X(464), 44], 'middle', undefined, false, 'var(--sunk)') +
  edge([[X(610), 94], [X(464), 132], [X(320), 94]], 'replies', [X(464), 152], 'middle', undefined, false, 'var(--sunk)') +
  edge([[X(260), 104], [X(260), 200]], 'writes', [X(272), 156], 'start', undefined, false, 'var(--sunk)') +
  edge([[X(200), 232], [X(80), 232], [X(80), 340]], 'opens in', [X(140), 221], 'middle', undefined, false, 'var(--sunk)') +
  edge([[X(60), 340], [X(60), 104]], 'shows', [X(34), 236], 'middle', undefined, false, 'var(--sunk)') +
  edge([[X(320), 222], [X(610), 222]], 'pushed to', [X(464), 210], 'middle', undefined, false, 'var(--sunk)') +
  edge([[X(665), 244], [X(665), 340]], 'triggers', [X(677), 296], 'start', undefined, false, 'var(--sunk)') +
  edge([[X(610), 362], [X(130), 362]], 'serves', [X(370), 350], 'middle', undefined, false, 'var(--sunk)') +
  box(X(30), 60, X(100), 44, 'You') + box(X(200), 60, X(120), 44, 'Claude Code', 'accent') + box(X(410), 60, X(100), 44, 'Skill') +
  box(X(200), 200, X(120), 44, 'plan.html') + box(X(30), 340, X(100), 44, 'Browser') +
  box(X(610), 60, X(110), 44, 'Model API') + box(X(610), 200, X(110), 44, 'GitHub') + box(X(610), 340, X(110), 44, 'Vercel', 'go'));

// Sequence: who talks to whom, in time order, top to bottom.
const LIFE = [['You', 70], ['Agent', 260, 'accent'], ['plan.html', 450], ['Build', 640, 'go']];
const msg = (i, from, to, y, label, back = false) => {
  const x1 = LIFE[from][1] + (to > from ? 6 : -6), x2 = LIFE[to][1] + (to > from ? -6 : 6);
  return edge([[x1, y], [x2, y]], `${i}. ${label}`, [(x1 + x2) / 2, y - 9], 'middle', back ? 'var(--go)' : 'var(--ink)', back);
};
export const SEQUENCE = svg(720, 340, 'Sequence: you ask, the agent asks questions, writes the page, you paste answers, then a build runs and reports checks',
  LIFE.map(([t, x, tone]) => box(x - 60, 10, 120, 40, t, tone || 'plain') + `<path class="lf" d="M${x} 50V325" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4 5" fill="none"/>`).join('') +
  msg(1, 0, 1, 90, '/html-plan') + msg(2, 1, 0, 130, 'questions', true) + msg(3, 1, 2, 170, 'writes the page') +
  msg(4, 0, 1, 210, 'pastes answers') + msg(5, 1, 3, 255, 'build from plan') + msg(6, 3, 0, 300, 'checks pass', true));

// Timeline: phases left to right on one line, a dot per milestone, the current phase marked.
const PH = [['Plan', 'Oct 11'], ['Bake-off', 'Oct 13'], ['Lock picks', 'Oct 19'], ['Ship repo', 'next'], ['Go public', 'later']];
export const TIMELINE = svg(720, 150, 'Timeline: plan, bake-off, lock picks (now), ship repo, go public',
  `<path class="lf" d="M40 70H680" stroke="var(--line)" stroke-width="3" fill="none"/>` +
  `<path class="lf" d="M40 70H360" stroke="var(--go)" stroke-width="3" fill="none"/>` +
  PH.map(([t, when], i) => {
    const x = 40 + i * 160, done = i < 2, now = i === 2, c = done ? 'var(--go)' : now ? 'var(--accent)' : 'var(--muted)';
    return `<circle class="bx" cx="${x}" cy="70" r="${now ? 11 : 8}" fill="${done ? 'var(--go)' : now ? 'var(--accent-soft)' : 'var(--surface)'}" stroke="${c}" stroke-width="2"/>` +
      `<text class="bt" x="${x}" y="${i % 2 ? 112 : 40}" text-anchor="${i === 0 ? 'start' : i === PH.length - 1 ? 'end' : 'middle'}" font-size="15" font-weight="600" fill="var(--ink)" ${halo()}>${t}</text>` +
      `<text class="el" x="${x}" y="${i % 2 ? 130 : 22}" text-anchor="${i === 0 ? 'start' : i === PH.length - 1 ? 'end' : 'middle'}" font-size="13" fill="${now ? 'var(--accent)' : 'var(--muted)'}" ${halo()}>${now ? 'now · ' : ''}${when}</text>`;
  }).join(''));

// A big drawing (1600 wide) for the viewer example: three groups, eleven boxes.
export const BIG = svg(1600, 620, 'Big system map: the skill repo, two install paths, and the agents that use the skills',
  group(10, 10, 470, 600, 'snell-skills repo') + group(560, 10, 470, 600, 'Install paths', true) + group(1110, 10, 480, 600, 'Agents on a machine') +
  box(60, 70, 170, 50, 'skills/html/', 'accent') + box(260, 70, 170, 50, 'skills/tools/') + box(60, 250, 170, 50, 'plugin.json') +
  box(260, 250, 170, 50, '.changeset/') + box(160, 450, 170, 50, 'Release Action', 'go') +
  box(640, 140, 310, 56, 'npx skills add', 'plain', 'copies skill folders') + box(640, 400, 310, 56, 'Plugin marketplace', 'plain', 'updates itself') +
  box(1180, 70, 170, 50, 'Claude Code', 'accent') + box(1380, 70, 170, 50, 'Codex') + box(1180, 400, 170, 50, 'settings.md') + box(1380, 400, 170, 50, 'Your pages', 'go') +
  edge([[145, 120], [145, 250]], 'listed in', [157, 190], 'start', undefined, false, 'var(--sunk)') +
  edge([[345, 300], [345, 400], [290, 450]], 'versions', [357, 360], 'start', undefined, false, 'var(--sunk)') +
  edge([[430, 95], [640, 168]], 'scans', [535, 116]) +
  edge([[430, 275], [640, 428]], 'reads', [535, 338]) +
  edge([[950, 168], [1180, 95]], 'installs into', [1065, 118]) +
  edge([[950, 168], [1380, 95]], 'installs into', [1170, 152]) +
  edge([[950, 428], [1180, 95]], 'adds plugin', [1060, 300]) +
  edge([[1265, 400], [1265, 120]], 'read by', [1277, 270], 'start', undefined, false, 'var(--sunk)') +
  edge([[1465, 120], [1465, 400]], 'writes', [1477, 270], 'start', undefined, false, 'var(--sunk)'));
