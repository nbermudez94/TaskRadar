async function anthropicRequest(systemPrompt, userPrompt, maxTokens) {
  const res = await fetch('http://localhost:3000/anthropic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

function buildContext(state) {
  const camino = detectCamino(state);
  const proyectos = state.projects.join(', ');

  const CAMINO_LABELS = {
    A: 'Backlog — pendiente encontrado',
    B: 'Backlog — ticket seleccionado',
    C: 'Trabajo previo',
    D: 'Evidencia disponible',
    E: 'Sin insumos — dirección generada'
  };

  let ctx = `Proyectos: ${proyectos}. Camino ${camino} — ${CAMINO_LABELS[camino]}.`;

  if (state.bp === 'si' && state.bpTipo) {
    ctx += ` Tipo: ${state.bpTipo === 'Otro' ? state.bpOtro : state.bpTipo}.`;
  }
  if (state.ticketSeleccionado) {
    ctx += ` Ticket: ${state.ticketSeleccionado}.`;
  }
  if (state.emp === 'si' && state.empTipo) {
    ctx += ` Trabajo previo: ${state.empTipo === 'Otro' ? state.empOtro : state.empTipo}.`;
  }
  if (state.ev === 'si' && state.evTipo) {
    ctx += ` Evidencia: ${state.evTipo}.`;
  }
  if (state.dir) {
    ctx += ` Dirección: ${state.dir === 'prob' ? 'Buscar problemas' : 'Proponer mejoras'}.`;
  }
  if (state.dirMetodo) ctx += ` Método: ${state.dirMetodo}.`;
  if (state.dirArea) ctx += ` Área: ${state.dirArea}.`;
  if (state.hallazgo) ctx += ` Hallazgo: ${state.hallazgo}.`;
  if (state.out) ctx += ` Output: ${state.out}.`;
  if (state.outDraft) ctx += ` Draft: ${state.outDraft}.`;
  if (state.notas) ctx += ` Notas: ${state.notas}.`;

  return ctx;
}

function detectCamino(state) {
  if (state.bp === 'si') return 'A';
  if (state.bp === 'no' && state.ticketSeleccionado) return 'B';
  if (state.emp === 'si') return 'C';
  if (state.ev === 'si') return 'D';
  return 'E';
}

async function getNextStep(state) {
  const system = 'Sos un senior UX designer. Español rioplatense. Sin markdown. Sin asteriscos. Respuesta corta.';
  const user = `Contexto: ${buildContext(state)}\n\nEscribí 2 oraciones concretas sobre el próximo paso para ESTE caso específico. Sin introducción, sin comillas.`;
  return anthropicRequest(system, user, 400);
}

async function generateUserStory(state) {
  const system = 'Sos un senior UX designer. Español rioplatense. Sin markdown. Sin asteriscos.';
  const user = `Contexto del proceso completado:\n${buildContext(state)}\n\nGenerá una user story completa lista para estimar, con este formato exacto:\n\nComo [tipo de usuario], quiero [acción],\npara [beneficio].\n\nContexto: [1-2 oraciones de contexto para el equipo de desarrollo]\n\nCriterios de aceptación:\n- [criterio 1]\n- [criterio 2]\n- [criterio 3]`;
  return anthropicRequest(system, user, 800);
}
