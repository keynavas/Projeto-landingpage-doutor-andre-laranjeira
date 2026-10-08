// Animações de rolagem e indicador lateral de seções.
// Funciona sobre o HTML que o support.js renderiza, sem depender dele:
// observa o DOM e aplica os efeitos quando os elementos aparecem.
(() => {
  'use strict';

  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const temTranslate = window.CSS && CSS.supports && CSS.supports('translate', '0 1px');
  const SUAVE = 'cubic-bezier(.2,.7,.2,1)';

  /* ------------------------------------------------------------------ */
  /* Entrada e saída dos blocos ao rolar                                */
  /* ------------------------------------------------------------------ */

  // Candidatos a animar; de elementos aninhados, só o mais interno anima.
  const SELETORES = [
    '#inicio > *',
    'main > section:not(#inicio) > div:not([aria-hidden]) > *:not([aria-hidden])',
    '#atendimento > div > div:last-child > *',
    'main section article',
    'main > div > *',
    'main article',
    'footer > div > *',
    'footer > div > div:first-child > *',
    '[data-anima]'
  ];
  const DESLOCAMENTO = 48;
  const DESLOCAMENTO_LATERAL = 64;

  const registrados = new WeakSet();
  const visiveis = new WeakSet();
  let lote = [];
  let loteAgendado = false;

  // Elementos com data-lado="esquerda|direita" entram e saem pelo lado;
  // os demais, por cima ou por baixo conforme o sentido da rolagem.
  function quadro(el, sentido, opacidade) {
    const q = { opacity: opacidade };
    if (!temTranslate) return q;
    const lado = el.dataset.lado;
    if (lado && sentido) q.translate = `${lado === 'esquerda' ? -DESLOCAMENTO_LATERAL : DESLOCAMENTO_LATERAL}px 0`;
    else q.translate = `0 ${sentido * DESLOCAMENTO}px`;
    return q;
  }

  function animar(el, de, para, duracao, atraso) {
    if (el._anim) el._anim.cancel();
    el._anim = el.animate([de, para], { duration: duracao, delay: atraso, easing: SUAVE, fill: 'both' });
  }

  function entrar(el, vindoDeCima, atraso) {
    visiveis.add(el);
    animar(el, quadro(el, vindoDeCima ? -1 : 1, 0), quadro(el, 0, 1), 900, atraso);
  }

  function sair(el, saiuPorCima) {
    visiveis.delete(el);
    animar(el, quadro(el, 0, 1), quadro(el, saiuPorCima ? -1 : 1, 0), 600, 0);
  }

  // Elementos que entram juntos aparecem em sequência (efeito cascata).
  function processarLote() {
    loteAgendado = false;
    const itens = lote.sort((a, b) => a.top - b.top || a.left - b.left);
    lote = [];
    itens.forEach((item, i) => entrar(item.el, item.deCima, Math.min(i, 5) * 90));
  }

  const observador = 'IntersectionObserver' in window && new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      const caixa = e.boundingClientRect;
      if (e.isIntersecting && !visiveis.has(e.target)) {
        lote.push({ el: e.target, top: caixa.top, left: caixa.left, deCima: caixa.top < 0 });
        if (!loteAgendado) { loteAgendado = true; requestAnimationFrame(processarLote); }
      } else if (!e.isIntersecting && visiveis.has(e.target)) {
        sair(e.target, caixa.top < 0);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  function registrarAnimacoes() {
    if (!observador || reduzMovimento) return;
    const candidatos = new Set();
    for (const sel of SELETORES) document.querySelectorAll(sel).forEach((el) => candidatos.add(el));
    for (const el of candidatos) {
      if (registrados.has(el)) continue;
      // Pula contêineres que têm outro candidato dentro: anima o mais interno.
      let temFilhoCandidato = false;
      for (const outro of candidatos) if (outro !== el && el.contains(outro)) { temFilhoCandidato = true; break; }
      if (temFilhoCandidato) continue;
      registrados.add(el);
      // Começa escondido; o observador revela o que estiver na tela.
      animar(el, quadro(el, 1, 0), quadro(el, 1, 0), 0, 0);
      observador.observe(el);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Indicador lateral de seções                                         */
  /* ------------------------------------------------------------------ */

  const CSS_INDICADOR = `
    .indicador{position:fixed;z-index:15;font-family:'Figtree',system-ui,sans-serif;pointer-events:none}
    .indicador a{pointer-events:auto}
    .ind-lista{list-style:none;margin:0;padding:0;position:relative;display:flex;flex-direction:column;gap:26px}
    .ind-trilho{position:absolute;left:6px;top:7px;bottom:7px;width:2px;border-radius:2px;background:rgba(96,165,250,0.22)}
    .ind-progresso{position:absolute;left:0;top:0;width:100%;height:0;border-radius:2px;background:linear-gradient(180deg,#93C5FD,#3B82F6)}
    .ind-item{position:relative;display:flex;align-items:center;gap:14px;text-decoration:none;color:#1F2937;outline-offset:4px}
    .ind-ponto{position:relative;flex:none;width:14px;height:14px;box-sizing:border-box;border-radius:50%;background:#fff;border:2px solid rgba(96,165,250,0.55);transition:transform .45s ${SUAVE},background .45s,border-color .45s,box-shadow .45s}
    .ind-item:hover .ind-ponto{border-color:#3B82F6}
    .ind-item[aria-current="true"] .ind-ponto{background:#3B82F6;border-color:#3B82F6;transform:scale(1.2);box-shadow:0 0 0 6px rgba(59,130,246,0.16)}
    .ind-rotulo{white-space:nowrap;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,0.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.95);box-shadow:0 8px 24px rgba(59,130,246,0.14);opacity:0;transform:translateX(-8px);transition:opacity .4s,transform .4s ${SUAVE};pointer-events:none}
    .ind-item:hover .ind-rotulo,.ind-item:focus-visible .ind-rotulo,.indicador.ativo .ind-item[aria-current="true"] .ind-rotulo{opacity:1;transform:none}
    .ind-item[aria-current="true"] .ind-rotulo{color:#3B82F6}
    .ind-tag{display:none}
    @media (min-width:1100px){
      .indicador{left:22px;top:50%;transform:translateY(-50%)}
    }
    @media (max-width:1099.98px){
      .indicador{left:0;top:0;bottom:0;width:3px}
      .ind-lista{display:none}
      .ind-trilho-movel{position:absolute;inset:0;background:rgba(96,165,250,0.18)}
      .ind-trilho-movel .ind-progresso{background:linear-gradient(180deg,#93C5FD,#3B82F6)}
      .ind-tag{display:block;position:fixed;left:7px;top:0;writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#3B82F6;padding:12px 5px;border-radius:999px;background:rgba(255,255,255,0.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.95);box-shadow:0 6px 18px rgba(59,130,246,0.18);opacity:0;transition:opacity .35s}
      .indicador.ativo .ind-tag{opacity:1}
    }
    @media (min-width:1100px){ .ind-trilho-movel{display:none} }
    @media (prefers-reduced-motion: reduce){ .indicador *{transition:none!important} }
  `;

  let indicador = null;

  function criarIndicador() {
    if (indicador) return;
    const secoes = [...document.querySelectorAll('[data-secao]')].filter((s) => s.id);
    if (secoes.length < 2) return;

    const estilo = document.createElement('style');
    estilo.textContent = CSS_INDICADOR;
    document.head.appendChild(estilo);

    const nav = document.createElement('nav');
    nav.className = 'indicador';
    nav.setAttribute('aria-label', 'Seções da página');
    nav.innerHTML = `
      <div class="ind-trilho-movel" aria-hidden="true"><div class="ind-progresso"></div></div>
      <ol class="ind-lista">
        <li aria-hidden="true" class="ind-trilho"><div class="ind-progresso"></div></li>
      </ol>
      <div class="ind-tag" aria-hidden="true"></div>`;
    const lista = nav.querySelector('.ind-lista');
    const itens = secoes.map((sec) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'ind-item';
      a.href = '#' + sec.id;
      a.innerHTML = '<span class="ind-ponto" aria-hidden="true"></span><span class="ind-rotulo"></span>';
      a.querySelector('.ind-rotulo').textContent = sec.dataset.secao;
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const alvo = document.getElementById(sec.id);
        if (!alvo) return;
        const topo = sec.id === 'inicio' ? 0 : alvo.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top: topo, behavior: reduzMovimento ? 'auto' : 'smooth' });
        history.replaceState(null, '', '#' + sec.id);
      });
      li.appendChild(a);
      lista.appendChild(li);
      return { id: sec.id, rotulo: sec.dataset.secao, a };
    });
    document.body.appendChild(nav);
    indicador = { nav, itens, atual: -1, timer: 0,
      progresso: nav.querySelector('.ind-trilho .ind-progresso'),
      progressoMovel: nav.querySelector('.ind-trilho-movel .ind-progresso'),
      tag: nav.querySelector('.ind-tag') };
    atualizarIndicador();
  }

  function mostrarRotulo() {
    const ind = indicador;
    ind.nav.classList.add('ativo');
    clearTimeout(ind.timer);
    ind.timer = setTimeout(() => ind.nav.classList.remove('ativo'), 1600);
  }

  function atualizarIndicador() {
    const ind = indicador;
    if (!ind) return;
    const vh = window.innerHeight;
    const linha = vh * 0.4;
    const secoes = ind.itens.map((it) => document.getElementById(it.id));
    if (secoes.some((s) => !s)) return;

    // Seção atual: a última cujo topo já passou de 40% da tela.
    let atual = 0;
    secoes.forEach((s, i) => { if (s.getBoundingClientRect().top <= linha) atual = i; });
    const doc = document.documentElement;
    const fimDaPagina = window.scrollY >= doc.scrollHeight - doc.clientHeight - 12;
    if (fimDaPagina) atual = secoes.length - 1;

    if (atual !== ind.atual) {
      ind.itens.forEach((it, i) => it.a.setAttribute('aria-current', i === atual ? 'true' : 'false'));
      ind.tag.textContent = ind.itens[atual].rotulo;
      ind.atual = atual;
    }

    // Trilho do computador: enche até o ponto atual e avança rumo ao próximo.
    const pontos = ind.itens.map((it) => it.a.querySelector('.ind-ponto'));
    const topoLista = ind.nav.querySelector('.ind-trilho').getBoundingClientRect().top;
    const centro = (i) => { const r = pontos[i].getBoundingClientRect(); return r.top + r.height / 2 - topoLista; };
    let altura = centro(atual);
    if (atual < secoes.length - 1 && !fimDaPagina) {
      const r = secoes[atual].getBoundingClientRect();
      const fracao = Math.min(Math.max((linha - r.top) / Math.max(r.height, 1), 0), 1);
      altura += fracao * (centro(atual + 1) - centro(atual));
    }
    ind.progresso.style.height = Math.max(altura, 0) + 'px';

    // Celular: barra fina na borda esquerda e etiqueta que desce junto.
    const maxRolagem = Math.max(doc.scrollHeight - doc.clientHeight, 1);
    const total = Math.min(window.scrollY / maxRolagem, 1);
    ind.progressoMovel.style.height = (total * 100) + '%';
    const alturaTag = ind.tag.offsetHeight || 90;
    const topoMin = 110, topoMax = vh - alturaTag - 96;
    ind.tag.style.top = (topoMin + total * Math.max(topoMax - topoMin, 0)) + 'px';
  }

  let quadroPendente = false;
  function aoRolar() {
    if (!indicador) return;
    mostrarRotulo();
    if (quadroPendente) return;
    quadroPendente = true;
    requestAnimationFrame(() => { quadroPendente = false; atualizarIndicador(); });
  }

  /* ------------------------------------------------------------------ */
  /* Inicialização                                                       */
  /* ------------------------------------------------------------------ */

  let varreduraAgendada = false;
  function varrer() {
    varreduraAgendada = false;
    registrarAnimacoes();
    criarIndicador();
    atualizarIndicador();
  }
  function agendarVarredura() {
    if (varreduraAgendada) return;
    varreduraAgendada = true;
    requestAnimationFrame(varrer);
  }

  function iniciar() {
    // O support.js renderiza a página depois; observa o DOM para pegar
    // o conteúdo inicial e o que mudar depois (ex.: troca de layout).
    new MutationObserver(agendarVarredura).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    agendarVarredura();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
