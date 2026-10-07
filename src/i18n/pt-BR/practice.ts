// Brazilian Portuguese UI strings: practice. Mirrors src/i18n/en/practice.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/practice.ts';

export default {
  'practice.title': 'Prática mista',
  'practice.titleCourse': 'Prática mista: {course}',
  'practice.intro':
    'A prática mista intercala ideias relacionadas em vez de treinar um tema de cada vez. Costuma parecer mais difícil enquanto você pratica, mas estudos sugerem que ela ajuda a distinguir ideias parecidas e a lembrar delas por mais tempo.',
  'practice.status.weak': 'Fraco',
  'practice.status.due': 'Pendente',
  'practice.status.new': 'Novo',
  'practice.status.strong': 'Forte',
  'practice.notFound': 'Curso não encontrado',
  'practice.mixAll': 'Misturar todos os meus cursos',
  'practice.focus': 'Foco em <b>{label}</b> e nas ideias ligadas a esse conceito.',
  'practice.focusFallback': 'Esse conceito ainda não tem questões suficientes que você já viu, então esta sessão mistura o curso inteiro.',
  'practice.yourMix': 'Sua mistura',
  'practice.ideas': { one: '{count} ideia', other: '{count} ideias' },
  'practice.ideasAria': 'Ideias nesta sessão',
  'practice.lessonsAria': 'Lições nesta sessão',
  'practice.from': 'Cursos: {courses}',
  'practice.byLesson': 'Estas questões estão misturadas por lição: este curso ainda não tem um mapa de conceitos.',
  'practice.whyThese': 'Por que estas?',
  'practice.defaultReason': 'Faz parte do que você aprendeu até agora',
  'practice.lengthAria': 'Duração da sessão',
  'practice.length': 'Tamanho',
  'practice.onlyQualify': { one: 'Só {count} questão está disponível agora', other: 'Só {count} questões estão disponíveis agora' },
  'practice.aboutMin': 'cerca de {count} min',
  'practice.start': 'Começar a prática mista',
  'practice.mixAllInstead': 'Misturar todos os meus cursos',
  'practice.orOneCourse': 'Ou pratique um curso:',

  // ---------- not available yet ----------
  'practice.empty.recentTitle': 'Você acabou de praticar tudo',
  'practice.empty.recentLead':
    'As questões que você acertou nos últimos 10 minutos ficam de fora por um tempo, para que a próxima rodada seja recordação de verdade, e não repetição. Tente de novo em alguns minutos ou aprenda algo novo.',
  'practice.empty.lockedTitle': {
    one: 'A prática mista é liberada depois de {count} lição',
    other: 'A prática mista é liberada depois de {count} lições',
  },
  'practice.empty.lockedLead': {
    one: 'Para misturar, você precisa de algumas ideias para distinguir. Até agora você fez {count} lição.',
    other: 'Para misturar, você precisa de algumas ideias para distinguir. Até agora você fez {count} lições.',
  },
  'practice.empty.lockedLeadCourse': {
    one: 'Para misturar, você precisa de algumas ideias para distinguir. Até agora você fez {count} lição em {course}.',
    other: 'Para misturar, você precisa de algumas ideias para distinguir. Até agora você fez {count} lições em {course}.',
  },
  'practice.empty.nextLesson': 'Próxima lição: {title}',

  // ---------- results ----------
  'practice.end.title': 'Prática mista concluída',
  'practice.end.leadIdeas': {
    one: '{right} de {total} certas em {count} ideia.',
    other: '{right} de {total} certas em {count} ideias.',
  },
  'practice.end.leadLessons': {
    one: '{right} de {total} certas em {count} lição.',
    other: '{right} de {total} certas em {count} lições.',
  },
  'practice.end.xp': 'XP ganho',
  'practice.end.right': 'Acertos',
  'practice.end.resultsAria': 'Resultados por ideia',
  'practice.end.reviewLesson': 'Revisar a lição: {title}',
  'practice.end.solid': 'Sólido',
  'practice.end.note': 'Os erros voltam na sua fila de Revisão; os acertos esperam mais.',
  'practice.end.backToCourse': 'Voltar ao curso',
  'practice.end.again': 'De novo',

  // ---------- card on the Review page ----------
  'practice.card.title': 'Misture ideias relacionadas',
  'practice.card.ready': 'Questões de lições diferentes lado a lado, com mais peso nos seus pontos fracos, para você aprender a distinguir ideias parecidas.',
  'practice.card.locked': {
    one: 'Liberada depois de {count} lição: para misturar, você precisa de algumas ideias para distinguir.',
    other: 'Liberada depois de {count} lições: para misturar, você precisa de algumas ideias para distinguir.',
  },
  'practice.card.howItWorks': 'Veja como funciona',

  // ---------- why a topic is in the mix (src/lib/interleave.ts) ----------
  'practice.reason.due': 'Pendente de revisão',
  'practice.reason.missed': 'Você errou da última vez',
  'practice.reason.new': 'De uma lição que você fez e não praticou desde então',
  'practice.reason.weakSpot': 'Ponto fraco',
  'practice.reason.slipping': 'Escapando: você errou a última tentativa ({right} de {seen} respostas recentes certas)',
  'practice.reason.weak': 'Ponto fraco: {right} de {seen} respostas recentes certas',
  'practice.reason.strong': 'Você já domina isto: entra na mistura para dar contraste e confiança',
  'practice.reason.focus': 'O conceito que você escolheu praticar',
  'practice.reason.related': 'Ligado a {label}: “{sentence}”',
  'practice.reason.relatedCross': 'Ligado a {label} em outro curso: “{sentence}”',
  'practice.linkSentence': '{from} {link} {to}',
} satisfies Translation<typeof en>;
