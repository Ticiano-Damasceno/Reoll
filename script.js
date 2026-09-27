// SENHA DE ACESSO: altere o valor de ACCESS_CODE abaixo.
// Os textos da página ficam no index.html.

const ACCESS_CODE = 'elementos'; // Troque pela senha desejada. Em site estático, ela é visível no código-fonte.
const gate = document.getElementById('gate');
const password = document.getElementById('password');
const statusMessage = document.getElementById('status');
const archive = document.getElementById('archive');
const negadoTitulo = document.getElementById('negado-titulo');
const alertaIntruso = document.getElementById('alerta-intruso');

let tempoConexao;
let tempoAlerta;

function limparTemporizadores() {
  clearTimeout(tempoConexao);
  clearTimeout(tempoAlerta);
}

function fecharJanela() {
  limparTemporizadores();

  document.body.classList.remove('unlocked');
  archive.classList.remove('conectando', 'negado');
  archive.setAttribute('aria-busy', 'false');

  definirLateral(false);
  statusMessage.hidden = true;
  password.value = '';
  password.focus();
  alertaIntruso.hidden = true;
}

gate.addEventListener('submit', event => {
  event.preventDefault();
  limparTemporizadores();

  const senhaCorreta = password.value === ACCESS_CODE;

  // Abre a mesma janela e mostra a conexão.
  archive.classList.remove('negado');
  archive.classList.add('conectando');
  archive.setAttribute('aria-busy', 'true');

  statusMessage.hidden = true;
  password.value = '';

  document.body.classList.add('unlocked');
  archive.querySelector('.conexao').focus();

  tempoConexao = setTimeout(() => {
    if (senhaCorreta) {
      archive.classList.remove('conectando');
      archive.setAttribute('aria-busy', 'false');
      archive.querySelector('.chat-sidebar h2').focus();
      return;
    }

    // Senha incorreta: primeiro aviso.
    negadoTitulo.textContent = 'ACESSO NEGADO';
    archive.classList.add('negado');
    archive.classList.remove('conectando');
    archive.setAttribute('aria-busy', 'false');
    negadoTitulo.focus();

    // Segundo aviso.
    tempoAlerta = setTimeout(() => {
      alertaIntruso.hidden = false;

      // 1,2 segundo de espera + 2,8 segundos de alerta = 4 segundos.
      tempoAlerta = setTimeout(fecharJanela, 2800);
    }, 1200);

  }, 2800);
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

const efeitosMonitor = document.querySelector('.efeitos-monitor');
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

      // const largura = Math.min(
      //   efeitosMonitor.clientWidth,
      //   150 + Math.random() * 250
      // );

      // const altura = 30 + Math.random() * 50;

      // // Resolução reduzida para criar pixels maiores.
      // ruido.width = Math.ceil(largura / 2);
      // ruido.height = Math.ceil(altura / 2);

      // ruido.style.width = `${largura}px`;
      // ruido.style.height = `${altura}px`;

      // ruido.style.left = `${Math.random() * Math.max(0, efeitosMonitor.clientWidth - largura)
      //   }px`;

      // ruido.style.top = `${Math.random() * Math.max(0, efeitosMonitor.clientHeight - altura)
      //   }px`;


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

if (efeitosMonitor) {
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