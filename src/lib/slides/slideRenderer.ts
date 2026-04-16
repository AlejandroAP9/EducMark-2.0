/**
 * Port directo del Generador Slides v9.0 de n8n.
 * Mismo HTML, mismas clases CSS, mismo layout.
 */

export interface SlideInput {
  slide_number: number;
  type: 'cover' | 'goal' | 'content' | 'quiz';
  title: string;
  content?: string | { main_text?: string; chilean_example?: string; key_vocabulary?: string[]; activation_questions?: string[] };
  main_text?: string;
  chilean_example?: string;
  key_vocabulary?: string[];
  activation_questions?: string[];
  teacher?: string;
  grade?: string;
  imageUrl?: string;
  options?: { key: string; text: string }[];
  correct_key?: string;
  explanation?: string;
}

export function renderSlide(data: SlideInput): { innerHTML: string; bgStyle: string } {
  const contentObj = typeof data.content === 'object' && data.content !== null
    ? data.content
    : { main_text: typeof data.content === 'string' ? data.content : '' };

  const slide = {
    number: Number(data.slide_number || 1),
    type: data.type || 'content',
    title: data.title || 'Clase',
    text: contentObj.main_text || data.main_text || '',
    example: contentObj.chilean_example || data.chilean_example || '',
    vocab: contentObj.key_vocabulary || data.key_vocabulary || [],
    questions: contentObj.activation_questions || data.activation_questions || [],
    teacher: data.teacher || 'Docente',
    grade: data.grade || 'Curso',
    image: data.imageUrl || '',
    quiz: {
      options: data.options || [],
      correct: data.correct_key || 'A',
      explanation: data.explanation || '',
    },
  };

  const bgStyle = slide.image
    ? `background-image: url('${slide.image}'); background-size: cover; background-position: center;`
    : '';

  let innerHTML = '';

  if (slide.type === 'cover') {
    innerHTML = `<div style="text-align:center; z-index:10;">
      <div style="background:linear-gradient(90deg,#6e56cf,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;font-size:2rem;letter-spacing:5px;margin-bottom:30px;text-transform:uppercase;">
        ${slide.grade} \u2022 ${slide.teacher}
      </div>
      <h1 class="editable" style="font-size:7rem;margin:0;line-height:1;text-shadow:0 0 60px rgba(110,86,207,0.4); max-width:1700px;">${slide.title}</h1>
      <div class="editable" style="font-size:3rem;color:#cbd5e1;margin-top:40px;font-weight:400;">${slide.text}</div>
    </div>`;
  } else if (slide.type === 'goal') {
    innerHTML = `<div style="text-align:center; max-width:1600px;">
      <div style="font-size:8rem;margin-bottom:40px;filter:drop-shadow(0 0 40px rgba(244,114,182,0.5));">\uD83C\uDFAF</div>
      <h1 style="font-size:5rem;">Objetivo de la Clase</h1>
      <div class="editable" style="font-size:3.5rem;line-height:1.3;color:#fff;font-weight:400;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.15);border-radius:40px;padding:60px;">
        "${slide.text}"
      </div>
    </div>`;
  } else if (slide.type === 'quiz') {
    const opts = slide.quiz.options.map(o =>
      `<div class="option-btn" onclick="check(this,'${o.key}')" data-key="${o.key}" data-correct="${o.key === slide.quiz.correct}"><b>${o.key}</b> <span class="editable">${o.text}</span></div>`
    ).join('');
    innerHTML = `<div style="text-align:center;width:100%;">
      <div style="color:#f472b6;font-weight:900;letter-spacing:4px;font-size:1.5rem;margin-bottom:30px;">\u26A1 QUIZ R\u00C1PIDO</div>
      <h1 class="editable" style="font-size:4.5rem;">${slide.title}</h1>
      <div class="quiz-grid">${opts}</div>
      <div id="feedback" class="feedback-box">\uD83D\uDCA1 <span class="editable">${slide.quiz.explanation}</span></div>
    </div>`;
  } else {
    const vocabHtml = slide.vocab.map(v => `<span class="tag editable">${v}</span>`).join('');
    const questionsHtml = slide.questions.map(q => `<div class="q-item"><span class="editable">\u279C ${q}</span></div>`).join('');
    let exampleHtml = '';
    if (slide.example) {
      exampleHtml = `<div class="chilean-box">
        <div class="chile-title">\uD83C\uDDE8\uD83C\uDDF1 Contexto Chileno</div>
        <p class="editable">${slide.example}</p>
      </div>`;
    }
    const imageHtml = slide.image
      ? `<img src="${slide.image}" class="zoomable-img slide-img" data-slide="${slide.number}" style="width:100%; height:100%; object-fit:cover; cursor:zoom-in;" referrerpolicy="no-referrer" onclick="toggleZoom(this)">`
      : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.03); font-size:2rem; color:rgba(255,255,255,0.2); border-radius:35px;">Imagen</div>`;

    innerHTML = `<div class="col-text">
      <h1 class="editable">${slide.title}</h1>
      <div class="main-text editable">${slide.text}</div>
      ${exampleHtml}
    </div>
    <div class="col-visual">
      <div class="img-card-container">
        ${imageHtml}
        <div class="img-upload-overlay" onclick="handleImageUpload(this)">
          <div class="img-upload-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Cambiar imagen
          </div>
        </div>
      </div>
      <div class="glass-card">
        ${vocabHtml ? `<h3>CONCEPTOS CLAVE</h3><div style="margin-bottom:30px; line-height:1.6;">${vocabHtml}</div>` : ''}
        ${questionsHtml ? `<h3>PREGUNTAS</h3><div>${questionsHtml}</div>` : ''}
      </div>
    </div>`;
  }

  return { innerHTML, bgStyle };
}
