// Drawing examples for the house style: plain, hand-written SVG that agents copy and adapt.
// Class markers (read by agents copying an example):
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

// ---------------- 1.1: moving, 3D and linked drawings ----------------
// The new hues for box(): every tone is a line color plus its soft fill.
for (const t of ['teal', 'violet', 'ochre', 'rose', 'slate']) TONE[t] = [`var(--${t}-soft)`, `var(--${t})`];
const flowing = (s, n = 1, extra = '') => s.replace('<g class="ed">', `<g class="ed" data-flow="${n}"${extra}>`);

// Live system map: a reference drawing (boxes and arrows) with packets moving on the busy paths. Wide.
export const LIVE = svg(980, 250, 'Live map: requests flow from the browser through the API to orders and Postgres; jobs flow through a queue to a worker',
  group(10, 10, 490, 230, 'Request path') + group(525, 10, 445, 230, 'Later, off the request path', true) +
  box(30, 60, 110, 50, 'Browser', 'slate') + box(190, 60, 115, 50, 'API', 'accent') + box(355, 60, 120, 50, 'Orders', 'teal') +
  box(355, 160, 120, 50, 'Postgres', 'rose') + box(565, 60, 135, 50, 'Queue', 'ochre') + box(775, 60, 135, 50, 'Worker', 'teal') +
  box(775, 160, 135, 50, 'Email sent', 'go') +
  flowing(edge([[140, 85], [190, 85]], 'POST', [165, 74], 'middle', undefined, false, 'var(--sunk)'), 2) +
  flowing(edge([[305, 85], [355, 85]], 'route', [330, 74], 'middle', undefined, false, 'var(--sunk)'), 2) +
  flowing(edge([[415, 110], [415, 160]], 'insert', [427, 140], 'start', undefined, false, 'var(--sunk)'), 1) +
  flowing(edge([[475, 85], [565, 85]], 'job', [520, 74]), 1, ' data-flow-speed="3.2"') +
  flowing(edge([[700, 85], [775, 85]], 'pick up', [737, 74]), 1, ' data-flow-speed="3.2"') +
  flowing(edge([[842, 110], [842, 160]], 'send', [854, 140], 'start'), 1, ' data-flow-speed="3.2"'));

// Isometric system map, the 3D look. Written in floor units; the page draws the faces.
// data-node and data-edge names let a scene light them up.
const ISO_BODY = `<g data-floor="-0.6 -0.6 17 8"/>
  <g class="ed" data-edge="b-g" data-route="0.8,3.4 4.2,3.4" data-flow/>
  <g class="ed" data-edge="g-a" data-route="4.2,3.4 4.2,0.8 7.6,0.8" data-flow/>
  <g class="ed" data-edge="g-o" data-route="4.2,3.4 7.6,3.4" data-flow/>
  <g class="ed" data-edge="o-d" data-route="7.6,3.4 7.6,6.4 11.6,6.4" data-flow/>
  <g class="ed" data-edge="o-q" data-route="7.6,3.4 11.6,3.4" data-flow/>
  <g class="ed" data-edge="q-w" data-route="11.6,3.4 15.2,3.4" data-flow/>
  <g class="ed" data-edge="w-d" data-route="15.2,3.4 15.2,6.4 11.6,6.4" data-flow/>
  <g data-node="browser" class="tone-slate" data-box="0 2.6 1.6 1.6 0.6" data-label="Browser" data-sub="the user"/>
  <g data-node="gateway" class="tone-accent" data-box="3.4 2.6 1.6 1.6 1.2" data-label="API gateway" data-sub="routes"/>
  <g data-node="auth" class="tone-violet" data-box="6.8 0 1.6 1.6 1" data-label="Auth" data-sub="checks the token"/>
  <g data-node="orders" class="tone-teal" data-box="6.8 2.6 1.6 1.6 1.7" data-label="Orders" data-sub="service"/>
  <g data-node="queue" class="tone-ochre" data-box="10.2 2.8 2.8 1.2 0.5" data-label="Queue" data-sub="jobs wait here"/>
  <g data-node="worker" class="tone-teal" data-box="14.4 2.6 1.6 1.6 1" data-label="Worker" data-sub="sends email"/>
  <g data-node="db" class="tone-rose" data-cyl="10.8 5.6 1.6 1.3" data-label="Postgres" data-sub="orders table"/>`;
export const ISO = `<svg class="iso" data-iso="42 330 80" viewBox="0 0 990 620" role="img" aria-label="3D map: browser, API gateway, auth, orders, queue, worker and Postgres, with requests moving between them" font-family="var(--font-body)">
  ${ISO_BODY}
</svg>`;
export const SCENE_STEPS = `<ol class="scene-steps">
    <li data-edge="b-g" data-from="browser" data-node="gateway">The browser sends <code>POST /orders</code> to the API gateway.</li>
    <li data-edge="g-a" data-from="gateway" data-node="auth">The gateway asks Auth if the token is good.</li>
    <li data-edge="g-a" data-back data-from="auth" data-node="gateway">Auth says yes. The gateway passes the request on.</li>
    <li data-edge="g-o" data-from="gateway" data-node="orders">The Orders service gets the request.</li>
    <li data-edge="o-d" data-from="orders" data-node="db">Orders writes one row to Postgres.</li>
    <li data-edge="o-q" data-from="orders" data-node="queue">Orders puts a "send receipt" job on the queue, then answers the browser at once.</li>
    <li data-edge="q-w" data-from="queue" data-node="worker">Later, a worker picks up the job, off the request path.</li>
    <li data-edge="w-d" data-from="worker" data-node="db">The worker reads the order and sends the email. Done.</li>
  </ol>`;

// Layers stacked in 3D: lines in the air ("x,y,z" points) carry a request down and back up.
export const STACK = `<svg class="iso" data-iso="36 200 150" viewBox="0 0 600 360" role="img" aria-label="Three layers stacked: the page on top, the API in the middle, the database at the bottom, with a request moving down through them" font-family="var(--font-body)">
  <g class="ed" data-route="3,2,2.6 3,2,1.8" data-flow data-flow-speed="1.6"/>
  <g class="ed" data-route="3.6,2.6,1.3 3.6,2.6,0.5" data-flow data-flow-speed="1.6" data-flow-back/>
  <g class="tone-slate" data-box="0 0 6 4 0.5" data-z="0"/>
  <g class="tone-teal" data-box="0 0 6 4 0.5" data-z="1.3"/>
  <g class="tone-accent" data-box="0 0 6 4 0.5" data-z="2.6"/>
  <text class="iso-lb" data-at="6.4 0 2.8">Page</text>
  <text class="iso-lb" data-at="6.4 0 1.5">API</text>
  <text class="iso-lb" data-at="6.4 0 0.2">Database</text>
</svg>`;

// An intuition drawing: a queue is a conveyor belt. Draw the mechanism, not a box called "queue".
export const BELT = svg(720, 230, 'A queue as a conveyor belt: the orders service drops jobs on the left, the worker takes them off on the right',
  box(10, 40, 130, 56, 'Orders', 'teal', 'drops jobs') + box(580, 40, 130, 56, 'Worker', 'teal', 'takes one') +
  `<rect x="160" y="120" width="400" height="26" rx="13" fill="var(--sunk)" stroke="var(--muted)" stroke-width="1.5"/>` +
  [180, 260, 340, 420, 500, 540].map(x => `<circle cx="${x}" cy="133" r="7" fill="var(--surface)" stroke="var(--muted)" stroke-width="1.5"/>`).join('') +
  `<g class="ed" data-flow="4" data-flow-speed="7"><path d="M150 108H570" fill="none" stroke="none"/></g>` +
  edge([[75, 96], [75, 108], [150, 108]], '', null) + edge([[570, 108], [645, 108], [645, 96]], '', null) +
  `<text x="360" y="185" text-anchor="middle" font-size="14" fill="var(--muted)" ${halo('var(--surface)')}>Jobs wait on the belt. If the worker is slow, the belt fills up; nothing is lost.</text>`);

// Linked words: the same data-hl key on a word and on a shape lights both up.
export const LINKED_SVG = svg(720, 110, 'Read path: browser asks the cache first, then the database on a miss',
  box(10, 30, 130, 50, 'Browser') + `<g data-hl="cache">${box(290, 30, 130, 50, 'Cache', 'violet')}</g>` + `<g data-hl="db">${box(580, 30, 130, 50, 'Database', 'rose')}</g>` +
  edge([[140, 55], [290, 55]], 'read', [215, 44]) + edge([[420, 55], [580, 55]], 'on a miss', [500, 44]));

// A scene that builds the picture as it goes: data-show reveals shapes marked class="reveal", one step at a time.
// For explain pages: start with the problem, then add the part that fixes it, then show where it breaks.
const named = (s, id) => s.replace('<g class="ed">', `<g class="ed" data-edge="${id}">`);
export const BUILD = svg(720, 250, 'A cache added step by step between a browser and a slow database',
  `<g data-node="br">${box(10, 96, 130, 56, 'Browser', 'slate', 'asks for a page')}</g>` +
  `<g data-node="db">${box(580, 96, 130, 56, 'Database', 'rose', 'slow: 40 ms')}</g>` +
  named(edge([[75, 96], [75, 44], [645, 44], [645, 96]], 'every read: 40 ms', [360, 33]), 'slow') +
  `<g id="b-cache" class="reveal">` +
    `<g data-node="cache">${box(295, 96, 130, 56, 'Cache', 'violet', 'fast: 1 ms')}</g>` +
    named(edge([[140, 124], [295, 124]], 'read', [217, 114]), 'br-c') +
    named(edge([[425, 124], [580, 124]], 'on a miss', [502, 114]), 'c-db') +
  `</g>` +
  `<g id="b-stale" class="reveal"><rect x="250" y="182" width="220" height="44" rx="8" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="1.5"/>` +
    `<text x="360" y="209" text-anchor="middle" font-size="14" font-weight="600" fill="var(--ink)" ${halo('var(--warn-soft)')}>The copy can go out of date</text></g>`);
export const BUILD_STEPS = `<ol class="scene-steps">
    <li data-edge="slow" data-from="br" data-node="db">With no cache, every read goes all the way to the database: 40 ms each time.</li>
    <li data-show="#b-cache" data-node="cache">Add a cache in between. It starts empty.</li>
    <li data-edge="br-c" data-from="br" data-node="cache">The first read asks the cache. It has nothing yet: a miss.</li>
    <li data-edge="c-db" data-from="cache" data-node="db">So the cache asks the database (40 ms) and keeps a copy.</li>
    <li data-edge="br-c" data-from="br" data-node="cache">The next read finds the copy: a hit, 1 ms.</li>
    <li data-show="#b-stale" data-node="db">But if the database changes, the cache still holds the old copy. That is the price of speed.</li>
  </ol>`;
