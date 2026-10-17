import { createHash, timingSafeEqual } from 'node:crypto';

function compararSenhas(recebida, esperada) {
  const hash = valor =>
    createHash('sha256').update(valor, 'utf8').digest();

  return timingSafeEqual(hash(recebida), hash(esperada));
}

function objetoValido(valor) {
  return valor !== null &&
    typeof valor === 'object' &&
    !Array.isArray(valor);
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      erro: 'Método não permitido.'
    });
  }

  const tipo = req.headers['content-type'] || '';

  if (!tipo.toLowerCase().startsWith('application/json')) {
    return res.status(415).json({
      erro: 'Formato inválido.'
    });
  }

  const senhaEsperada = process.env.REOLL_PASSWORD;
  const senha = req.body?.senha;

  if (!senhaEsperada) {
    return res.status(500).json({
      erro: 'Serviço indisponível.'
    });
  }

  if (
    typeof senha !== 'string' ||
    senha.length > 256 ||
    !compararSenhas(senha, senhaEsperada)
  ) {
    return res.status(401).json({
      erro: 'Acesso negado.'
    });
  }

  // A senha já foi validada para as duas operações abaixo.
  try {
    if (req.body?.codigo !== undefined) {
      const recebido = req.body.codigo;

      if (typeof recebido !== 'string') {
        return res.status(400).json({
          erro: 'Código inválido.'
        });
      }

      const codigo = recebido.trim().toUpperCase();

      if (!/^[A-Z0-9_-]{1,40}$/.test(codigo)) {
        return res.status(400).json({
          erro: 'Código inválido.'
        });
      }

      const personagens = JSON.parse(
        process.env.REOLL_PERSONAGENS || ''
      );

      if (!objetoValido(personagens)) {
        throw new Error('Configuração inválida');
      }

      if (!Object.hasOwn(personagens, codigo)) {
        return res.status(404).json({
          erro: 'Nenhum registro encontrado.'
        });
      }

      const personagem = personagens[codigo];

      const campos = [
        'nome',
        'nomeArtistico',
        'nivel',
        'altura',
        'idade',
        'elemento',
        'dnaUsado',
        'imagem'
      ];

      const valido =
        objetoValido(personagem) &&
        campos.every(campo =>
          typeof personagem[campo] === 'string' &&
          personagem[campo].trim().length > 0
        );

      if (!valido) {
        throw new Error('Ficha inválida');
      }

      // Neste projeto, os retratos ficam em /personagens/.
      if (
        !/^\/personagens\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i
          .test(personagem.imagem)
      ) {
        throw new Error('Caminho de imagem inválido');
      }

      const ficha = { codigo };

      for (const campo of campos) {
        ficha[campo] = personagem[campo];
      }

      return res.status(200).json({
        personagem: ficha
      });
    }

    // Sem código: retorna os arquivos do chat.
    const dados = JSON.parse(
      process.env.REOLL_CONTENT || ''
    );

    if (!objetoValido(dados)) {
      throw new Error('Conteúdo inválido');
    }

    const arquivos = Object.entries(dados).map(
      ([nome, mensagens]) => ({ nome, mensagens })
    );

    const valido =
      arquivos.length > 0 &&
      arquivos.every(arquivo =>
        arquivo.nome.trim().length > 0 &&
        Array.isArray(arquivo.mensagens) &&
        arquivo.mensagens.every(mensagem =>
          objetoValido(mensagem) &&
          typeof mensagem.autor === 'string' &&
          typeof mensagem.texto === 'string'
        )
      );

    if (!valido) {
      throw new Error('Arquivos inválidos');
    }

    return res.status(200).json({ arquivos });
  } catch {
    return res.status(500).json({
      erro: 'Serviço indisponível. Confira a configuração dos registros.'
    });
  }
}