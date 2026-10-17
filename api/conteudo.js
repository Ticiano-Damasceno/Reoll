import { createHash, timingSafeEqual } from 'node:crypto';

function compararSenhas(recebida, esperada) {
  // Produz valores de tamanho fixo para a comparação.
  const hash = valor =>
    createHash('sha256').update(valor, 'utf8').digest();

  return timingSafeEqual(hash(recebida), hash(esperada));
}

export default function handler(req, res) {
  // Impede o armazenamento da resposta em caches.
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  const tipo = req.headers['content-type'] || '';

  if (!tipo.toLowerCase().startsWith('application/json')) {
    return res.status(415).json({ erro: 'Formato inválido.' });
  }

  const senhaEsperada = process.env.REOLL_PASSWORD;
  const conteudo = process.env.REOLL_CONTENT;

  if (!senhaEsperada || !conteudo) {
    return res.status(500).json({ erro: 'Serviço indisponível.' });
  }

  const senha = req.body?.senha;

  if (
    typeof senha !== 'string' ||
    senha.length > 256 ||
    !compararSenhas(senha, senhaEsperada)
  ) {
    return res.status(401).json({ erro: 'Acesso negado.' });
  }

  try {
    const dados = JSON.parse(conteudo);

    const valido =
      dados !== null &&
      Array.isArray(dados.arquivos) &&
      dados.arquivos.length > 0 &&
      dados.arquivos.every(arquivo =>
        arquivo !== null &&
        typeof arquivo.nome === 'string' &&
        arquivo.nome.trim().length > 0 &&
        Array.isArray(arquivo.mensagens) &&
        arquivo.mensagens.every(mensagem =>
          mensagem !== null &&
          typeof mensagem.autor === 'string' &&
          typeof mensagem.texto === 'string'
        )
      );

    if (!valido) {
      throw new Error('Conteúdo inválido');
    }

    return res.status(200).json({
      arquivos: dados.arquivos
    });
  } catch {
    return res.status(500).json({
      erro: 'Serviço indisponível.'
    });
  }
}