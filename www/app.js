/* ClipForge — app mobile (Capacitor). Toutes les données restent sur le téléphone. */
const $ = (s, r = document) => r.querySelector(s);
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('cf_' + k)); return v ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem('cf_' + k, JSON.stringify(v)); }
};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Outils IA ---------- */
const LANG = { k: 'langue', l: 'Langue du contenu', t: 'sel', o: ['Français', 'English', 'Español', 'العربية'], d: 'Français' };
const JSON_RULE = '\n\nRéponds UNIQUEMENT avec du JSON valide (aucun markdown, aucun texte autour). Tout le texte est écrit dans la langue demandée, sauf les prompts Veo 3 qui restent en anglais.';

const TOOLS = {
  clipping: {
    title: 'Clipping Agent', icon: '✂', badge: 'Nouveau',
    desc: 'Colle la transcription d’une vidéo longue : l’agent repère les meilleurs passages à découper en clips.',
    fields: [
      { k: 'titre', l: 'Titre de la vidéo', t: 'text' },
      { k: 'transcript', l: 'Transcription (avec horodatage si possible)', t: 'area', ph: '[00:01:20] Voici pourquoi…', req: 1 },
      { k: 'nb', l: 'Nombre de clips', t: 'num', d: 5 },
      { k: 'duree', l: 'Durée cible par clip (secondes)', t: 'num', d: 45 }, LANG],
    sys: 'Tu es un monteur expert de clips viraux (TikTok, Reels, Shorts). À partir de la transcription, choisis les passages les plus forts (émotion, surprise, conseil net, histoire complète). Chaque clip doit tenir seul. Réponds par un tableau JSON d’objets {"titre","debut","fin","accroche","pourquoi","legende"}. "debut" et "fin" reprennent les horodatages de la transcription.'
  },
  veo3: {
    title: 'Agents Veo 3', icon: '🎥', deploy: 1,
    desc: 'Transforme une idée en scènes de 8 secondes avec des prompts prêts à coller dans Veo 3.',
    fields: [
      { k: 'idee', l: 'Idée de la vidéo', t: 'area', ph: 'Un forgeron au lever du soleil…', req: 1 },
      { k: 'style', l: 'Style', t: 'sel', o: ['Cinématique', 'Réaliste documentaire', 'Publicité produit', 'Animation 3D', 'Vlog'], d: 'Cinématique' },
      { k: 'scenes', l: 'Nombre de scènes', t: 'num', d: 4 }, LANG],
    sys: 'Tu es expert des prompts Veo 3. Découpe l’idée en scènes de 8 secondes. Chaque "prompt_veo3" est en anglais et précise sujet, action, cadrage, mouvement de caméra, lumière, décor, dialogue entre guillemets (dans la langue demandée) et ambiance sonore. Format : {"titre","concept","scenes":[{"numero","duree","prompt_veo3","voix_off","son"}],"legende"}.'
  },
  histoires: {
    title: 'Agents Histoires', icon: '📖', deploy: 1,
    desc: 'Écris des histoires courtes prêtes à narrer, avec les visuels de chaque scène.',
    fields: [
      { k: 'sujet', l: 'Thème ou idée', t: 'text', ph: 'Le forgeron et le roi', req: 1 },
      { k: 'genre', l: 'Genre', t: 'sel', o: ['Mystère', 'Horreur', 'Motivation', 'Histoire vraie', 'Drame', 'Comédie', 'Science-fiction', 'Légende africaine'], d: 'Mystère' },
      { k: 'duree', l: 'Durée', t: 'sel', o: ['30 secondes', '45 secondes', '60 secondes', '90 secondes'], d: '60 secondes' }, LANG],
    sys: 'Tu es scénariste d’histoires courtes virales pour vidéos sans visage (narration + visuels). Première phrase = accroche qui retient. Format : {"titre","accroche","script","scenes":[{"numero","visuel","narration"}],"hashtags":[],"legende"}.'
  },
  niches: {
    title: 'Niches TikTok populaires', icon: '🔥', deploy: 1,
    desc: 'Trouve des niches qui marchent sur TikTok, avec idées de vidéos et pistes de monétisation.',
    fields: [
      { k: 'pays', l: 'Pays ou audience', t: 'text', d: 'Côte d’Ivoire' },
      { k: 'domaine', l: 'Domaine (optionnel)', t: 'text', ph: 'métiers, cuisine, bricolage…' },
      { k: 'nb', l: 'Nombre de niches', t: 'num', d: 8 }, LANG],
    sys: 'Tu es analyste TikTok. Propose des niches réalistes et actuelles, adaptées à l’audience demandée. Sois concret, ne promets aucun revenu garanti. Format : tableau d’objets {"niche","idee","audience","exemples":[],"monetisation","difficulte"}.'
  },
  shortniches: {
    title: 'AI Short Niches', icon: '🤖', deploy: 1,
    desc: 'Niches de vidéos courtes faites avec l’IA, sans montrer ton visage.',
    fields: [
      { k: 'domaine', l: 'Domaine ou centre d’intérêt', t: 'text', ph: 'soudure, motivation, faits insolites…' },
      { k: 'nb', l: 'Nombre de niches', t: 'num', d: 6 }, LANG],
    sys: 'Tu es expert des chaînes de vidéos courtes générées par IA (faceless). Pour chaque niche, donne un concept faisable seul avec un téléphone. Format : tableau d’objets {"niche","concept","format","outils":[],"exemple_titre","potentiel"}.'
  },
  viral: {
    title: 'Viral Stories', icon: '📈', deploy: 1,
    desc: 'Idées d’histoires conçues pour être regardées jusqu’au bout et partagées.',
    fields: [
      { k: 'sujet', l: 'Sujet (optionnel)', t: 'text' },
      { k: 'plateforme', l: 'Plateforme', t: 'sel', o: ['TikTok', 'YouTube Shorts', 'Instagram Reels', 'Facebook Reels'], d: 'TikTok' },
      { k: 'nb', l: 'Nombre d’idées', t: 'num', d: 6 }, LANG],
    sys: 'Tu es stratège de contenu viral. Chaque idée a une accroche des 2 premières secondes, un twist et une raison de partage. Format : tableau d’objets {"titre","accroche","resume","twist","pourquoi_viral"}.'
  }
};
const LABELS = { titre: 'Titre', debut: 'Début', fin: 'Fin', accroche: 'Accroche', pourquoi: 'Pourquoi ce passage', legende: 'Légende', numero: 'Scène', duree: 'Durée', prompt_veo3: 'Prompt Veo 3', voix_off: 'Voix off', son: 'Son et ambiance', concept: 'Concept', script: 'Script', scenes: 'Scènes', hashtags: 'Hashtags', niche: 'Niche', idee: 'Idée', audience: 'Audience', exemples: 'Exemples de vidéos', monetisation: 'Monétisation', difficulte: 'Difficulté', format: 'Format', outils: 'Outils conseillés', exemple_titre: 'Exemple de titre', potentiel: 'Potentiel', resume: 'Résumé', twist: 'Twist', pourquoi_viral: 'Pourquoi ça marche', visuel: 'Visuel', narration: 'Narration', plateforme: 'Plateforme', heure: 'Meilleure heure' };
const lab = k => LABELS[k] || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));

/* ---------- Appel IA ---------- */
async function ask(system, user) {
  const key = store.get('key', '');
  if (!key) throw new Error('Ajoute ta clé API dans Mon compte.');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: store.get('model', 'claude-sonnet-5-5'), max_tokens: 4000, system, messages: [{ role: 'user', content: user }] })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error?.message || 'Erreur ' + r.status);
  return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}
function parseJSON(t) {
  const m = t.replace(/```json|```/g, '').trim();
  const a = m.indexOf('['), o = m.indexOf('{');
  const i = a < 0 ? o : o < 0 ? a : Math.min(a, o);
  if (i < 0) throw new Error('Réponse illisible, relance la génération.');
  return JSON.parse(m.slice(i, m.lastIndexOf(m[i] === '[' ? ']' : '}') + 1));
}
async function generate(id, v) {
  const t = TOOLS[id];
  const user = t.fields.map(f => `${f.l} : ${v[f.k] || '(libre)'}`).join('\n');
  return parseJSON(await ask(t.sys + JSON_RULE, user));
}

/* ---------- Rendu ---------- */
function node(v) {
  if (Array.isArray(v)) {
    return v.every(x => typeof x !== 'object') ? `<ul>${v.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : v.map(x => `<article class="card">${node(x)}</article>`).join('');
  }
  if (v && typeof v === 'object') {
    return Object.entries(v).map(([k, x]) => `<div class="f"><span class="k">${esc(lab(k))}</span>${x && typeof x === 'object' ? node(x) : `<p>${esc(x)}</p>`}</div>`).join('');
  }
  return `<p>${esc(v)}</p>`;
}
function toText(v, d = 0) {
  const p = '  '.repeat(d);
  if (Array.isArray(v)) return v.map(x => typeof x === 'object' ? toText(x, d) + '\n' : p + '• ' + x).join('\n');
  if (v && typeof v === 'object') return Object.entries(v).map(([k, x]) => x && typeof x === 'object' ? `${p}${lab(k)} :\n${toText(x, d + 1)}` : `${p}${lab(k)} : ${x}`).join('\n');
  return p + v;
}
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2200); }
async function copy(txt) {
  try { await navigator.clipboard.writeText(txt); } catch { const a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast('Copié');
}
async function share(txt) { if (navigator.share) { try { await navigator.share({ text: txt }); } catch { } } else copy(txt); }
const guessTitle = (d, id) => d?.titre || d?.[0]?.titre || d?.[0]?.niche || TOOLS[id]?.title || 'Sans titre';
const fmtDate = iso => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/* ---------- Données ---------- */
function saveVideo(tool, params, data, prefix = '') {
  const l = store.get('videos', []);
  l.unshift({ id: Date.now() + Math.random(), tool, title: prefix + guessTitle(data, tool), date: new Date().toISOString(), data, params });
  store.set('videos', l.slice(0, 200));
}
async function sendWebhook(tool, params, data) {
  const url = store.get('hook', '');
  if (!url) { toast('Ajoute l’URL du webhook dans Mon compte'); return; }
  try { await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tool, params, data }) }); toast('Envoyé au webhook'); }
  catch { toast('Échec de l’envoi'); }
}

/* ---------- Navigation ---------- */
const GROUPS = [
  { id: 'agents', label: 'Automatisation Agents IA', icon: '🤖', items: ['clipping', 'veo3', 'histoires'] },
  { id: 'oneshot', label: 'Génération vidéo ponctuelle', icon: '🎞', items: ['niches', 'shortniches', 'viral'] }
];
const PAGES = [
  { id: 'social', label: 'Réseaux sociaux', icon: '🔗' },
  { id: 'deployed', label: 'Agents déployés', icon: '🛰' },
  { id: 'videos', label: 'Mes vidéos', icon: '🗂' },
  { id: 'account', label: 'Mon compte', icon: '👤' }
];
let cur = 'clipping'; const openG = { agents: true, oneshot: true };
function drawNav() {
  const item = (id, label, icon, badge) => `<button class="item ${cur === id ? 'on' : ''}" data-go="${id}"><i>${icon}</i>${label}${badge ? `<span class="tag">${badge}</span>` : ''}</button>`;
  $('#nav').innerHTML = GROUPS.map(g => `<div class="grp ${openG[g.id] ? 'open' : ''}"><button class="gh" data-g="${g.id}"><i>${g.icon}</i>${g.label}<span class="chev">›</span></button><div class="sub">${g.items.map(i => item(i, TOOLS[i].title, TOOLS[i].icon, TOOLS[i].badge)).join('')}</div></div>`).join('') +
    '<hr>' + PAGES.map(p => item(p.id, p.label, p.icon)).join('');
}
function go(id, arg) {
  cur = id; document.body.classList.remove('open'); drawNav(); scrollTo(0, 0);
  if (TOOLS[id]) toolView(id, arg); else ({ social: socialView, deployed: deployedView, videos: videosView, account: accountView, detail: detailView }[id])(arg);
}

/* ---------- Vue outil ---------- */
function field(f, val) {
  const id = 'f_' + f.k, lb = `<label for="${id}">${f.l}</label>`;
  if (f.t === 'area') return lb + `<textarea id="${id}" rows="7" placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>`;
  if (f.t === 'sel') return lb + `<select id="${id}">${f.o.map(o => `<option ${o == val ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  return lb + `<input id="${id}" type="${f.t === 'num' ? 'number' : 'text'}" value="${esc(val)}" placeholder="${esc(f.ph || '')}">`;
}
function toolView(id) {
  const t = TOOLS[id], saved = store.get('last_' + id, {});
  $('#view').innerHTML = `<h1>${t.title}</h1><p class="lead">${t.desc}</p>${t.fields.map(f => field(f, saved[f.k] ?? f.d ?? '')).join('')}<button class="btn full" id="run">Générer</button><div id="out"></div>`;
  $('#run').onclick = () => runTool(id);
}
let last = null;
async function runTool(id) {
  const t = TOOLS[id], v = {};
  t.fields.forEach(f => v[f.k] = $('#f_' + f.k).value.trim());
  const miss = t.fields.find(f => f.req && !v[f.k]);
  if (miss) { toast('Remplis : ' + miss.l); return; }
  store.set('last_' + id, v);
  const b = $('#run'), out = $('#out');
  b.disabled = true; b.textContent = 'Génération…'; out.innerHTML = '<p class="loading">L’agent travaille, compte 10 à 40 secondes.</p>';
  try {
    const data = await generate(id, v);
    last = { tool: id, params: v, data };
    out.innerHTML = `<div class="row"><button class="btn sec" data-act="copy">Copier</button><button class="btn sec" data-act="save">Enregistrer</button><button class="btn sec" data-act="hook">Envoyer au webhook</button></div>${node(data)}`;
  } catch (e) { out.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  b.disabled = false; b.textContent = 'Générer à nouveau';
}

/* ---------- Réseaux sociaux ---------- */
let lastSocial = [];
function socialView() {
  const vids = store.get('videos', []);
  $('#view').innerHTML = `<h1>Réseaux sociaux</h1><p class="lead">Légendes et hashtags adaptés à chaque plateforme.</p>
  <label for="s_src">Vidéo enregistrée</label><select id="s_src"><option value="">Aucune (je décris ci-dessous)</option>${vids.map(v => `<option value="${v.id}">${esc(v.title)}</option>`).join('')}</select>
  <label for="s_txt">Description de la vidéo</label><textarea id="s_txt" rows="4"></textarea>
  <label>Plateformes</label><div class="chk">${['TikTok', 'YouTube Shorts', 'Instagram Reels', 'Facebook', 'WhatsApp Status'].map((p, i) => `<label><input type="checkbox" value="${p}" ${i < 3 ? 'checked' : ''}>${p}</label>`).join('')}</div>
  <label for="s_lang">Langue</label><select id="s_lang">${LANG.o.map(o => `<option>${o}</option>`).join('')}</select>
  <button class="btn full" id="s_run">Générer les légendes</button><div id="out"></div>`;
  $('#s_run').onclick = async () => {
    const src = vids.find(v => String(v.id) === $('#s_src').value);
    const desc = ($('#s_txt').value.trim() + '\n' + (src ? toText(src.data).slice(0, 3000) : '')).trim();
    const pf = [...document.querySelectorAll('.chk input:checked')].map(c => c.value);
    if (!desc || !pf.length) { toast('Choisis une vidéo ou décris-la, puis une plateforme'); return; }
    const b = $('#s_run'), out = $('#out'); b.disabled = true; b.textContent = 'Génération…';
    try {
      lastSocial = parseJSON(await ask('Tu es community manager. Pour chaque plateforme demandée, écris une légende adaptée aux usages de la plateforme. Format : tableau d’objets {"plateforme","legende","hashtags":[],"heure"} où "heure" est un créneau de publication conseillé.' + JSON_RULE, `Plateformes : ${pf.join(', ')}\nLangue : ${$('#s_lang').value}\nVidéo :\n${desc}`));
      out.innerHTML = lastSocial.map((s, i) => `<article class="card">${node(s)}<div class="row"><button class="btn sec" data-copy="${i}">Copier</button><button class="btn sec" data-share="${i}">Partager</button></div></article>`).join('');
    } catch (e) { out.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
    b.disabled = false; b.textContent = 'Générer à nouveau';
  };
}

/* ---------- Agents déployés ---------- */
let busy = false;
function deployedView() {
  const ag = store.get('agents', []), dep = Object.entries(TOOLS).filter(([, t]) => t.deploy);
  $('#view').innerHTML = `<h1>Agents déployés</h1><p class="lead">Un agent actif génère du contenu à intervalle régulier et l’ajoute à Mes vidéos. Il tourne quand l’appli est ouverte.</p>
  ${ag.length ? ag.map(a => `<article class="card"><div class="f"><span class="k">${esc(TOOLS[a.tool].title)} · toutes les ${a.every} h</span><p><b>${esc(a.name)}</b></p><p class="meta">${esc(a.theme)}${a.last ? ' · dernier passage ' + fmtDate(a.last) : ''}</p></div><div class="row"><button class="btn sec" data-ag="tog" data-id="${a.id}">${a.active ? 'Mettre en pause' : 'Activer'}</button><button class="btn sec" data-ag="run" data-id="${a.id}">Lancer maintenant</button><button class="btn sec danger" data-ag="del" data-id="${a.id}">Supprimer</button></div></article>`).join('') : '<p class="meta">Aucun agent pour l’instant.</p>'}
  <h2>Nouvel agent</h2>
  <label for="a_name">Nom</label><input id="a_name" placeholder="Histoires du soir">
  <label for="a_tool">Type d’agent</label><select id="a_tool">${dep.map(([k, t]) => `<option value="${k}">${t.title}</option>`).join('')}</select>
  <label for="a_theme">Thème de départ (sujet, pays ou domaine)</label><input id="a_theme" placeholder="Légendes africaines">
  <label for="a_every">Fréquence</label><select id="a_every"><option value="6">Toutes les 6 h</option><option value="12">Toutes les 12 h</option><option value="24" selected>Toutes les 24 h</option></select>
  <button class="btn full" id="a_add">Déployer l’agent</button>`;
  $('#a_add').onclick = () => {
    const name = $('#a_name').value.trim(), theme = $('#a_theme').value.trim();
    if (!name || !theme) { toast('Remplis le nom et le thème'); return; }
    ag.push({ id: Date.now(), name, tool: $('#a_tool').value, theme, every: +$('#a_every').value, active: true, last: 0 });
    store.set('agents', ag); deployedView(); runDue();
  };
}
async function runAgent(a) {
  const t = TOOLS[a.tool], v = {};
  t.fields.forEach(f => v[f.k] = f.d ?? '');
  v[t.fields[0].k] = a.theme;
  const data = await generate(a.tool, v);
  saveVideo(a.tool, v, data, a.name + ' · ');
  const l = store.get('agents', []), x = l.find(z => z.id === a.id); if (x) { x.last = Date.now(); store.set('agents', l); }
}
async function runDue() {
  if (busy) return; busy = true;
  try {
    for (const a of store.get('agents', [])) {
      if (a.active && Date.now() - a.last >= a.every * 3600e3) { try { await runAgent(a); toast(a.name + ' : nouveau contenu'); } catch { } }
    }
  } finally { busy = false; }
  if (cur === 'deployed') deployedView();
}

/* ---------- Mes vidéos ---------- */
function videosView() {
  const l = store.get('videos', []);
  $('#view').innerHTML = `<h1>Mes vidéos</h1><p class="lead">Tout ce que tu as enregistré ou que tes agents ont produit.</p>` +
    (l.length ? l.map(v => `<article class="card click" data-open="${v.id}"><span class="pill">${esc(TOOLS[v.tool]?.title || v.tool)}</span><p style="margin:6px 0 0"><b>${esc(v.title)}</b></p><p class="meta" style="margin:0">${fmtDate(v.date)}</p></article>`).join('') : '<p class="meta">Rien d’enregistré. Génère un contenu puis touche Enregistrer.</p>');
}
function detailView(id) {
  const v = store.get('videos', []).find(x => String(x.id) === String(id)); if (!v) return go('videos');
  last = { tool: v.tool, params: v.params, data: v.data };
  $('#view').innerHTML = `<h1>${esc(v.title)}</h1><p class="meta">${esc(TOOLS[v.tool]?.title || '')} · ${fmtDate(v.date)}</p><div class="row"><button class="btn sec" data-act="copy">Copier</button><button class="btn sec" data-act="share">Partager</button><button class="btn sec" data-act="hook">Webhook</button><button class="btn sec danger" data-del="${v.id}">Supprimer</button></div>${node(v.data)}`;
}

/* ---------- Compte ---------- */
function accountView() {
  $('#view').innerHTML = `<h1>Mon compte</h1><p class="lead">Les réglages restent sur ce téléphone.</p>
  <label for="c_name">Ton prénom</label><input id="c_name" value="${esc(store.get('name', ''))}">
  <label for="c_key">Clé API Anthropic</label><input id="c_key" type="password" autocomplete="off" value="${esc(store.get('key', ''))}" placeholder="sk-ant-…">
  <label for="c_model">Modèle</label><input id="c_model" value="${esc(store.get('model', 'claude-sonnet-5-5'))}">
  <label for="c_hook">Webhook Make.com (optionnel)</label><input id="c_hook" type="url" value="${esc(store.get('hook', ''))}" placeholder="https://hook.eu2.make.com/…">
  <button class="btn full" id="c_save">Enregistrer</button>
  <h2>Données</h2><div class="row"><button class="btn sec" id="c_exp">Copier une sauvegarde</button><button class="btn sec danger" id="c_rst">Tout effacer</button></div>`;
  $('#c_save').onclick = () => { store.set('name', $('#c_name').value.trim()); store.set('key', $('#c_key').value.trim()); store.set('model', $('#c_model').value.trim() || 'claude-sonnet-5-5'); store.set('hook', $('#c_hook').value.trim()); avatar(); toast('Enregistré'); };
  $('#c_exp').onclick = () => copy(JSON.stringify({ videos: store.get('videos', []), agents: store.get('agents', []) }));
  $('#c_rst').onclick = () => { if (confirm('Effacer toutes les données de l’appli ?')) { Object.keys(localStorage).filter(k => k.startsWith('cf_')).forEach(k => localStorage.removeItem(k)); avatar(); accountView(); } };
}
const avatar = () => { $('#accBtn').textContent = (store.get('name', 'A')[0] || 'A').toUpperCase(); };

/* ---------- Événements ---------- */
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  let el;
  if (q('#menuBtn')) document.body.classList.add('open');
  else if (q('#scrim')) document.body.classList.remove('open');
  else if (q('#accBtn')) go('account');
  else if ((el = q('[data-g]'))) { openG[el.dataset.g] = !openG[el.dataset.g]; drawNav(); }
  else if ((el = q('[data-go]'))) go(el.dataset.go);
  else if ((el = q('[data-open]'))) go('detail', el.dataset.open);
  else if ((el = q('[data-act]'))) {
    const a = el.dataset.act;
    if (!last) return;
    if (a === 'copy') copy(toText(last.data));
    if (a === 'share') share(toText(last.data));
    if (a === 'hook') sendWebhook(last.tool, last.params, last.data);
    if (a === 'save') { saveVideo(last.tool, last.params, last.data); toast('Enregistré dans Mes vidéos'); }
  }
  else if ((el = q('[data-copy]'))) copy(toText(lastSocial[el.dataset.copy]));
  else if ((el = q('[data-share]'))) share(toText(lastSocial[el.dataset.share]));
  else if ((el = q('[data-del]'))) { if (confirm('Supprimer cette vidéo ?')) { store.set('videos', store.get('videos', []).filter(v => String(v.id) !== el.dataset.del)); go('videos'); } }
  else if ((el = q('[data-ag]'))) {
    const l = store.get('agents', []), a = l.find(x => String(x.id) === el.dataset.id); if (!a) return;
    const act = el.dataset.ag;
    if (act === 'tog') { a.active = !a.active; store.set('agents', l); deployedView(); }
    if (act === 'del') { store.set('agents', l.filter(x => x !== a)); deployedView(); }
    if (act === 'run') { el.disabled = true; el.textContent = 'En cours…'; runAgent(a).then(() => { toast('Contenu ajouté à Mes vidéos'); deployedView(); }).catch(err => { toast(err.message); deployedView(); }); }
  }
});

avatar(); go('clipping'); setTimeout(runDue, 2000); setInterval(runDue, 60000);
