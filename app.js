// ─── Datos del flujo ────────────────────────────────────
const SITUACIONES = [
  { id: 'sin_asignar',   label: 'No tengo nada asignado' },
  { id: 'no_se_cual',    label: 'Tengo cosas, pero no sé cuál agarrar' },
  { id: 'esperando',     label: 'Estoy esperando a alguien' },
  { id: 'idea_suelta',   label: 'Tengo una idea suelta' },
  { id: 'aportar_valor', label: 'Quiero aportar valor, pero no sé desde dónde' },
  { id: 'poca_energia',  label: 'Estoy con poca energía' },
  { id: 'trabado',       label: 'No sé, estoy trabado' }
];

const SECONDARY = {
  sin_asignar:   { pregunta: '¿Qué tipo de cosa te serviría hacer?', opciones: ['Algo rápido', 'Algo útil para el equipo', 'Algo para mejorar calidad', 'Algo exploratorio', 'Algo estratégico', 'Sorprendeme'] },
  no_se_cual:    { pregunta: '¿Qué te cuesta decidir?', opciones: ['No sé qué tiene más impacto', 'No sé qué es más urgente', 'No sé qué depende de otros', 'Todo parece medio chico', 'Todo parece demasiado grande', 'No tengo criterio claro'] },
  esperando:     { pregunta: '¿Qué estás esperando?', opciones: ['Una decisión', 'Feedback', 'Información', 'Validación técnica', 'Respuesta del cliente/equipo', 'No estoy seguro'] },
  idea_suelta:   { pregunta: '¿Qué forma tiene esa idea?', opciones: ['Es un problema que vi', 'Es una mejora posible', 'Es una duda', 'Es algo que se repite', 'Es una oportunidad', 'No sé cómo clasificarla'] },
  aportar_valor: { pregunta: '¿Qué tipo de valor querés generar?', opciones: ['Claridad', 'Evidencia', 'Calidad', 'Velocidad', 'Alineación', 'Aprendizaje'] },
  poca_energia:  { pregunta: '¿Qué nivel de esfuerzo te da?', opciones: ['15 minutos', '30 minutos', 'Algo mecánico', 'Algo liviano pero útil', 'Algo sin mucha decisión', 'Solo ordenar algo'] },
  trabado:       { pregunta: '¿Qué frase se parece más a lo que te pasa?', opciones: ['No sé por dónde empezar', 'No sé qué importa', 'Estoy esperando algo', 'Tengo muchas cosas mezcladas', 'Tengo una idea pero no sé qué hacer con ella', 'No tengo energía', 'Ninguna, sorprendeme'] }
};

const OUTPUT_TYPES = [
  { id: 'nota',      label: 'Una nota' },
  { id: 'mensaje',   label: 'Un mensaje de Slack' },
  { id: 'checklist', label: 'Una checklist' },
  { id: 'tarea',     label: 'Una tarea' },
  { id: 'propuesta', label: 'Una propuesta' },
  { id: 'preguntas', label: 'Preguntas para destrabar' },
  { id: 'sorpresa',  label: 'No sé, elegí vos' }
];

const BADGE_CLASS = {
  'Acción rápida':      'rapida',
  'Útil para el equipo':'equipo',
  'Estratégica':        'estrategica'
};

const MICRO_ICON = {
  chica:       `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9"/></svg>`,
  estrategica: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,11 5,6 8,8 13,2"/><polyline points="10,2 13,2 13,5"/></svg>`,
  otra:        `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4h8"/><path d="M7 2l3 2-3 2"/><path d="M1 10h8"/><path d="M7 8l3 2-3 2"/></svg>`
};

const STEPS = [
  { n: 1, title: '¿Qué te pasa?',  hint: 'Tu situación' },
  { n: 2, title: 'El detalle',     hint: 'Acotamos un poco' },
  { n: 3, title: 'Qué producir',   hint: 'El formato final' },
  { n: 4, title: 'Los caminos',    hint: '3 propuestas' },
  { n: 5, title: 'Tu acción',      hint: 'Listo para usar' }
];

// ─── Estado ─────────────────────────────────────────────
let state = freshState();

function freshState() {
  return {
    step: 1,
    situacion: null,
    textoLibre: '',
    detalle: null,
    outputType: null,
    aiResult: null,
    cardSeleccionada: null,
    outputFinal: null,
    loadingCards: new Set()
  };
}

// ─── DOM refs ────────────────────────────────────────────
const $main    = document.getElementById('main');
const $footer  = document.getElementById('footer');
const $sidebar = document.getElementById('sidebar');

// ─── Helpers ─────────────────────────────────────────────
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderMarkdown(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^- \[ \] (.+)$/gm, '<label class="md-check"><input type="checkbox" disabled> <span>$1</span></label>')
    .replace(/^- \[x\] (.+)$/gim, '<label class="md-check checked"><input type="checkbox" checked disabled> <span>$1</span></label>')
    .replace(/^- (.+)$/gm, '<span class="md-li">· $1</span>')
    .replace(/^\d+\. (.+)$/gm, '<span class="md-li md-li-num">$1</span>')
    .replace(/\n\n/g, '<div class="md-gap"></div>')
    .replace(/\n/g, '<br>');
}

// Valor seleccionado en cada paso, para mostrar bajo el título en el sidebar
function stepValue(n) {
  switch (n) {
    case 1: { const s = SITUACIONES.find(x => x.id === state.situacion); return s ? s.label : ''; }
    case 2: return state.detalle || '';
    case 3: { const o = OUTPUT_TYPES.find(x => x.id === state.outputType); return o ? o.label : ''; }
    case 4: return state.aiResult ? '3 caminos listos' : '';
    case 5: return state.cardSeleccionada ? state.cardSeleccionada.titulo : '';
    default: return '';
  }
}

// ¿Se puede saltar a este paso? (requiere que lo previo esté completo)
function stepReachable(n) {
  switch (n) {
    case 1: return true;
    case 2: return !!state.situacion;
    case 3: return !!state.detalle;
    case 4: return !!state.outputType;
    case 5: return !!state.cardSeleccionada;
    default: return false;
  }
}

async function goToStep(n) {
  if (n === state.step || !stepReachable(n)) return;
  state.step = n;
  render();
  if (n === 4 && !state.aiResult) await loadCards();
  if (n === 5 && !state.outputFinal) await loadOutput();
}

function renderSidebar() {
  $sidebar.innerHTML = `
    <div class="sidebar-brand">
      <span class="logo">TaskRadar</span>
      <span class="sidebar-tagline">No tengo tareas</span>
    </div>
    <nav class="sidebar-nav">
      ${STEPS.map(s => {
        const reachable = stepReachable(s.n);
        const isActive  = s.n === state.step;
        const isDone     = s.n < state.step && reachable;
        const val        = stepValue(s.n);
        const cls = ['nav-step',
          isActive ? 'active' : '',
          isDone ? 'done' : '',
          !reachable ? 'locked' : ''
        ].filter(Boolean).join(' ');
        return `
          <button class="${cls}" data-step="${s.n}" ${!reachable ? 'disabled' : ''}>
            <span class="nav-marker">${isDone ? '✓' : s.n}</span>
            <span class="nav-text">
              <span class="nav-title">${esc(s.title)}</span>
              <span class="nav-sub">${esc(val || s.hint)}</span>
            </span>
          </button>`;
      }).join('')}
    </nav>
    <button class="sidebar-reset" id="btnSidebarReset">↺ Empezar de nuevo</button>`;

  $sidebar.querySelectorAll('.nav-step').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.step)));
  });
  document.getElementById('btnSidebarReset').addEventListener('click', () => {
    state = freshState();
    render();
  });
}

// ─── Render principal ────────────────────────────────────
function render() {
  renderSidebar();
  switch (state.step) {
    case 1: renderStep1(); break;
    case 2: renderStep2(); break;
    case 3: renderStep3(); break;
    case 4: renderStep4(); break;
    case 5: renderStep5(); break;
  }
}

// ─── Paso 1: ¿Qué te está pasando? ──────────────────────
function renderStep1() {
  $main.innerHTML = `
    <div class="step-header">
      <div class="step-title">¿Qué te está pasando realmente?</div>
      <div class="step-subtitle">Te ayudo a encontrar algo útil para hacer ahora.</div>
    </div>
    <div class="option-list">
      ${SITUACIONES.map(s => `
        <div class="option-card ${state.situacion === s.id ? 'selected' : ''}" data-id="${s.id}">
          ${esc(s.label)}
        </div>`).join('')}
    </div>
    <div style="margin-top:20px">
      <textarea id="textoLibre" placeholder="Contame en una frase, si querés." rows="2">${esc(state.textoLibre)}</textarea>
    </div>`;

  const puedeAvanzar = !!state.situacion || state.textoLibre.trim().length > 2;

  $footer.innerHTML = `
    <div class="footer-inner">
      <button class="btn btn-primary" id="btnNext" ${!puedeAvanzar ? 'disabled' : ''}>Continuar →</button>
    </div>`;

  $main.querySelectorAll('.option-card').forEach(el => {
    el.addEventListener('click', () => {
      if (state.situacion !== el.dataset.id) {
        state.situacion = el.dataset.id;
        state.detalle = null; state.outputType = null;
        state.aiResult = null; state.cardSeleccionada = null; state.outputFinal = null;
      }
      renderStep1();
    });
  });

  document.getElementById('textoLibre').addEventListener('input', e => {
    state.textoLibre = e.target.value;
    const canGo = !!state.situacion || state.textoLibre.trim().length > 2;
    document.getElementById('btnNext').disabled = !canGo;
  });
  document.getElementById('btnNext').addEventListener('click', () => {
    if (!state.situacion && state.textoLibre.trim().length > 2) {
      state.situacion = 'trabado';
    }
    if (state.situacion) { state.step = 2; render(); }
  });
}

// ─── Paso 2: Pregunta contextual ─────────────────────────
function renderStep2() {
  const q = SECONDARY[state.situacion];
  if (!q) { state.step = 1; render(); return; }

  $main.innerHTML = `
    <div class="step-header">
      <div class="step-title">${esc(q.pregunta)}</div>
    </div>
    <div class="option-list">
      ${q.opciones.map(op => `
        <div class="option-card ${state.detalle === op ? 'selected' : ''}" data-val="${esc(op)}">
          ${esc(op)}
        </div>`).join('')}
    </div>`;

  $footer.innerHTML = `
    <div class="footer-inner">
      <button class="btn btn-ghost" id="btnBack">← Atrás</button>
      <button class="btn btn-primary" id="btnNext" ${!state.detalle ? 'disabled' : ''}>Continuar →</button>
    </div>`;

  $main.querySelectorAll('.option-card').forEach(el => {
    el.addEventListener('click', () => {
      state.detalle = el.dataset.val;
      state.outputType = null; state.aiResult = null;
      state.cardSeleccionada = null; state.outputFinal = null;
      renderStep2();
    });
  });

  document.getElementById('btnBack').addEventListener('click', () => { state.step = 1; render(); });
  document.getElementById('btnNext').addEventListener('click', () => { if (state.detalle) { state.step = 3; render(); } });
}

// ─── Paso 3: ¿Qué querés producir? ──────────────────────
function renderStep3() {
  $main.innerHTML = `
    <div class="step-header">
      <div class="step-title">¿Qué querés producir al final?</div>
    </div>
    <div class="option-list">
      ${OUTPUT_TYPES.map(o => `
        <div class="option-card ${state.outputType === o.id ? 'selected' : ''}" data-id="${o.id}">
          ${esc(o.label)}
        </div>`).join('')}
    </div>`;

  $footer.innerHTML = `
    <div class="footer-inner">
      <button class="btn btn-ghost" id="btnBack">← Atrás</button>
      <button class="btn btn-primary" id="btnNext" ${!state.outputType ? 'disabled' : ''}>Ver caminos →</button>
    </div>`;

  $main.querySelectorAll('.option-card').forEach(el => {
    el.addEventListener('click', () => {
      state.outputType = el.dataset.id;
      state.aiResult = null; state.cardSeleccionada = null; state.outputFinal = null;
      renderStep3();
    });
  });

  document.getElementById('btnBack').addEventListener('click', () => { state.step = 2; render(); });
  document.getElementById('btnNext').addEventListener('click', async () => {
    if (!state.outputType) return;
    state.step = 4;
    render();
    await loadCards();
  });
}

// ─── Paso 4: Cards de IA ─────────────────────────────────
function renderStep4() {
  if (!state.aiResult) {
    $main.innerHTML = `
      <div class="loading-state">
        <div class="spinner" style="width:36px;height:36px;border-width:3px"></div>
        <div class="loading-title">Analizando tu situación...</div>
        <div class="loading-subtitle">Un segundo mientras armo los caminos.</div>
      </div>`;
    $footer.innerHTML = `<div class="footer-inner"><button class="btn btn-ghost" id="btnBack">← Atrás</button></div>`;
    document.getElementById('btnBack').addEventListener('click', () => { state.step = 3; render(); });
    return;
  }

  const { diagnostico, cards } = state.aiResult;

  function buildCardHtml(card, i) {
    const badge = BADGE_CLASS[card.tipo] || 'rapida';
    if (state.loadingCards.has(i)) {
      return `
        <div class="action-card action-card-loading">
          <div class="card-loading-inner">
            <div class="spinner"></div>
            <span>Generando...</span>
          </div>
        </div>`;
    }
    return `
      <div class="action-card" data-index="${i}">
        <div class="card-header-row">
          <span class="card-badge card-badge-${badge}">${esc(card.tipo)}</span>
          <span class="card-time">${esc(card.tiempo)}</span>
        </div>
        <div class="card-title">${esc(card.titulo)}</div>
        <div class="card-bloqueo">Resuelve: ${esc(card.bloqueo)}</div>
        <div class="card-porque">"${esc(card.porque)}"</div>
        <div class="card-primer-paso-box">
          <div class="card-primer-paso-label">Primer paso concreto</div>
          <div class="card-primer-paso-text">${esc(card.primerPaso)}</div>
        </div>
        <div class="card-entregable">
          <span class="card-entregable-label">Entregable:</span> ${esc(card.outputEsperado)}
        </div>
        <div class="card-micro-actions">
          <button class="card-micro-btn btn-refine" data-index="${i}" data-tipo="chica">
            <span class="micro-icon">${MICRO_ICON.chica}</span> Más chica
          </button>
          <button class="card-micro-btn btn-refine" data-index="${i}" data-tipo="estrategica">
            <span class="micro-icon">${MICRO_ICON.estrategica}</span> Estratégica
          </button>
          <button class="card-micro-btn btn-refine" data-index="${i}" data-tipo="otra">
            <span class="micro-icon">${MICRO_ICON.otra}</span> Otra
          </button>
        </div>
        <button class="btn-elegir-camino" data-index="${i}">Elegir camino</button>
      </div>`;
  }

  $main.innerHTML = `
    <div class="step-header">
      <div class="step-title">Te propongo 3 caminos</div>
    </div>
    <div class="diagnostico-box">${esc(diagnostico)}</div>
    <div class="cards-grid" id="cardsGrid">
      ${cards.map((card, i) => buildCardHtml(card, i)).join('')}
    </div>`;

  $footer.innerHTML = `<div class="footer-inner"><button class="btn btn-ghost" id="btnBack">← Atrás</button></div>`;

  document.getElementById('btnBack').addEventListener('click', () => { state.step = 3; render(); });

  $main.querySelectorAll('.btn-elegir-camino').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.cardSeleccionada = cards[parseInt(btn.dataset.index)];
      state.outputFinal = null;
      state.step = 5;
      render();
      await loadOutput();
    });
  });

  $main.querySelectorAll('.btn-refine').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.index);
      const tipo = btn.dataset.tipo;
      state.loadingCards.add(i);
      document.getElementById('cardsGrid').innerHTML = cards.map((c, idx) => buildCardHtml(c, idx)).join('');
      try {
        const newCard = await refineCard(cards[i], tipo, state);
        state.aiResult.cards[i] = newCard;
      } catch {
        // keep original on error
      }
      state.loadingCards.delete(i);
      renderStep4();
    });
  });
}

// ─── Paso 5: Output final ────────────────────────────────
function renderStep5() {
  const card = state.cardSeleccionada;
  const badge = BADGE_CLASS[card?.tipo] || 'rapida';

  $main.innerHTML = `
    <div class="step-header">
      <div class="step-title">Tu próxima acción</div>
    </div>
    <div class="chosen-card-ref">
      <span class="card-badge card-badge-${badge}">${esc(card?.tipo || '')}</span>
      <span class="chosen-card-name">${esc(card?.titulo || '')}</span>
    </div>
    <div class="output-box" id="outputBox">
      ${state.outputFinal
        ? `<div class="output-text">${renderMarkdown(state.outputFinal)}</div>`
        : `<div class="ai-loading"><div class="spinner"></div> Generando...</div>`}
    </div>
    ${state.outputFinal ? `
      <div class="refine-section">
        <div class="refine-groups">
          <div class="refine-group">
            <span class="refine-label">Ajustar</span>
            <div class="refine-btns">
              <button class="btn btn-ghost btn-sm" data-refine="Hacelo más corto, mantené lo esencial">Más corto</button>
              <button class="btn btn-ghost btn-sm" data-refine="Hacelo más informal y directo, tono rioplatense">Más informal</button>
              <button class="btn btn-ghost btn-sm" data-refine="Hacelo más claro y estructurado">Más claro</button>
            </div>
          </div>
          <div class="refine-group">
            <span class="refine-label">Convertir a</span>
            <div class="refine-btns">
              <button class="btn btn-ghost btn-sm" data-refine="Convertilo en una checklist con ítems accionables usando formato '- [ ] ítem'">Checklist</button>
              <button class="btn btn-ghost btn-sm" data-refine="Convertilo en una tarea con título, descripción breve y primer paso">Tarea</button>
            </div>
          </div>
        </div>
        <button class="btn-regenerar" id="btnRegenerar">↺ Regenerar</button>
      </div>` : ''}`;

  $footer.innerHTML = `
    <div class="footer-inner">
      <button class="btn btn-ghost" id="btnVolver">← Volver a caminos</button>
      ${state.outputFinal ? `<button class="btn btn-primary" id="btnCopiar">Copiar</button>` : ''}
      <button class="btn btn-ghost" id="btnReset">Empezar de nuevo</button>
    </div>`;

  document.getElementById('btnVolver').addEventListener('click', () => { state.step = 4; render(); });
  document.getElementById('btnReset').addEventListener('click', () => { state = freshState(); render(); });

  if (state.outputFinal) {
    document.getElementById('btnCopiar').addEventListener('click', () => {
      navigator.clipboard.writeText(state.outputFinal).then(() => {
        const btn = document.getElementById('btnCopiar');
        const orig = btn.textContent;
        btn.textContent = '¡Copiado!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      });
    });

    $main.querySelectorAll('[data-refine]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const instruction = btn.dataset.refine;
        const prev = state.outputFinal;
        state.outputFinal = null;
        renderStep5();
        try {
          state.outputFinal = await refineOutput(prev, instruction);
        } catch {
          state.outputFinal = prev;
        }
        renderStep5();
      });
    });

    document.getElementById('btnRegenerar')?.addEventListener('click', async () => {
      state.outputFinal = null;
      renderStep5();
      await loadOutput();
    });
  }
}

// ─── Loaders IA ──────────────────────────────────────────
async function loadCards() {
  try {
    state.aiResult = await generateCards(state);
  } catch (e) {
    state.aiResult = {
      diagnostico: 'No pudimos conectar con la IA. Verificá tu conexión e intentá de nuevo.',
      bloqueo: 'desconocido',
      cards: [
        { titulo: 'Error de conexión', tipo: 'Acción rápida',       bloqueo: '-', porque: 'Revisá la conexión', tiempo: '-', primerPaso: 'Recargá la página e intentá de nuevo', outputEsperado: '-' },
        { titulo: 'Error de conexión', tipo: 'Útil para el equipo', bloqueo: '-', porque: '-',                  tiempo: '-', primerPaso: '-',                                     outputEsperado: '-' },
        { titulo: 'Error de conexión', tipo: 'Estratégica',         bloqueo: '-', porque: '-',                  tiempo: '-', primerPaso: '-',                                     outputEsperado: '-' }
      ]
    };
  }
  render();
}

async function loadOutput() {
  try {
    state.outputFinal = await generateOutput(state.cardSeleccionada, state.outputType, state);
  } catch {
    state.outputFinal = 'No pudimos generar el output. Verificá tu conexión e intentá de nuevo.';
  }
  renderStep5();
}

// ─── Init ────────────────────────────────────────────────
render();
