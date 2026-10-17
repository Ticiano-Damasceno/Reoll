const gate = document.getElementById('gate');
const password = document.getElementById('password');
const statusMessage = document.getElementById('status');
const archive = document.getElementById('archive');
const negadoTitulo = document.getElementById('negado-titulo');
const listaArquivos = document.getElementById('lista-arquivos');
const arquivoAtual = document.getElementById('arquivo-atual');

let senhaSessao = '';
let buscaController;
let tempoMensagem;
let tempoConexao;
let tempoAlerta;

function limparTemporizadores() {
  clearTimeout(tempoConexao);
  clearTimeout(tempoAlerta);
  clearTimeout(tempoMensagem);
}

function fecharJanela() {
  limparTemporizadores();

  document.body.classList.remove('unlocked');
  archive.classList.remove('conectando', 'negado');
  archive.setAttribute('aria-busy', 'false');

  document.querySelector('.chat-messages').replaceChildren();

  definirLateral(false);
  definirTelaCheia(false);
  archive.style.removeProperty('animation');

  senhaSessao = '';
  fecharBusca();

  listaArquivos.replaceChildren();
  arquivoAtual.textContent = 'SELECIONE UM ARQUIVO';

  statusMessage.hidden = true;
  password.value = '';
  password.focus();

}

gate.addEventListener('submit', async event => {
  event.preventDefault();

  if (document.body.classList.contains('unlocked')) return;

  limparTemporizadores();

  const senhaDigitada = password.value;
  const inicio = performance.now();

  password.value = '';
  statusMessage.hidden = true;

  document.querySelector('.chat-messages').replaceChildren();
  listaArquivos.replaceChildren();
  arquivoAtual.textContent = 'SELECIONE UM ARQUIVO';

  archive.classList.remove('negado');
  archive.classList.add('conectando');
  archive.setAttribute('aria-busy', 'true');

  document.body.classList.add('unlocked');
  archive.querySelector('.conexao').focus();

  try {
    const resposta = await fetch('/api/conteudo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify({ senha: senhaDigitada })
    });

    if (!resposta.ok && resposta.status !== 401) {
      throw new Error('Falha ao consultar o servidor');
    }

    const dados = resposta.ok ? await resposta.json() : null;

    if (
      resposta.ok &&
      (!dados || !Array.isArray(dados.arquivos) ||
        dados.arquivos.length === 0)
    ) {
      throw new Error('Lista de arquivos inválida');
    }

    const espera = Math.max(
      0,
      2800 - (performance.now() - inicio)
    );

    tempoConexao = setTimeout(() => {
      archive.classList.remove('conectando');
      archive.setAttribute('aria-busy', 'false');

      if (resposta.ok) {
        senhaSessao = senhaDigitada;

        mostrarArquivos(dados.arquivos);
        archive.querySelector('.chat-sidebar h2').focus();
        return;
      }

      negadoTitulo.textContent = 'ACESSO NEGADO';
      archive.classList.add('negado');
      negadoTitulo.focus();

      tempoAlerta = setTimeout(fecharJanela, 4000);
    }, espera);

  } catch {
    fecharJanela();

    statusMessage.textContent =
      'FALHA NA CONEXÃO. TENTE NOVAMENTE.';

    statusMessage.hidden = false;
  }
});

document.getElementById('lock').addEventListener('click', fecharJanela);

const botaoLateral = document.getElementById('toggle-sidebar');

function definirLateral(minimizada) {
  archive.classList.toggle('lateral-minimizada', minimizada);

  botaoLateral.textContent = minimizada ? '»' : '«';
  botaoLateral.setAttribute('aria-expanded', String(!minimizada));
  botaoLateral.setAttribute(
    'aria-label',
    minimizada ? 'Expandir faixa lateral' : 'Recolher faixa lateral'
  );
}

botaoLateral.addEventListener('click', () => {
  definirLateral(
    !archive.classList.contains('lateral-minimizada')
  );
});

const ruidosFundo = document.querySelector('.ruidos-fundo');

function desenharRuido(canvas) {
  const ctx = canvas.getContext('2d');
  const largura = canvas.width;
  const altura = canvas.height;

  const cores = ['#8fd6a3', '#b794f6', '#8055b5', '#d3d7d4'];

  ctx.clearRect(0, 0, largura, altura);

  for (let x = 0; x < largura;) {
    const comprimento = 4 + Math.floor(Math.random() * 35);
    const y = Math.floor(Math.random() * altura);

    ctx.fillStyle = cores[Math.floor(Math.random() * cores.length)];
    ctx.globalAlpha = 0.4 + Math.random() * 0.5;

    ctx.fillRect(
      x,
      y,
      comprimento,
      Math.random() < 0.8 ? 1 : 2
    );

    x += comprimento + 3 + Math.floor(Math.random() * 16);
  }

  ctx.globalAlpha = 1;
}

function criarInterferencia() {
  const duracao = 1000 + Math.random() * 500;

  if (!document.hidden) {
    const quantidade = 2 + Math.floor(Math.random() * 2);

    const tremerFundo = Math.random() < 0.85;

    if (tremerFundo) {
      document.body.style.setProperty(
        '--duracao-chiado',
        `${duracao}ms`
      );

      document.body.classList.add('interferencia-forte');

      setTimeout(() => {
        document.body.classList.remove('interferencia-forte');
      }, duracao);
    }

    const faixaCompleta = Math.random() < 0.35;

    for (let i = 0; i < quantidade; i++) {
      const ruido = document.createElement('canvas');
      ruido.className = 'ruido-monitor';
      ruido.setAttribute('aria-hidden', 'true');

      const larguraTela = ruidosFundo.clientWidth;
      const alturaTela = ruidosFundo.clientHeight;

      const largura = faixaCompleta
        ? larguraTela
        : Math.min(larguraTela, 120 + Math.random() * 280);

      const altura = faixaCompleta
        ? 10 + Math.random() * 14
        : 20 + Math.random() * 35;

      ruido.width = Math.max(1, Math.ceil(largura / 2));
      ruido.height = Math.ceil(altura / 2);

      ruido.style.width = `${largura}px`;
      ruido.style.height = `${altura}px`;

      ruido.style.left = faixaCompleta
        ? '0'
        : `${Math.random() * Math.max(0, larguraTela - largura)}px`;

      ruidosFundo.appendChild(ruido);
      desenharRuido(ruido);

      const alturaRegiao = alturaTela / quantidade;
      const posicao = alturaRegiao * (i + 0.2 + Math.random() * 0.6);

      ruido.style.top = `${Math.max(
        0,
        Math.min(posicao, alturaTela - altura)
      )}px`;

      const atualizarTextura = setInterval(() => {
        desenharRuido(ruido);
      }, 90);

      setTimeout(() => {
        clearInterval(atualizarTextura);
        ruido.remove();
      }, duracao);
    }
  }

  setTimeout(
    criarInterferencia,
    duracao + 1000 + Math.random() * 4000
  );
}

if (ruidosFundo) {
  criarInterferencia();
}

const botaoExpandir = document.getElementById('toggle-expandir');

function definirTelaCheia(ativa) {
  archive.style.animation = 'none';
  archive.classList.toggle('tela-cheia', ativa);

  botaoExpandir.textContent = ativa ? '❐' : '⛶';

  const descricao = ativa
    ? 'Restaurar tamanho'
    : 'Expandir chat';

  botaoExpandir.setAttribute('aria-label', descricao);
  botaoExpandir.setAttribute('aria-pressed', String(ativa));
  botaoExpandir.title = descricao;
}

botaoExpandir.addEventListener('click', () => {
  definirTelaCheia(
    !archive.classList.contains('tela-cheia')
  );
});

function mostrarMensagens(mensagens) {
  clearTimeout(tempoMensagem);

  const area = document.querySelector('.chat-messages');
  area.replaceChildren();
  area.scrollTop = 0;

  let indice = 0;

  function agendarMensagem() {
    if (indice >= mensagens.length) return;

    const intervalo = 200 + Math.random() * 400;

    tempoMensagem = setTimeout(() => {
      if (!document.body.classList.contains('unlocked')) return;

      const mensagem = mensagens[indice];

      const acompanhar =
        area.scrollHeight - area.scrollTop - area.clientHeight < 60;

      const bloco = document.createElement('div');
      bloco.className = 'chat-message';

      const autor = document.createElement('span');
      autor.className = 'chat-author';
      autor.textContent = mensagem.autor;

      const texto = document.createElement('p');
      texto.textContent = mensagem.texto;

      bloco.append(autor, texto);
      area.appendChild(bloco);

      if (acompanhar) {
        area.scrollTop = area.scrollHeight;
      }

      indice++;
      agendarMensagem();
    }, intervalo);
  }

  agendarMensagem();
}

function mostrarArquivos(arquivos) {
  limparAreaChat();
  listaArquivos.replaceChildren();

  for (const arquivo of arquivos) {
    const botao = document.createElement('button');

    botao.type = 'button';
    botao.className = 'arquivo-item';
    botao.textContent = arquivo.nome;
    botao.title = arquivo.nome;
    botao.setAttribute('aria-pressed', 'false');

    botao.addEventListener('click', () => {
      // Verifica antes de limpar a seleção.
      const jaEstavaAberto = botao.classList.contains('ativo');

      limparAreaChat();

      // Clicar novamente no mesmo arquivo apenas o fecha.
      if (jaEstavaAberto) return;

      botao.classList.add('ativo');
      botao.setAttribute('aria-pressed', 'true');

      arquivoAtual.textContent = arquivo.nome;
      mostrarMensagens(arquivo.mensagens);
    });

    listaArquivos.appendChild(botao);
  }
}

const botaoConsulta = document.getElementById('abrir-consulta');
const painelBusca = document.getElementById('busca-personagem');
const formPersonagem = document.getElementById('form-personagem');
const campoCodigo = document.getElementById('codigo-personagem');
const consultaStatus = document.getElementById('consulta-status');
const resultadoPersonagem = document.getElementById('resultado-personagem');
const botaoBuscar = formPersonagem.querySelector('[type="submit"]');
const areaMensagens = document.querySelector('.chat-messages');

// Converte o conteúdo digitado ou colado para maiúsculas.
campoCodigo.addEventListener('input', () => {
  campoCodigo.value = campoCodigo.value
    .toUpperCase()
    .replace(/\s/g, '');
});

function fecharBusca() {
  buscaController?.abort();
  buscaController = null;

  painelBusca.classList.remove(
    'consultando',
    'exibindo-resultado'
  );

  painelBusca.hidden = true;
  painelBusca.setAttribute('aria-busy', 'false');

  animacaoConsulta.hidden = true;
  terminalLinhas.replaceChildren();
  progressoConsulta.value = 0;

  areaMensagens.hidden = false;

  botaoConsulta.setAttribute('aria-pressed', 'false');
  botaoBuscar.disabled = false;

  formPersonagem.reset();
  consultaStatus.textContent = '';
  resultadoPersonagem.replaceChildren();
}

botaoConsulta.addEventListener('click', () => {
  clearTimeout(tempoMensagem);
  fecharBusca();

  areaMensagens.replaceChildren();
  areaMensagens.hidden = true;
  painelBusca.hidden = false;

  arquivoAtual.textContent = 'CONSULTA DE REGISTRO';
  botaoConsulta.setAttribute('aria-pressed', 'true');

  for (const botao of listaArquivos.children) {
    botao.classList.remove('ativo');
    botao.setAttribute('aria-pressed', 'false');
  }

  campoCodigo.focus();
});

function mostrarFicha(personagem) {
  const ficha = document.createElement('article');
  ficha.className = 'personagem-ficha';

  const imagem = document.createElement('img');
  imagem.src = personagem.imagem;
  imagem.alt = `Retrato de ${personagem.nomeArtistico}`;
  imagem.width = 112;
  imagem.height = 112;

  const avisoFoto = document.createElement('p');
  avisoFoto.className = 'personagem-foto-aviso';
  avisoFoto.textContent = 'RETRATO INDISPONÍVEL';
  avisoFoto.hidden = true;

  imagem.addEventListener('error', () => {
    imagem.hidden = true;
    avisoFoto.hidden = false;
  });

  const titulo = document.createElement('h3');
  titulo.textContent = personagem.nomeArtistico;

  const dados = document.createElement('dl');
  dados.className = 'personagem-dados';

  const campos = [
    ['Nome completo', personagem.nome],
    ['Código', personagem.codigo],
    ['Nível', personagem.nivel],
    ['Altura', personagem.altura],
    ['Idade', personagem.idade],
    ['Elemento', personagem.elemento],
    ['DNA usado', personagem.dnaUsado]
  ];

  for (const [rotulo, valor] of campos) {
    const linha = document.createElement('div');

    const termo = document.createElement('dt');
    termo.textContent = rotulo;

    const descricao = document.createElement('dd');
    descricao.textContent = valor;

    linha.append(termo, descricao);
    dados.appendChild(linha);
  }

  ficha.append(imagem, avisoFoto, titulo, dados);
  abrirResultado(ficha);
}

formPersonagem.addEventListener('submit', async event => {
  event.preventDefault();

  if (botaoBuscar.disabled) return;

  const codigo = campoCodigo.value.trim().toUpperCase();

  if (!/^[A-Z0-9_-]{1,40}$/.test(codigo)) {
    consultaStatus.textContent = 'CÓDIGO INVÁLIDO.';
    return;
  }

  buscaController?.abort();

  const controller = new AbortController();
  buscaController = controller;

  botaoBuscar.disabled = true;
  painelBusca.setAttribute('aria-busy', 'true');
  painelBusca.classList.remove('exibindo-resultado');
  painelBusca.classList.add('consultando');

  consultaStatus.textContent = '';
  resultadoPersonagem.replaceChildren();
  painelBusca.scrollTop = 0;

  try {
    // A consulta acontece enquanto a animação está sendo exibida.
    // O erro é capturado aqui para não gerar rejeição sem tratamento
    // enquanto aguardamos a animação terminar.
    const consulta = fetch('/api/conteudo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({
        senha: senhaSessao,
        codigo
      })
    })
      .then(async resposta => ({
        resposta,
        dados: await resposta.json()
      }))
      .catch(erro => ({ erro }));

    await animarConsulta(controller.signal);

    // Se a API demorar mais que a animação, continua aguardando.
    const retorno = await consulta;

    if (controller.signal.aborted) return;

    if (retorno.erro) {
      throw retorno.erro;
    }

    const { resposta, dados } = retorno;

    if (!resposta.ok) {
      mostrarAvisoConsulta(
        resposta.status === 401
          ? 'ACESSO NÃO AUTORIZADO. SAIA E ENTRE NOVAMENTE.'
          : dados.erro || 'NÃO FOI POSSÍVEL CONSULTAR.'
      );

      return;
    }

    mostrarFicha(dados.personagem);
  } catch (erro) {
    if (
      controller.signal.aborted ||
      erro.name === 'AbortError'
    ) {
      return;
    }

    mostrarAvisoConsulta(
      'FALHA NA CONSULTA. FECHE ESTA TELA E TENTE NOVAMENTE.'
    );
  } finally {
    if (buscaController === controller) {
      buscaController = null;
      botaoBuscar.disabled = false;
      painelBusca.setAttribute('aria-busy', 'false');
    }
  }
});

const animacaoConsulta = document.getElementById('animacao-consulta');
const terminalInicializacao = document.getElementById('terminal-inicializacao');
const terminalLinhas = document.getElementById('terminal-linhas');
const conexaoRemota = document.getElementById('conexao-remota');
const progressoConsulta = document.getElementById('progresso-consulta');

// Espera que pode ser cancelada ao trocar de tela.
function esperarConsulta(ms, signal) {
  return new Promise((resolve, reject) => {
    function cancelar() {
      clearTimeout(timer);
      reject(new DOMException('Consulta cancelada', 'AbortError'));
    }

    if (signal.aborted) {
      reject(new DOMException('Consulta cancelada', 'AbortError'));
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancelar);
      resolve();
    }, ms);

    signal.addEventListener('abort', cancelar, { once: true });
  });
}

async function animarConsulta(signal) {
  animacaoConsulta.hidden = false;
  terminalInicializacao.hidden = false;
  conexaoRemota.hidden = true;
  terminalLinhas.replaceChildren();
  progressoConsulta.value = 0;

  const linhas = [
    '> REOLL SYSTEM / REMOTE ACCESS',
    '> Inicializando terminal...',
    '> Carregando protocolo de comunicação...',
    '> Localizando servidor de registros...',
    '> Terminal pronto. Iniciando conexão.'
  ];

  // Primeira etapa: entre 1 e 2 segundos.
  const duracaoTerminal = 1000 + Math.random() * 1000;

  for (const texto of linhas) {
    const linha = document.createElement('p');
    linha.textContent = texto;
    terminalLinhas.appendChild(linha);

    await esperarConsulta(
      duracaoTerminal / linhas.length,
      signal
    );
  }

  terminalInicializacao.hidden = true;
  conexaoRemota.hidden = false;

  // Segunda etapa: entre 3 e 4 segundos.
  const duracaoConexao = 3000 + Math.random() * 1000;
  const inicio = performance.now();

  let progresso = 0;

  while (true) {
    const restante =
      duracaoConexao - 100 - (performance.now() - inicio);

    if (restante <= 0) break;

    await esperarConsulta(
      Math.min(180 + Math.random() * 170, restante),
      signal
    );

    // Incrementos irregulares, sem ultrapassar 95% nesta etapa.
    progresso = Math.min(
      95,
      progresso + (100 - progresso) * (0.1 + Math.random() * 0.15)
    );

    progressoConsulta.value = Math.floor(progresso);
  }

  progressoConsulta.value = 100;
  await esperarConsulta(100, signal);
}

// Retorna da ficha para o formulário de consulta.
function voltarConsulta() {
  fecharBusca();

  areaMensagens.hidden = true;
  painelBusca.hidden = false;

  arquivoAtual.textContent = 'CONSULTA DE REGISTRO';
  botaoConsulta.setAttribute('aria-pressed', 'true');

  campoCodigo.focus();
}

// Mostra uma ficha ou aviso ocupando toda a área de mensagens.
function abrirResultado(conteudo) {
  animacaoConsulta.hidden = true;
  painelBusca.classList.remove('consultando');
  painelBusca.classList.add('exibindo-resultado');

  const barra = document.createElement('div');
  barra.className = 'resultado-barra';

  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.className = 'resultado-fechar';
  fechar.textContent = '×';
  fechar.title = 'Voltar à consulta';
  fechar.setAttribute('aria-label', 'Fechar resultado e voltar à consulta');
  fechar.addEventListener('click', voltarConsulta);

  barra.appendChild(fechar);
  resultadoPersonagem.replaceChildren(barra, conteudo);

  fechar.focus();
}

function mostrarAvisoConsulta(mensagem) {
  const aviso = document.createElement('article');
  aviso.className = 'personagem-ficha consulta-aviso';

  const texto = document.createElement('p');
  texto.textContent = mensagem;

  aviso.appendChild(texto);
  abrirResultado(aviso);
}

function limparAreaChat() {
  // Interrompe a sequência de mensagens e qualquer busca.
  clearTimeout(tempoMensagem);
  fecharBusca();

  areaMensagens.replaceChildren();
  areaMensagens.scrollTop = 0;
  arquivoAtual.textContent = '';

  for (const botao of listaArquivos.children) {
    botao.classList.remove('ativo');
    botao.setAttribute('aria-pressed', 'false');
  }
}