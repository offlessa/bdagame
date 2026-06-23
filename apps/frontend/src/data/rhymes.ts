import { RhymeOption, AttributeKey } from '../types/game';

// Pool de rimas por atributo principal
// Em cada rodada, 4 opções são geradas: 1 fraca, 1 ok, 1 boa, 1 perfeita

const POOL: Record<AttributeKey, { fraca: string[]; ok: string[]; boa: string[]; perfeita: string[] }> = {
  flow: {
    fraca: [
      'Hmm... tipo... não sei bem...',
      'Fico aqui pensando no que falar.',
      'A rima veio mas não encaixou.',
    ],
    ok: [
      'Meu flow corre na veia, não para não.',
      'Aqui no mic eu não sou de brincadeira.',
      'Rimo fácil, não preciso nem pensar.',
    ],
    boa: [
      'Cada sílaba no beat como bala na câmara.',
      'Flow que escorrega mas não escapa — armadilha de palavras.',
      'Ritmo de rio, não tem como parar essa maré.',
    ],
    perfeita: [
      'Nasci no acorde e vivo no compasso — cada pausa minha é um verso que o beat não esperava.',
      'Meu flow é corrente elétrica, chega antes do trovão — você ouviu a rima mas ainda não sentiu o choque.',
      'Não copio o ritmo, eu sou o ritmo — você batalha comigo ou batalha com o próprio tempo.',
    ],
  },
  tecnica: {
    fraca: [
      'Tô tentando achar a rima aqui...',
      'As palavras não tão saindo hoje.',
      'Deixa eu pensar... hmmm.',
    ],
    ok: [
      'Rimo com técnica, cada verso é calculado.',
      'Construí minha lírica tijolo por tijolo.',
      'Não erro a métrica, treino todo dia.',
    ],
    boa: [
      'Decassílabo, redondilha — escolho o molde e preencho com fogo.',
      'Cada verso uma camada, cada estrofe uma estrutura que não cai.',
      'Técnica não é limitação — é o esqueleto que faz a rima ficar de pé.',
    ],
    perfeita: [
      'Rima interna, externa, encadeada — arquitetura lírica que poucos constroem.',
      'Doze anos de craft: não improviso, orquestro. Cada palavra tem passaporte nessa estrofe.',
      'Você ouviu um verso, eu construí um sistema. A diferença entre nós é estrutura.',
    ],
  },
  frieza: {
    fraca: [
      'Tô nervoso... esqueci o que ia falar.',
      'Ai, a plateia tá me olhando...',
      'Espera aí que eu me confundi.',
    ],
    ok: [
      'Mantenho a calma no palco, não subo o tom.',
      'Frieza é minha arma, não me abalo fácil.',
      'Pode me pressionar, não vou tremer.',
    ],
    boa: [
      'Você gritou, eu baixei o tom — quem domina o silêncio domina a roda.',
      'Pressão gera diamante: quanto mais você aperta, melhor eu fico.',
      'Minha frieza não é vazio — é controle. Tem diferença.',
    ],
    perfeita: [
      'Olha nos meus olhos enquanto desfaço o que você construiu — sem pressa, sem raiva, sem erro.',
      'Você apostou na intensidade, eu apostei no tempo. Adivinhe quem ganhou.',
      'Tempestade passa, pedra fica. Sou a pedra nessa batalha.',
    ],
  },
  inteligencia: {
    fraca: [
      'É... não pensei bem nisso não.',
      'Tava com preguiça de estudar a letra.',
      'Deixa eu tentar de novo...',
    ],
    ok: [
      'Trouxe referência no verso, aprende aí.',
      'Minha lírica tem conteúdo, não é vazio.',
      'Penso antes de falar, diferente de você.',
    ],
    boa: [
      'Citei três filósofos no último verso — você reconheceu algum?',
      'Contexto histórico no flow: minha rima tem raiz, não nasce no ar.',
      'Enquanto você rimou palavras, eu rimei conceitos.',
    ],
    perfeita: [
      'A profundidade do que eu disse só vai chegar amanhã de manhã quando você acordar pensando nisso.',
      'Referência cruzada, análise crítica e ironia em quatro versos — academia de rima.',
      'Você trouxe ataque, eu trouxei argumento. No fim, a razão é mais afiada que insulto.',
    ],
  },
  presenca: {
    fraca: [
      'Oi pessoal... estou aqui...',
      'Hmm, a galera não tá muito animada.',
      'Deixa eu tentar chamar atenção aqui...',
    ],
    ok: [
      'A plateia tá do meu lado, sinto energia.',
      'Presença de palco não se aprende, se nasce.',
      'Quando eu entro, o ambiente muda.',
    ],
    boa: [
      'Não preciso gritar — todo mundo já tá me ouvindo.',
      'Três segundos de silêncio e a roda inteira tá na palma da minha mão.',
      'Carismo não é volume — é gravidade. E vocês estão orbitando.',
    ],
    perfeita: [
      'Entrei na batalha e a energia do lugar mudou — você sentiu também, não foi?',
      'Não sou o mais técnico nem o mais rápido. Mas quando falo, todo mundo para. Sempre.',
      'Minha presença é um instrumento. Eu toco a emoção do público como se fosse um beat.',
    ],
  },
  punchline: {
    fraca: [
      'Pensei numa rima boa mas esqueci.',
      'Tava tentando ser engraçado mas não saiu.',
      'Essa foi fraca, eu sei.',
    ],
    ok: [
      'Essa punchline chegou e foi embora rápido.',
      'Deixei a goteira cair no momento certo.',
      'Simples, direto, no alvo.',
    ],
    boa: [
      'Você riu, você chorou — emoção dupla numa frase só.',
      'Demorou dois segundos pra cair — é quando a punchline é boa de verdade.',
      'Não anunciei, não preparei — simplesmente cheguei e derrubei.',
    ],
    perfeita: [
      'Plantei a semente no primeiro verso e você nem viu — a punchline no final foi a colheita.',
      'Aquela pausa antes da última palavra? Era o silêncio que você ia sentir depois.',
      'Nem precisa explicar punchline boa. Você já entendeu. Tá escrito no seu rosto.',
    ],
  },
};

let _seq = 0;
function uid() { return `rh-${++_seq}`; }

export function generateOptions(primaryAttr: AttributeKey): RhymeOption[] {
  function pick(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
  const pool = POOL[primaryAttr];

  // Sempre 1 de cada qualidade — ordem embaralhada
  const options: RhymeOption[] = [
    { id: uid(), text: pick(pool.fraca),   quality: 'fraca',   primaryAttr },
    { id: uid(), text: pick(pool.ok),      quality: 'ok',      primaryAttr },
    { id: uid(), text: pick(pool.boa),     quality: 'boa',     primaryAttr },
    { id: uid(), text: pick(pool.perfeita),quality: 'perfeita',primaryAttr },
  ];

  // Embaralha
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}
