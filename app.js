/* ─── Estado global ─────────────────────────────────────── */
const state = {
  step: 0,
  projects: [],
  bp: null,
  bpTipo: null,
  bpOtro: '',
  ticketSeleccionado: null,
  emp: null,
  empTipo: null,
  empOtro: '',
  ev: null,
  evTipo: null,
  dir: null,
  dirMetodo: null,
  dirArea: '',
  dirAlineacion: null,
  dirContexto: '',
  hallazgo: '',
  out: null,
  outDraft: '',
  notas: '',
  lastBeforeDone: 1,
  _notionTickets: null,
  _notionError: false,
  _nextStep: null,
  _nextStepLoading: false,
  _userStory: null,
  _userStoryLoading: false
};

/* ─── Datos ─────────────────────────────────────────────── */
const PROJECTS = ['SmartBorder', 'SmartSense', 'SS-Jolt', 'KZ Site', 'Sales & Marketing', 'Design Team', 'Inpersuit', 'Semaforo', 'Learning'];

const CHIPS_A = ['Comentario sin reply', 'Algo bloqueado', 'Trabajo viejo sin cerrar', 'Propuesta a medias', 'Flow pendiente de QA', 'Idea en la bolsa', 'Otro'];

const CHIPS_B1 = ['Flujo viejo', 'Feedback sin refinar', 'Deuda de UX', 'Heurístico abierto', 'UI QA sin tickets', 'Otro'];

const CHIPS_B2 = ['Sesiones Clarity', 'Tickets de soporte', 'Entrevistas grabadas', 'Benchmark', 'Analytics / GA', 'Heurístico previo'];

const CHIPS_PROB = ['UX QA heurístico', 'Recorrido sintético', 'Sesiones Clarity', 'Tickets de soporte', 'Brainstorm con el equipo', 'Benchmark'];

const CHIPS_MEJ = ['Micro UX', 'Rediseño de flujo', 'Arquitectura de información', 'Microcopy', 'Accesibilidad', 'Proceso / handoff'];

const CHIPS_ALIN = ['Equipo', 'Stakeholders', 'Negocio'];

const OUTPUT_TYPES = [
  { key: 'ref', label: 'Refinement', desc: 'Nota para discutir con el equipo' },
  { key: 'hip', label: 'Hipótesis', desc: 'Formal, con dato y métrica' },
  { key: 'us', label: 'User story / Bug', desc: 'Listo para estimar' },
  { key: 'prop', label: 'Propuesta', desc: 'Solución concreta a discutir' }
];

const RECS = {
  A: {
    'Comentario sin reply': ['Respondé ahora: un "visto, lo tomo" alcanza para desbloquearlo', 'Si requiere acción, convertilo en ticket con descripción y responsable', 'Si ya no es relevante, cerralo con una nota del motivo'],
    'Algo bloqueado': ['Identificá exactamente qué o quién lo bloquea', 'Si depende de otra persona, escribí un mensaje claro con la acción que necesitás', 'Si depende de una decisión, llevalo al próximo sync como punto de agenda'],
    'Trabajo viejo sin cerrar': ['Revisá si sigue siendo relevante o fue superado', 'Si sigue vigente, definí el próximo paso concreto y quién lo toma', 'Si ya no aplica, cerralo con una nota del motivo'],
    'Propuesta a medias': ['Revisá en qué punto quedó: ¿falta definición, validación o aprobación?', 'Si falta evidencia, identificá el dato mínimo para avanzar', 'Si falta alineación, agendá una conversación corta con el stakeholder clave'],
    'Flow pendiente de QA': ['Recorrelo como usuario final, sin shortcuts', 'Usá las 10 heurísticas de Nielsen como checklist', 'Documentá cada hallazgo: qué es, dónde ocurre, severidad alta/media/baja'],
    'Idea en la bolsa': ['Evaluá si sigue siendo relevante con el contexto actual', 'Si tiene potencial, escribí una hipótesis mínima antes de pasarla al equipo', 'Si no tiene evidencia, archivala con una nota para el próximo ciclo']
  },
  B1: {
    'Flujo viejo': ['Verificá si el flujo sigue vigente en producción', 'Comparalo con el estado actual para detectar desvíos', 'Documentá las diferencias como bugs o deuda de UX'],
    'Feedback sin refinar': ['Agrupá los ítems por tema', 'Priorizá por frecuencia e impacto percibido', 'Convertí los top ítems en hipótesis accionables'],
    'Deuda de UX': ['Describí el problema actual y el estado ideal', 'Estimá el esfuerzo para que el equipo pueda priorizarlo', 'Alineá con el PM si requiere sprint propio'],
    'Heurístico abierto': ['Filtrá los hallazgos que siguen siendo válidos', 'Cerrá los resueltos con una nota', 'Convertí los de mayor severidad en tickets'],
    'UI QA sin tickets': ['Priorizá por severidad: errores críticos primero', 'Un ticket por hallazgo', 'Incluí screenshot y comportamiento esperado vs. actual']
  },
  B2: {
    'Sesiones Clarity': ['Filtrá por el flujo más crítico', 'Revisá al menos 5 sesiones antes de sacar conclusiones', 'Anotá los momentos de fricción: hesitación, scroll errático'],
    'Tickets de soporte': ['Agrupá por tema o área del producto', 'El grupo más frecuente es tu hallazgo accionable', 'Cruzá con GA para confirmar el patrón'],
    'Entrevistas grabadas': ['Buscá los momentos donde el usuario expresa frustración', 'Anotá citas textuales: son tu evidencia más fuerte', 'Verificá si algún insight quedó sin acción'],
    'Benchmark': ['Elegí 3–5 competidores relevantes para el flujo', 'Documentá cada diferenciador con screenshot', 'Identificá las brechas más grandes y priorizalas por impacto'],
    'Analytics / GA': ['Definí primero qué pregunta querés responder', 'Buscá caídas en el funnel o páginas con alta tasa de rebote', 'Cruzá con el período post-lanzamiento de algún cambio'],
    'Heurístico previo': ['Verificá qué ítems fueron resueltos', 'Priorizá los de mayor severidad', 'Si el producto cambió mucho, considerá uno nuevo desde cero']
  },
  out: {
    'ref': ['Sé concreto: ¿qué observaste y dónde?', 'Indicá la acción esperada: ¿discutir, ticketear o descartar?', 'Agregá el contexto mínimo para que el equipo lo entienda sin vos'],
    'hip': ['Creemos que [cambio] para [segmento] logrará [resultado]', 'Porque [evidencia disponible]', 'Lo mediremos con [métrica concreta] en [plazo]'],
    'us': ['Como [tipo de usuario], quiero [acción], para [beneficio]', 'Incluí criterios de aceptación medibles', 'Estimá la complejidad con tech antes de agregar al sprint'],
    'prop': ['Problema detectado con evidencia', 'Solución propuesta y alternativas consideradas', 'Riesgos y próximos pasos: pilot, baja inversión, etc.']
  }
};

const OUTPUT_TEMPLATES = {
  ref: '¿Qué observé?\n\n\n¿Qué propongo discutir?\n\n\n¿Quién debería estar en la conversación?\n',
  hip: 'Creemos que [acción/cambio] para [segmento] logrará [resultado esperado],\nporque [evidencia]. Lo mediremos con [métrica] en [plazo].',
  us: 'Como [tipo de usuario], quiero [acción],\npara [beneficio].\n\nCriterios de aceptación:\n- \n- ',
  prop: 'Problema detectado:\n\n\nSolución propuesta:\n\n\nAlternativas consideradas:\n\n\nRiesgos:\n\n\nPróximos pasos:\n'
};

const CAMINO_LABELS = {
  A: 'Backlog — pendiente encontrado',
  B: 'Backlog — ticket seleccionado',
  C: 'Trabajo previo',
  D: 'Evidencia disponible',
  E: 'Sin insumos — dirección generada'
};

/* ─── Utilidades de renderizado ─────────────────────────── */
const $ = id => document.getElementById(id);
const main = () => $('main');

function isEarlyExit() {
  return (
    state.bp === 'si' ||
    (state.bp === 'no' && state.ticketSeleccionado !== null) ||
    state.emp === 'si' ||
    state.ev === 'si'
  );
}

function earlyReady() {
  if (state.ticketSeleccionado !== null) return true;
  if (state.bp === 'si') {
    if (!state.bpTipo) return false;
    if (state.bpTipo === 'Otro') return state.bpOtro.trim().length >= 10;
    return true;
  }
  if (state.emp === 'si') {
    if (!state.empTipo) return false;
    if (state.empTipo === 'Otro') return state.empOtro.trim().length >= 10;
    return true;
  }
  if (state.ev === 'si') return !!state.evTipo;
  return false;
}

function detectCamino() {
  if (state.bp === 'si') return 'A';
  if (state.bp === 'no' && state.ticketSeleccionado) return 'B';
  if (state.emp === 'si') return 'C';
  if (state.ev === 'si') return 'D';
  return 'E';
}

function updateFooter() {
  const btnNext = $('btnNext');
  const btnBack = $('btnBack');

  btnBack.style.display = state.step > 0 && state.step < 4 ? 'inline-flex' : 'none';

  if (state.step === 4) {
    btnNext.style.display = 'none';
    return;
  }

  btnNext.style.display = 'inline-flex';

  if (state.step === 0) {
    btnNext.textContent = 'Continuar →';
    btnNext.disabled = state.projects.length === 0;
  } else if (state.step === 1) {
    if (isEarlyExit() && earlyReady()) {
      btnNext.textContent = 'Finalizar →';
      btnNext.disabled = false;
    } else if (state.ev === 'no') {
      btnNext.textContent = 'Ir a Dirección →';
      btnNext.disabled = false;
    } else {
      btnNext.textContent = 'Continuar →';
      btnNext.disabled = true;
    }
  } else if (state.step === 2) {
    btnNext.textContent = 'Continuar →';
    btnNext.disabled = !state.dir || !state.dirMetodo;
  } else if (state.step === 3) {
    btnNext.textContent = 'Finalizar →';
    btnNext.disabled = !state.out;
  }
}

function updateStepDots() {
  const indicator = $('stepIndicator');
  const totalSteps = 4;
  indicator.innerHTML = '';
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement('div');
    dot.className = 'step-dot' + (i < state.step ? ' done' : i === state.step ? ' active' : '');
    indicator.appendChild(dot);
  }
}

/* ─── Componentes reutilizables ─────────────────────────── */
function renderChips(chips, selected, onSelect, extraClass = '') {
  return `<div class="chips ${extraClass}">${chips.map(c =>
    `<div class="chip${selected === c ? ' selected' : ''}" data-chip="${escHtml(c)}">${escHtml(c)}</div>`
  ).join('')}</div>`;
}

function renderRecs(recs) {
  if (!recs || !recs.length) return '';
  return `<div class="recs-box fade-in">
    <div class="recs-box-title">Por dónde arrancar</div>
    ${recs.map((r, i) => `<div class="rec-item"><div class="rec-num">${i + 1}</div><div>${escHtml(r)}</div></div>`).join('')}
  </div>`;
}

function renderAccordion(groups, selectable = false, infoOnly = false) {
  if (!groups || !Object.keys(groups).length) return '';

  return `<div class="accordion" id="ticketAccordion">
    ${Object.entries(groups).map(([project, tickets]) => `
      <div class="accordion-group">
        <div class="accordion-header" data-project="${escHtml(project)}">
          <div class="accordion-header-left">
            <span>${escHtml(project)}</span>
            <span class="accordion-count">${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}</span>
          </div>
          <span class="accordion-arrow">▾</span>
        </div>
        <div class="accordion-body">
          ${tickets.map(t => `
            <div class="ticket-item${state.ticketSeleccionado === t.name ? ' selected' : ''}" data-ticket="${escHtml(t.name)}" data-url="${escHtml(t.url)}">
              ${selectable ? `<div class="ticket-check"><span class="ticket-check-mark">✓</span></div>` : ''}
              <div class="ticket-info">
                <div class="ticket-name">${escHtml(t.name)}</div>
                <div class="ticket-tags">
                  ${t.priority ? `<span class="tag tag-${t.priority.toLowerCase()}">${escHtml(t.priority)}</span>` : ''}
                  ${t.effort ? `<span class="tag">${escHtml(t.effort)}</span>` : ''}
                  ${t.category ? `<span class="tag">${escHtml(t.category)}</span>` : ''}
                </div>
              </div>
              <a class="ticket-link" href="${escHtml(t.url)}" target="_blank" title="Abrir en Notion" onclick="event.stopPropagation()">↗</a>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ─── Paso 0: Proyectos ─────────────────────────────────── */
function renderStep0() {
  main().innerHTML = `
    <div class="step-header">
      <div class="step-label">Paso 1 de 4</div>
      <div class="step-title">¿En qué proyectos estás trabajando?</div>
      <div class="step-subtitle">Seleccioná todos los que aplican hoy.</div>
    </div>
    <div class="projects-grid">
      ${PROJECTS.map(p => `
        <div class="project-card${state.projects.includes(p) ? ' selected' : ''}" data-project="${escHtml(p)}">
          ${escHtml(p)}
        </div>
      `).join('')}
    </div>
  `;

  main().querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = card.dataset.project;
      if (state.projects.includes(p)) {
        state.projects = state.projects.filter(x => x !== p);
        card.classList.remove('selected');
      } else {
        state.projects.push(p);
        card.classList.add('selected');
      }
      updateFooter();
    });
  });
}

/* ─── Paso 1: Diagnóstico ───────────────────────────────── */
async function renderStep1() {
  let notionHtml = '';

  if (!state._notionTickets && !state._notionError) {
    notionHtml = `<div class="ai-loading"><div class="spinner"></div> Cargando tickets de Notion…</div>`;
  } else if (state._notionError) {
    notionHtml = `<div class="alert">No pudimos conectar con Notion. Podés seguir igual, solo no vas a ver los tickets.</div>`;
  }

  main().innerHTML = buildStep1Html(notionHtml);
  attachStep1Events();

  if (!state._notionTickets && !state._notionError) {
    try {
      state._notionTickets = await getBacklogTickets(state.projects);
      const accordionHtml = Object.keys(state._notionTickets).length > 0
        ? renderAccordion(state._notionTickets, true)
        : `<div class="alert alert-info">No encontramos tickets en el backlog para los proyectos seleccionados.</div>`;
      const container = document.getElementById('notionContainer');
      if (container) {
        container.innerHTML = accordionHtml;
        attachAccordionEvents();
        attachTicketEvents();
      }
    } catch (e) {
      state._notionError = true;
      const container = document.getElementById('notionContainer');
      if (container) {
        container.innerHTML = `<div class="alert">No pudimos conectar con Notion. Podés seguir igual, solo no vas a ver los tickets.</div>`;
      }
    }
  } else if (state._notionTickets) {
    setTimeout(() => {
      attachAccordionEvents();
      attachTicketEvents();
    }, 0);
  }
}

function buildStep1Html(notionHtml) {
  const tickets = state._notionTickets;
  const hasTickets = tickets && Object.keys(tickets).length > 0;

  let ramaAHtml = '';
  if (state.bp === 'si') {
    ramaAHtml = `
      <div class="subsection">
        <div class="section-title">¿De qué tipo es el pendiente?</div>
        ${renderChips(CHIPS_A, state.bpTipo, null)}
        ${state.bpTipo && state.bpTipo !== 'Otro' ? renderRecs(RECS.A[state.bpTipo] || []) : ''}
        ${state.bpTipo === 'Otro' ? `
          <div style="margin-top:16px">
            <textarea id="bpOtroInput" placeholder="Describí brevemente qué es lo que tenés pendiente…" style="min-height:80px">${escHtml(state.bpOtro)}</textarea>
          </div>` : ''}
      </div>
    `;
  }

  let hasTicketsAlert = '';
  let ramaBSubq = '';

  if (state.bp === 'no') {
    if (hasTickets) {
      hasTicketsAlert = `<div class="alert">Encontramos tickets en el backlog de tus proyectos. Revisá si hay algo que puedas tomar antes de seguir.</div>`;
    }

    if (!state.ticketSeleccionado) {
      ramaBSubq = buildRamaBSubq();
    } else {
      ramaBSubq = `<div class="alert alert-success">Ticket seleccionado — podés finalizar o seguir explorando.</div>`;
    }
  }

  const accordionSection = (state.bp !== null) ? `
    <div class="subsection">
      <div class="section-title">Tickets en el backlog</div>
      <div id="notionContainer">
        ${tickets
          ? (hasTickets ? renderAccordion(tickets, true) : `<div class="alert alert-info">No encontramos tickets en el backlog para los proyectos seleccionados.</div>`)
          : notionHtml}
      </div>
    </div>
  ` : '';

  return `
    <div class="step-header">
      <div class="step-label">Paso 2 de 4</div>
      <div class="step-title">Diagnóstico</div>
    </div>

    <div class="section">
      <div class="section-title">¿Hay pendientes en el backlog?</div>
      <div class="binary-options">
        <div class="option-btn${state.bp === 'si' ? ' selected' : ''}" data-bp="si">Sí, hay algo</div>
        <div class="option-btn${state.bp === 'no' ? ' selected' : ''}" data-bp="no">No, está limpio</div>
      </div>

      <div class="hint">
        <button class="hint-toggle" id="hintToggle">¿Qué cuenta como pendiente?</button>
        <div class="hint-body" id="hintBody">
          Comentarios sin reply, tickets sin cerrar, algo bloqueado, propuestas a medias, trabajo viejo sin cerrar, flows de QA pendientes, ideas en la bolsa.
        </div>
      </div>
    </div>

    ${ramaAHtml}

    ${state.bp === 'no' ? hasTicketsAlert : ''}
    ${accordionSection}
    ${state.bp === 'no' ? ramaBSubq : ''}
  `;
}

function buildRamaBSubq() {
  let html = '';

  // B.1
  if (!state.ticketSeleccionado) {
    html += `
      <div class="subsection" id="b1Section">
        <div class="section-title">¿Hay algo creado que puedas empujar?</div>
        <div class="binary-options">
          <div class="option-btn${state.emp === 'si' ? ' selected' : ''}" data-emp="si">Sí, tengo algo</div>
          <div class="option-btn${state.emp === 'no' ? ' selected' : ''}" data-emp="no">No, tampoco</div>
        </div>
        ${state.emp === 'si' ? `
          <div class="subsection">
            <div class="section-title">¿De qué tipo?</div>
            ${renderChips(CHIPS_B1, state.empTipo, null)}
            ${state.empTipo && state.empTipo !== 'Otro' ? renderRecs(RECS.B1[state.empTipo] || []) : ''}
            ${state.empTipo === 'Otro' ? `
              <div style="margin-top:16px">
                <textarea id="empOtroInput" placeholder="Describí brevemente qué es lo que tenés…" style="min-height:80px">${escHtml(state.empOtro)}</textarea>
              </div>` : ''}
          </div>` : ''}
      </div>
    `;

    // B.2 solo si B.1 fue "no"
    if (state.emp === 'no') {
      html += `
        <div class="subsection fade-in" id="b2Section">
          <div class="section-title">¿Hay evidencia reciente para revisar?</div>
          <div class="binary-options">
            <div class="option-btn${state.ev === 'si' ? ' selected' : ''}" data-ev="si">Sí, hay evidencia</div>
            <div class="option-btn${state.ev === 'no' ? ' selected' : ''}" data-ev="no">No, tampoco</div>
          </div>
          ${state.ev === 'si' ? `
            <div class="subsection">
              <div class="section-title">¿De qué tipo?</div>
              ${renderChips(CHIPS_B2, state.evTipo, null)}
              ${state.evTipo ? renderRecs(RECS.B2[state.evTipo] || []) : ''}
            </div>` : ''}
          ${state.ev === 'no' ? `
            <div class="transition-msg">
              No encontramos insumos por ahora. En el siguiente paso vas a poder elegir si querés buscar problemas en el producto o proponer una mejora puntual.
            </div>` : ''}
        </div>
      `;
    }
  }

  return html;
}

function attachStep1Events() {
  // Hint toggle
  const hintToggle = $('hintToggle');
  const hintBody = $('hintBody');
  if (hintToggle) {
    hintToggle.addEventListener('click', () => {
      hintBody.classList.toggle('open');
      hintToggle.textContent = hintBody.classList.contains('open') ? 'Cerrar ↑' : '¿Qué cuenta como pendiente?';
    });
  }

  // BP toggle
  main().querySelectorAll('[data-bp]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.bp = btn.dataset.bp;
      state.bpTipo = null;
      state.bpOtro = '';
      state.ticketSeleccionado = null;
      state.emp = null;
      state.empTipo = null;
      state.empOtro = '';
      state.ev = null;
      state.evTipo = null;
      renderStep1();
      updateFooter();
    });
  });

  // Chips rama A
  main().querySelectorAll('[data-chip]').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.chip;
      const context = chip.closest('.subsection');

      if (context && context.querySelector('[data-emp]')) {
        // Chips B.1
        state.empTipo = val;
        state.empOtro = '';
      } else if (context && context.querySelector('[data-ev]')) {
        // Chips B.2
        state.evTipo = val;
      } else {
        // Chips A
        state.bpTipo = val;
        state.bpOtro = '';
      }
      renderStep1().then(() => {
        if (state._notionTickets) {
          attachAccordionEvents();
          attachTicketEvents();
        }
      });
      updateFooter();
    });
  });

  // EMP toggle
  main().querySelectorAll('[data-emp]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.emp = btn.dataset.emp;
      state.empTipo = null;
      state.empOtro = '';
      state.ev = null;
      state.evTipo = null;
      renderStep1().then(() => {
        if (state._notionTickets) {
          attachAccordionEvents();
          attachTicketEvents();
        }
      });
      updateFooter();
    });
  });

  // EV toggle
  main().querySelectorAll('[data-ev]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.ev = btn.dataset.ev;
      state.evTipo = null;
      renderStep1().then(() => {
        if (state._notionTickets) {
          attachAccordionEvents();
          attachTicketEvents();
        }
      });
      updateFooter();
    });
  });

  // Chips B.2
  main().querySelectorAll('#b2Section .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.evTipo = chip.dataset.chip;
      renderStep1().then(() => {
        if (state._notionTickets) {
          attachAccordionEvents();
          attachTicketEvents();
        }
      });
      updateFooter();
    });
  });

  // Textarea inputs
  const bpOtroInput = $('bpOtroInput');
  if (bpOtroInput) {
    bpOtroInput.addEventListener('input', () => {
      state.bpOtro = bpOtroInput.value;
      updateFooter();
    });
  }
  const empOtroInput = $('empOtroInput');
  if (empOtroInput) {
    empOtroInput.addEventListener('input', () => {
      state.empOtro = empOtroInput.value;
      updateFooter();
    });
  }

  attachAccordionEvents();
  if (state._notionTickets) attachTicketEvents();
}

function attachAccordionEvents() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.accordion-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });
  });
}

function attachTicketEvents() {
  document.querySelectorAll('.ticket-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('ticket-link') || e.target.closest('.ticket-link')) return;
      const name = item.dataset.ticket;
      if (state.ticketSeleccionado === name) {
        state.ticketSeleccionado = null;
      } else {
        state.ticketSeleccionado = name;
      }
      renderStep1().then(() => {
        if (state._notionTickets) {
          attachAccordionEvents();
          attachTicketEvents();
        }
      });
      updateFooter();
    });
  });
}

/* ─── Paso 2: Dirección ─────────────────────────────────── */
function renderStep2() {
  const dirRecs = {
    prob: ['Empezá por el flujo de mayor impacto o el que tiene más quejas', 'Usá heurísticas de Nielsen como framework si hacés QA solo', 'Documentá cada hallazgo: qué es, dónde ocurre, severidad estimada'],
    mej: ['Partí de evidencia — no propongas sin al menos un dato', 'Definí el alcance: ¿es micro UX o un rediseño de flujo?', 'Considerá al menos 2 alternativas antes de elegir solución']
  };

  main().innerHTML = `
    <div class="step-header">
      <div class="step-label">Paso 3 de 4</div>
      <div class="step-title">Dirección</div>
      <div class="step-subtitle">No encontramos insumos existentes. ¿Qué querés producir hoy?</div>
    </div>

    <div class="section">
      <div class="section-title">¿Qué querés producir?</div>
      <div class="binary-options">
        <div class="option-btn${state.dir === 'prob' ? ' selected' : ''}" data-dir="prob">Buscar problemas</div>
        <div class="option-btn${state.dir === 'mej' ? ' selected' : ''}" data-dir="mej">Proponer mejoras</div>
      </div>
    </div>

    ${state.dir ? `
      <div class="subsection fade-in">
        ${renderRecs(dirRecs[state.dir])}

        <div class="section-title" style="margin-top:24px">${state.dir === 'prob' ? '¿Por dónde vas a empezar?' : '¿Qué tipo de mejora?'}</div>
        ${renderChips(state.dir === 'prob' ? CHIPS_PROB : CHIPS_MEJ, state.dirMetodo, null)}

        <div style="margin-top:24px">
          <div class="section-title">¿En qué área del producto?</div>
          <textarea id="dirAreaInput" placeholder="Ej: flujo de onboarding, pantalla de perfil…">${escHtml(state.dirArea)}</textarea>
        </div>

        <hr class="divider">

        <div class="section-title">Alineación — priorizá con:</div>
        ${renderChips(CHIPS_ALIN, state.dirAlineacion, null)}

        <div style="margin-top:24px">
          <div class="section-title">Condicionantes o contexto clave</div>
          <textarea id="dirContextoInput" placeholder="Deadline, restricciones técnicas, dependencias del equipo…">${escHtml(state.dirContexto)}</textarea>
        </div>
      </div>
    ` : ''}
  `;

  main().querySelectorAll('[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.dir = btn.dataset.dir;
      state.dirMetodo = null;
      renderStep2();
      updateFooter();
    });
  });

  main().querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.chip;
      if (CHIPS_ALIN.includes(val)) {
        state.dirAlineacion = val;
      } else {
        state.dirMetodo = val;
      }
      chip.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      updateFooter();
    });
  });

  const dirAreaInput = $('dirAreaInput');
  if (dirAreaInput) dirAreaInput.addEventListener('input', () => { state.dirArea = dirAreaInput.value; });

  const dirContextoInput = $('dirContextoInput');
  if (dirContextoInput) dirContextoInput.addEventListener('input', () => { state.dirContexto = dirContextoInput.value; });
}

/* ─── Paso 3: Cierre ────────────────────────────────────── */
function renderStep3() {
  main().innerHTML = `
    <div class="step-header">
      <div class="step-label">Paso 4 de 4</div>
      <div class="step-title">Cierre</div>
    </div>

    <div class="section">
      <div class="section-title">¿Qué encontraste o querés proponer?</div>
      <textarea id="hallazgoInput" placeholder="Describí lo que observaste, descubriste o querés proponer…" style="min-height:120px">${escHtml(state.hallazgo)}</textarea>
    </div>

    <div class="section">
      <div class="section-title">Tipo de output</div>
      <div class="binary-options" style="flex-direction:column;gap:8px">
        ${OUTPUT_TYPES.map(o => `
          <div class="option-btn${state.out === o.key ? ' selected' : ''}" data-out="${o.key}" style="display:flex;flex-direction:column;align-items:flex-start;gap:2px">
            <span style="font-weight:600">${escHtml(o.label)}</span>
            <span style="font-size:12px;color:var(--text-muted)">${escHtml(o.desc)}</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${state.out ? `
      <div class="subsection fade-in">
        ${renderRecs(RECS.out[state.out] || [])}
        <div style="margin-top:16px">
          <div class="section-title">Draft</div>
          <textarea id="outDraftInput" style="min-height:160px;font-family:'SF Mono','Fira Code',monospace;font-size:13px">${escHtml(state.outDraft || OUTPUT_TEMPLATES[state.out])}</textarea>
        </div>
      </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Notas adicionales</div>
      <textarea id="notasInput" placeholder="Links, screenshots, referencias…">${escHtml(state.notas)}</textarea>
    </div>
  `;

  const hallazgoInput = $('hallazgoInput');
  if (hallazgoInput) hallazgoInput.addEventListener('input', () => { state.hallazgo = hallazgoInput.value; });

  main().querySelectorAll('[data-out]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newOut = btn.dataset.out;
      if (state.out !== newOut) {
        state.out = newOut;
        state.outDraft = OUTPUT_TEMPLATES[newOut];
      }
      renderStep3();
      updateFooter();
    });
  });

  const outDraftInput = $('outDraftInput');
  if (outDraftInput) {
    outDraftInput.addEventListener('input', () => { state.outDraft = outDraftInput.value; });
  }

  const notasInput = $('notasInput');
  if (notasInput) notasInput.addEventListener('input', () => { state.notas = notasInput.value; });
}

/* ─── Pantalla Final ────────────────────────────────────── */
async function renderFinal() {
  $('btnNext').style.display = 'none';
  $('btnBack').style.display = 'none';

  const camino = detectCamino();

  const summaryRows = [
    ['Proyectos', state.projects.join(', ')],
    ['Diagnóstico', CAMINO_LABELS[camino]],
    state.ticketSeleccionado ? ['Ticket seleccionado', state.ticketSeleccionado] : null,
    (state.bpTipo || state.empTipo || state.evTipo) ? ['Tipo', state.bpTipo || state.empTipo || state.evTipo] : null,
    (state.bpOtro || state.empOtro) ? ['Descripción', state.bpOtro || state.empOtro] : null,
    state.dir ? ['Dirección', state.dir === 'prob' ? 'Buscar problemas' : 'Proponer mejoras'] : null,
    state.dirMetodo ? ['Método', state.dirMetodo] : null,
    state.dirArea ? ['Área del producto', state.dirArea] : null,
    state.hallazgo ? ['Hallazgo', state.hallazgo] : null,
    state.out ? ['Tipo de output', OUTPUT_TYPES.find(o => o.key === state.out)?.label || state.out] : null,
    state.outDraft ? ['Draft', state.outDraft] : null,
    state.notas ? ['Notas', state.notas] : null
  ].filter(Boolean);

  main().innerHTML = `
    <div class="step-header">
      <div class="step-label">Proceso completado</div>
      <div class="step-title">Resumen</div>
    </div>

    <div class="summary-table">
      ${summaryRows.map(([k, v]) => `
        <div class="summary-row">
          <div class="summary-key">${escHtml(k)}</div>
          <div class="summary-val">${escHtml(v)}</div>
        </div>
      `).join('')}
    </div>

    <div class="ai-box" id="nextStepBox">
      <div class="ai-box-header">
        <div class="ai-box-title">Próximo paso</div>
      </div>
      <div class="ai-content" id="nextStepContent">
        <div class="ai-loading"><div class="spinner"></div> Generando…</div>
      </div>
    </div>

    <div id="userStoryBox"></div>

    <div class="actions-grid">
      <button class="btn btn-outline btn-sm" id="btnUserStory">Generar User Story</button>
      <button class="btn btn-ghost btn-sm" id="btnSaveNotion">Guardar en Notion</button>
      <button class="btn btn-ghost btn-sm" id="btnModify">← Modificar</button>
      <button class="btn btn-ghost btn-sm" id="btnNew">Nuevo proceso</button>
    </div>
  `;

  // Cargar próximo paso automáticamente
  loadNextStep();

  $('btnUserStory').addEventListener('click', loadUserStory);
  $('btnSaveNotion').addEventListener('click', saveToNotion);
  $('btnModify').addEventListener('click', () => { state.step = state.lastBeforeDone; render(); });
  $('btnNew').addEventListener('click', resetAll);
}

async function loadNextStep() {
  try {
    const text = await getNextStep(state);
    state._nextStep = text;
    const el = $('nextStepContent');
    if (el) el.innerHTML = `<div class="fade-in">${escHtml(text)}</div>`;
  } catch (e) {
    const el = $('nextStepContent');
    if (el) el.innerHTML = `<span style="color:var(--text-muted)">No pudimos conectar con la IA. Chequeá tu conexión y las keys en config.js.</span>`;
  }
}

async function loadUserStory() {
  const box = $('userStoryBox');
  box.innerHTML = `<div class="ai-box">
    <div class="ai-box-header"><div class="ai-box-title">User Story</div></div>
    <div class="ai-content"><div class="ai-loading"><div class="spinner"></div> Generando…</div></div>
  </div>`;

  try {
    const text = await generateUserStory(state);
    state._userStory = text;
    box.innerHTML = `<div class="ai-box fade-in">
      <div class="ai-box-header">
        <div class="ai-box-title">User Story</div>
        <button class="btn btn-ghost btn-sm" id="btnCopyUS">Copiar</button>
      </div>
      <div class="ai-content" style="white-space:pre-wrap">${escHtml(text)}</div>
    </div>`;
    $('btnCopyUS').addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        $('btnCopyUS').textContent = '¡Copiado!';
        setTimeout(() => { if ($('btnCopyUS')) $('btnCopyUS').textContent = 'Copiar'; }, 2000);
      });
    });
  } catch (e) {
    box.innerHTML = `<div class="alert">No pudimos generar la user story. Chequeá tu conexión y las keys en config.js.</div>`;
  }
}

async function saveToNotion() {
  const btn = $('btnSaveNotion');
  btn.disabled = true;
  btn.textContent = 'Guardando…';
  try {
    await createSummaryPage(state, state._nextStep);
    btn.textContent = '¡Guardado en Notion!';
  } catch (e) {
    btn.textContent = 'Guardar en Notion';
    btn.disabled = false;
    alert('No pudimos guardar en Notion: ' + (e.message || 'chequeá tu conexión y las keys'));
  }
}

/* ─── Navegación ─────────────────────────────────────────── */
function render() {
  updateStepDots();
  updateFooter();

  if (state.step === 0) renderStep0();
  else if (state.step === 1) renderStep1();
  else if (state.step === 2) renderStep2();
  else if (state.step === 3) renderStep3();
  else if (state.step === 4) renderFinal();
}

function advance() {
  if (state.step === 0) {
    state.step = 1;
    state.lastBeforeDone = 1;
  } else if (state.step === 1) {
    if (isEarlyExit() && earlyReady()) {
      state.lastBeforeDone = 1;
      state.step = 4;
    } else if (state.ev === 'no') {
      state.lastBeforeDone = 2;
      state.step = 2;
    }
  } else if (state.step === 2) {
    state.lastBeforeDone = 2;
    state.step = 3;
  } else if (state.step === 3) {
    state.lastBeforeDone = 3;
    state.step = 4;
  }
  render();
}

function goBack() {
  if (state.step > 0 && state.step < 4) {
    state.step--;
    render();
  }
}

function resetAll() {
  Object.assign(state, {
    step: 0, projects: [], bp: null, bpTipo: null, bpOtro: '',
    ticketSeleccionado: null, emp: null, empTipo: null, empOtro: '',
    ev: null, evTipo: null, dir: null, dirMetodo: null, dirArea: '',
    dirAlineacion: null, dirContexto: '', hallazgo: '', out: null,
    outDraft: '', notas: '', lastBeforeDone: 1,
    _notionTickets: null, _notionError: false,
    _nextStep: null, _nextStepLoading: false,
    _userStory: null, _userStoryLoading: false
  });
  $('btnNext').style.display = 'inline-flex';
  $('footer').style.display = 'block';
  render();
}

/* ─── Init ──────────────────────────────────────────────── */
$('btnNext').addEventListener('click', advance);
$('btnBack').addEventListener('click', goBack);

render();
