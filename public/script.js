const gate = document.getElementById('gate');
const password = document.getElementById('password');
const statusMessage = document.getElementById('status');
const archive = document.getElementById('archive');
const negadoTitulo = document.getElementById('negado-titulo');

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

  statusMessage.hidden = true;
  password.value = '';
  password.focus();
}

gate.addEventListener('submit', async event => {
  event.preventDefault();

  // Evita iniciar outra solicitação enquanto a janela está aberta.
  if (document.body.classList.contains('unlocked')) return;

  limparTemporizadores();

  const senhaDigitada = password.value;
  const inicio = performance.now();

  password.value = '';
  statusMessage.hidden = true;

  document.querySelector('.chat-messages').replaceChildren();

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

    // Mantém a animação de conexão por pelo menos 2,8 segundos.
    const espera = Math.max(0, 2800 - (performance.now() - inicio));

    tempoConexao = setTimeout(() => {
      archive.classList.remove('conectando');
      archive.setAttribute('aria-busy', 'false');

      if (resposta.ok) {
        mostrarMensagens(dados.mensagens);
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

  // Distribui pequenos riscos por toda a largura.
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

    // Espaços irregulares entre os riscos.
    x += comprimento + 3 + Math.floor(Math.random() * 16);
  }

  ctx.globalAlpha = 1;
}

function criarInterferencia() {
  const duracao = 1000 + Math.random() * 500;

  if (!document.hidden) {
    const quantidade = 2 + Math.floor(Math.random() * 2);

    // Cerca de 35% das interferências também fazem o fundo tremer.
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

    // 35% das vezes: faixas que atravessam a tela.
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

      // Distribui os chiados em regiões diferentes da tela.
      const alturaRegiao = alturaTela / quantidade;
      const posicao = alturaRegiao * (i + 0.2 + Math.random() * 0.6);

      ruido.style.top = `${Math.max(
        0,
        Math.min(posicao, alturaTela - altura)
      )}px`;

      // A textura muda durante toda a interferência.
      const atualizarTextura = setInterval(() => {
        desenharRuido(ruido);
      }, 90);

      setTimeout(() => {
        clearInterval(atualizarTextura);
        ruido.remove();
      }, duracao);
    }
  }

  // Após terminar, espera entre 1 e 5 segundos.
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

    // Intervalo aleatório entre 200 e 600 milissegundos.
    const intervalo = 200 + Math.random() * 400;

    tempoMensagem = setTimeout(() => {
      if (!document.body.classList.contains('unlocked')) return;

      const mensagem = mensagens[indice];

      // Só acompanha a mensagem se o usuário estiver perto do fim.
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