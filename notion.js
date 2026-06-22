async function notionRequest(method, path, body) {
  const res = await fetch('http://localhost:3000/notion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, path, body })
  });
  if (!res.ok) throw new Error(`Notion error ${res.status}`);
  return res.json();
}

async function getBacklogTickets(selectedProjects) {
  let tickets = [];
  let cursor = undefined;

  do {
    const payload = {
      filter: {
        property: 'Status',
        status: { equals: 'Backlog' }
      },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {})
    };

    const data = await notionRequest(
      'POST',
      `/v1/databases/${CONFIG.NOTION_DATABASE_ID}/query`,
      payload
    );

    const parsed = (data.results || []).map(page => {
      const props = page.properties || {};

      const getName = p => p?.title?.[0]?.plain_text || '';
      const getSelect = p => p?.select?.name || null;
      const getMultiSelect = p => (p?.multi_select || []).map(o => o.name);

      return {
        id: page.id,
        url: page.url,
        name: getName(props['Name']),
        priority: getSelect(props['Priority']),
        effort: getSelect(props['Effort']),
        category: getSelect(props['Category']),
        projects: getMultiSelect(props['Project'])
      };
    });

    tickets = tickets.concat(parsed);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  // Filtrar por proyectos seleccionados en el cliente
  const filtered = tickets.filter(t =>
    t.projects.some(p => selectedProjects.includes(p))
  );

  // Agrupar por proyecto
  const groups = {};
  for (const project of selectedProjects) {
    const projectTickets = filtered.filter(t => t.projects.includes(project));
    if (projectTickets.length > 0) {
      groups[project] = projectTickets;
    }
  }

  return groups;
}

async function createSummaryPage(state, nextStep) {
  const summaryDbId = CONFIG.NOTION_SUMMARY_DATABASE_ID;
  if (!summaryDbId || summaryDbId === 'PENDIENTE_DEFINIR') {
    throw new Error('NOTION_SUMMARY_DATABASE_ID no está configurado todavía');
  }

  const fecha = new Date().toLocaleDateString('es-AR');
  const proyectos = state.projects.join(', ');
  const title = `Proceso Proactivo — ${fecha} — ${proyectos}`;

  const children = buildPageContent(state, nextStep);

  return notionRequest('POST', '/v1/pages', {
    parent: { database_id: summaryDbId },
    properties: {
      title: { title: [{ text: { content: title } }] }
    },
    children
  });
}

function buildPageContent(state, nextStep) {
  const blocks = [];

  const heading = (text) => ({
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: text } }] }
  });

  const paragraph = (text) => ({
    object: 'block', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: text || '—' } }] }
  });

  blocks.push(heading('Resumen del proceso'));

  const CAMINO_LABELS = {
    A: 'Backlog — pendiente encontrado',
    B: 'Backlog — ticket seleccionado',
    C: 'Trabajo previo',
    D: 'Evidencia disponible',
    E: 'Sin insumos — dirección generada'
  };

  const camino = detectCamino(state);
  const rows = [
    ['Proyectos', state.projects.join(', ')],
    ['Diagnóstico', CAMINO_LABELS[camino] || camino],
    state.ticketSeleccionado && ['Ticket seleccionado', state.ticketSeleccionado],
    state.bpTipo && ['Tipo de pendiente', state.bpTipo === 'Otro' ? state.bpOtro : state.bpTipo],
    state.empTipo && ['Tipo de pendiente', state.empTipo === 'Otro' ? state.empOtro : state.empTipo],
    state.evTipo && ['Tipo de evidencia', state.evTipo],
    state.dir && ['Dirección', state.dir === 'prob' ? 'Buscar problemas' : 'Proponer mejoras'],
    state.dirMetodo && ['Método / Tipo de mejora', state.dirMetodo],
    state.dirArea && ['Área del producto', state.dirArea],
    state.hallazgo && ['Hallazgo', state.hallazgo],
    state.out && ['Tipo de output', { ref: 'hip', label: 'Hipótesis' }[state.out] || state.out],
    state.outDraft && ['Draft', state.outDraft],
    state.notas && ['Notas', state.notas]
  ].filter(Boolean);

  for (const [campo, valor] of rows) {
    blocks.push(paragraph(`${campo}: ${valor}`));
  }

  if (nextStep) {
    blocks.push(heading('Próximo paso'));
    blocks.push(paragraph(nextStep));
  }

  return blocks;
}

function detectCamino(state) {
  if (state.bp === 'si') return 'A';
  if (state.bp === 'no' && state.ticketSeleccionado) return 'B';
  if (state.emp === 'si') return 'C';
  if (state.ev === 'si') return 'D';
  return 'E';
}
