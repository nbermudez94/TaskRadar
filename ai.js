async function groqRequest(system, prompt, maxTokens) {
  const res = await fetch('http://localhost:3000/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, prompt, maxTokens })
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Respuesta vacía de Groq');
  return text;
}

const SYSTEM_CARDS = `Sos un asistente interno de destrabe para un equipo de diseño UX.
Tu objetivo es ayudar a alguien que se siente trabado, sin tareas o sin dirección.
Respondé SOLO con JSON válido, sin texto extra ni markdown adicional.
Tono: práctico, humano, un poco liviano. Español rioplatense.
No des consejos genéricos. No pidas proyecto primero.
Siempre generá acciones concretas y accionables.

IMPORTANTE: Todas las acciones deben ser propias del trabajo de UX cuando tenga sentido. Ejemplos de acciones UX válidas: mapear un flujo de usuario, revisar research existente, hacer un benchmark de competidores, armar un documento de discovery, escribir guía de entrevista, priorizar hallazgos, definir criterios de éxito para una feature, hacer un audit de usabilidad, explorar patrones de diseño, sistematizar feedback de usuarios, preparar una propuesta de diseño, armar mapa de empatía, generar prototipos rápidos en papel, etc. Si el contexto no da pistas de área específica, elegí la acción UX más útil para la situación.`;

async function generateCards(state) {
  const SITUACION_LABELS = {
    sin_asignar: 'No tengo nada asignado',
    no_se_cual: 'Tengo cosas, pero no sé cuál agarrar',
    esperando: 'Estoy esperando a alguien',
    idea_suelta: 'Tengo una idea suelta',
    aportar_valor: 'Quiero aportar valor, pero no sé desde dónde',
    poca_energia: 'Estoy con poca energía',
    trabado: 'No sé, estoy trabado'
  };
  const OUTPUT_LABELS = {
    nota: 'una nota', mensaje: 'un mensaje de Slack', checklist: 'una checklist',
    tarea: 'una tarea', propuesta: 'una propuesta',
    preguntas: 'preguntas para destrabar', sorpresa: 'lo que mejor le quede al caso'
  };

  const tieneTexto = state.textoLibre && state.textoLibre.trim().length > 2;

  const prompt = `${tieneTexto ? `La persona describió su situación con estas palabras exactas:
"${state.textoLibre.trim()}"

Esto es lo más importante. Las recomendaciones deben ser ESPECÍFICAS a lo que escribió arriba, no genéricas.
` : ''}La persona también seleccionó:
- Situación: ${SITUACION_LABELS[state.situacion] || state.situacion}
- Detalle: ${state.detalle}
- Quiere producir: ${OUTPUT_LABELS[state.outputType] || state.outputType}

${tieneTexto ? 'Usá las palabras exactas de la persona para generar caminos concretos y relevantes a SU caso específico.' : 'Detectá el tipo de bloqueo.'} Generá exactamente 3 caminos de acción distintos.

Respondé con este JSON exacto:
{
  "diagnostico": "1-2 frases sobre qué tipo de bloqueo es, tono rioplatense, empezando con 'Parece...' o similar",
  "bloqueo": "tipo principal de bloqueo en una o dos palabras",
  "cards": [
    {
      "titulo": "título concreto de la acción",
      "tipo": "Acción rápida",
      "bloqueo": "qué bloqueo específico resuelve",
      "porque": "por qué esta acción sirve para este caso puntual",
      "tiempo": "X min",
      "primerPaso": "acción concreta y específica para arrancar ahora mismo",
      "outputEsperado": "qué queda al terminar"
    },
    {
      "titulo": "...",
      "tipo": "Útil para el equipo",
      "bloqueo": "...",
      "porque": "...",
      "tiempo": "...",
      "primerPaso": "...",
      "outputEsperado": "..."
    },
    {
      "titulo": "...",
      "tipo": "Estratégica",
      "bloqueo": "...",
      "porque": "...",
      "tiempo": "...",
      "primerPaso": "...",
      "outputEsperado": "..."
    }
  ]
}`;

  const raw = await groqRequest(SYSTEM_CARDS, prompt, 1000);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Respuesta de IA inválida');
  return JSON.parse(match[0]);
}

const SYSTEM_OUTPUT = `Sos un asistente interno de destrabe para un equipo de diseño UX.
Generá un artefacto de trabajo práctico, listo para copiar y usar.
Español rioplatense. Sin consejos genéricos. Solo el artefacto, sin explicaciones extra ni encabezados que digan "Aquí está tu...".
- Si es mensaje de Slack: natural, directo, listo para enviar. Sin formato markdown.
- Si es checklist: ítems accionables con guión y checkbox tipo "- [ ] ítem"
- Si es tarea: título, descripción breve, criterios de aceptación y primer paso
- Si es propuesta: problema / propuesta / por qué importa / próximo paso
- Si son preguntas: preguntas cortas y precisas para destrabar, numeradas
- Si es nota: estructurada, con secciones si tiene sentido, escaneable
- Si es sorpresa: elegí el formato más útil para el caso`;

async function generateOutput(card, outputType, state) {
  const OUTPUT_LABELS = {
    nota: 'Nota', mensaje: 'Mensaje de Slack', checklist: 'Checklist',
    tarea: 'Tarea', propuesta: 'Propuesta',
    preguntas: 'Preguntas para destrabar', sorpresa: 'el formato más útil'
  };

  const prompt = `La persona eligió esta acción:
Título: ${card.titulo}
Tipo: ${card.tipo}
Por qué sirve: ${card.porque}
Primer paso: ${card.primerPaso}
Output esperado: ${card.outputEsperado}

Situación base: ${state.situacion} → ${state.detalle}
${state.textoLibre ? `Contexto adicional: ${state.textoLibre}` : ''}

Generá el output final como: ${OUTPUT_LABELS[outputType] || outputType}
Tiene que ser copiable y listo para usar directamente.`;

  return groqRequest(SYSTEM_OUTPUT, prompt, 700);
}

async function refineCard(card, instruction, state) {
  const INSTRUCCIONES = {
    chica:       `Generá una versión más pequeña y rápida de esta acción. Máximo 15 minutos, bajo esfuerzo.`,
    estrategica: `Generá una versión más estratégica y de mayor impacto de esta acción. Puede llevar más tiempo.`,
    otra:        `Generá una acción completamente diferente del mismo tipo (${card.tipo}) para el mismo contexto. No repitas el título ni el primer paso anterior.`
  };

  const tieneTexto = state.textoLibre && state.textoLibre.trim().length > 2;

  const prompt = `${tieneTexto ? `Situación descrita por la persona: "${state.textoLibre.trim()}"` : `Situación: ${state.situacion} → ${state.detalle}`}

Acción actual a modificar:
- Título: ${card.titulo}
- Tipo: ${card.tipo}
- Por qué: ${card.porque}
- Primer paso: ${card.primerPaso}

Instrucción: ${INSTRUCCIONES[instruction]}

Respondé SOLO con este JSON:
{
  "titulo": "título concreto de la acción",
  "tipo": "${card.tipo}",
  "bloqueo": "qué bloqueo resuelve",
  "porque": "por qué sirve para este caso",
  "tiempo": "X min",
  "primerPaso": "acción concreta para arrancar ahora",
  "outputEsperado": "qué queda al terminar"
}`;

  const raw = await groqRequest(SYSTEM_CARDS, prompt, 500);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Respuesta de IA inválida');
  const parsed = JSON.parse(match[0]);
  parsed.tipo = card.tipo;
  return parsed;
}

async function refineOutput(currentOutput, instruction) {
  const system = `Sos un asistente interno. Modificá el artefacto según la instrucción.
Español rioplatense. Solo devolvé el artefacto modificado, sin explicaciones.`;

  const prompt = `Artefacto actual:
${currentOutput}

Instrucción: ${instruction}

Devolvé solo el artefacto modificado.`;

  return groqRequest(system, prompt, 700);
}
