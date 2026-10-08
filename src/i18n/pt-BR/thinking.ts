// Brazilian Portuguese UI strings: thinking. Mirrors src/i18n/en/thinking.ts (see docs/TRANSLATING.md).
// Phase names come from the glossary: Erre primeiro / Encurte / Refaça. "Clean sheet" is "folha a limpo"
// (as in "passar a limpo"); a redo of a sheet is a "reconstrução".
import type { Translation } from '../core.ts';
import type en from '../en/thinking.ts';

export default {
  // ---------- the three phases ----------
  'thinking.phase.wrong': 'Erre primeiro',
  'thinking.phase.shorter': 'Encurte',
  'thinking.phase.again': 'Refaça',

  // ---------- missing-step messages ----------
  'thinking.missing.wrongKeywords': {
    one: 'Adicione mais {count} palavra-chave. As incertas também contam.',
    other: 'Adicione mais {count} palavras-chave. As incertas também contam.',
  },
  'thinking.missing.wrongPiles': {
    one: 'Separe-as em {count} pilha: arraste as palavras-chave para baixo, até as colunas.',
    other: 'Separe-as em {count} pilhas: arraste as palavras-chave para baixo, até as colunas.',
  },
  'thinking.missing.anchorTooLong': {
    one: 'Cada âncora tem no máximo {count} palavra.',
    other: 'Cada âncora tem no máximo {count} palavras.',
  },
  'thinking.missing.moreAnchors': { one: 'Escreva mais {count} âncora.', other: 'Escreva mais {count} âncoras.' },
  'thinking.missing.recall': {
    one: 'Primeiro, escreva mais {count} palavra-chave de memória.',
    other: 'Primeiro, escreva mais {count} palavras-chave de memória.',
  },

  // ---------- sheet titles for review/practice/quiz sessions ----------
  'thinking.session.review': 'Revisão',
  'thinking.session.reviewCourse': 'Revisão: {course}',
  'thinking.session.practice': 'Prática mista',
  'thinking.session.practiceCourse': 'Prática mista: {course}',
  'thinking.session.quiz': 'Quiz',
  'thinking.session.quizCourse': 'Quiz: {course}',

  // ---------- make it wrong (end of a lesson, after the steps) ----------
  'thinking.wrong.heading': 'O que ficou de “{topic}”?',
  'thinking.wrong.lead': 'Escreva de memória palavras-chave no papel, sem voltar à lição: o que você aprendeu, lembranças pela metade, até aquelas de que você não tem certeza. Depois separe-as em pilhas do que anda junto. Nada aqui vale nota; errar um pouco agora mostra o que corrigir.',
  'thinking.wrong.sheetLabel': 'Suas palavras-chave sobre {topic}',
  'thinking.wrong.ready': 'Boa. {time} no papel.',
  'thinking.wrong.start': 'Continuar',

  // ---------- make it shorter (end of a session) ----------
  'thinking.shorter.placeholder': 'poucas palavras',
  'thinking.shorter.placeholderOptional': 'terceira âncora (opcional)',
  'thinking.shorter.anchorLabel': {
    one: 'Âncora {n}, no máximo {count} palavra',
    other: 'Âncora {n}, no máximo {count} palavras',
  },
  'thinking.shorter.wordCount': { one: '{n}/{count} palavra', other: '{n}/{count} palavras' },
  'thinking.shorter.hitHeading': 'Suas âncoras citam',
  'thinking.shorter.ownWords': 'Suas âncoras estão nas suas próprias palavras, e tudo bem: elas só precisam trazer a ideia de volta para você.',
  'thinking.shorter.missedHeading': 'Por trás das questões que você errou',
  'thinking.shorter.alsoHeading': 'Também nesta lição',
  'thinking.shorter.notMistake': 'Não é um erro: vale mais uma olhada antes de seguir em frente.',
  'thinking.shorter.beforeHeading': 'Logo antes, você escreveu',
  'thinking.shorter.firstGuesses': 'Suas palavras-chave',
  'thinking.shorter.rebuildNext': 'Você vai refazer esta folha de memória no início da próxima sessão e corrigir o que estiver errado.',
  'thinking.shorter.ready': 'Curto o bastante. Bagunçado não tem problema.',
  'thinking.shorter.squeeze': 'Condensar',

  // ---------- make it again (start of a later session) ----------
  'thinking.again.heading': 'Refaça “{title}” de memória',
  'thinking.again.lead':
    'Papel em branco, sem espiar. Escreva as palavras-chave e âncoras de que você lembra daquela folha e organize-as do jeito que elas se ligam agora. Puxar tudo de volta da memória é o que faz fixar.',
  'thinking.again.sheetLabel': 'Refazendo {title} de memória',
  'thinking.again.compareHeading': 'Compare e passe a limpo',
  'thinking.again.compareLead':
    'Aqui está sua folha antiga. Mantenha o que continua valendo, corrija o que estava errado e descarte o que não importa. Sua versão a limpo substitui a antiga.',
  'thinking.again.oldSheet': 'Sua folha antiga',
  'thinking.again.verdictHeading': 'Manter, corrigir ou descartar',
  'thinking.again.anchorTag': 'âncora',
  'thinking.again.remembered': 'lembrada',
  'thinking.again.verdictGroup': 'O que fazer com {item}',
  'thinking.again.keep': 'Manter',
  'thinking.again.fix': 'Corrigir',
  'thinking.again.drop': 'Descartar',
  'thinking.again.fixLabel': 'Versão corrigida de {item}',
  'thinking.again.cleanSheet': 'Sua folha a limpo',
  'thinking.again.cleanNote': 'O que você escreveu de memória. Reorganize, acrescente o que acabou de corrigir e desenhe como tudo se liga.',
  'thinking.again.savedHeading': 'Folha a limpo salva',
  'thinking.again.tileRemembered': 'Lembradas',
  'thinking.again.tileFixed': 'Corrigidas',
  'thinking.again.tileXp': 'XP',
  'thinking.again.nextRedo': {
    one: 'Próxima reconstrução desta folha em {count} dia. A cada vez, o intervalo aumenta.',
    other: 'Próxima reconstrução desta folha em {count} dias. A cada vez, o intervalo aumenta.',
  },
  'thinking.again.recalled': { one: '{count} palavra-chave de memória.', other: '{count} palavras-chave de memória.' },
  'thinking.again.broughtBack': 'Você trouxe de volta {got} de {total}.',
  'thinking.again.compare': 'Comparar com minha folha antiga',
  'thinking.again.save': 'Salvar a folha a limpo',

  // ---------- the sheet of paper ----------
  'thinking.paper.placeholder': 'Digite uma palavra-chave e pressione Enter',
  'thinking.paper.tools': 'Ferramentas da folha',
  'thinking.paper.tool': 'Ferramenta',
  'thinking.paper.keywords': 'Palavras',
  'thinking.paper.pen': 'Caneta',
  'thinking.paper.undoInk': 'Desfazer traço',
  'thinking.paper.addPile': '+ Pilha',
  'thinking.paper.count': { one: '{n}/{count} palavra-chave', other: '{n}/{count} palavras-chave' },
  'thinking.paper.pile': 'Pilha {n}',
  'thinking.paper.pileInline': 'pilha {n}',
  'thinking.paper.pilePlaceholder': 'Pilha {n}: dê um nome',
  'thinking.paper.pileNameLabel': 'Nome da pilha {n}',
  'thinking.paper.trayLabel': 'as palavras-chave novas chegam aqui; arraste-as para baixo, até uma pilha',
  'thinking.paper.chipInPile': '{text}, na pilha: {pile}',
  'thinking.paper.chipInTray': '{text}, ainda não separada',
  'thinking.paper.chipInPileFixed': '{text}, na pilha: {pile}, corrigida de {old}',
  'thinking.paper.chipInTrayFixed': '{text}, ainda não separada, corrigida de {old}',
  'thinking.paper.was': 'Antes: {old}',
  'thinking.paper.empty': 'Papel vazio. Comece com qualquer palavra que vier à cabeça.',
  'thinking.paper.moveGroup': 'Mover “{text}”',
  'thinking.paper.moveTo': 'Mover {text} para',
  'thinking.paper.tray': 'Bandeja',
  'thinking.paper.remove': 'Remover',
  'thinking.paper.newKeyword': 'Nova palavra-chave',
  'thinking.paper.add': 'Adicionar',
  'thinking.paper.hint':
    'Arraste uma palavra-chave para uma pilha, ou toque nela e escolha. Pelo teclado: foque uma palavra-chave, pressione 1–{max} para separá-la e Delete para removê-la.',

  // ---------- the Notebook page ----------
  'thinking.notebook.title': 'Caderno',
  'thinking.notebook.subtitle': 'Todas as folhas em que você pensou: suas palavras-chave, suas âncoras e as versões a limpo que você refez de memória.',
  'thinking.notebook.streak': 'Sequência de reflexão',
  'thinking.notebook.daysThisWeek': '{days} dos últimos 7 dias',
  'thinking.notebook.recall': 'Recuperado de memória',
  'thinking.notebook.redos': { one: '{count} reconstrução', other: '{count} reconstruções' },
  'thinking.notebook.due': { one: '{count} pendente', other: '{count} pendentes' },
  'thinking.notebook.methodHeading': 'Como funciona cada sessão',
  'thinking.notebook.methodWrong': '<b>{phase}.</b> Depois dos passos, coloque no papel as palavras-chave de que você se lembra e organize-as em pilhas, mesmo que algumas estejam erradas.',
  'thinking.notebook.methodShorter': '<b>{phase}.</b> Depois de cada sessão, condense tudo em 2–3 âncoras de no máximo quatro palavras.',
  'thinking.notebook.methodAgain':
    '<b>{phase}.</b> Na sessão seguinte, refaça uma folha antiga a partir de uma página em branco, depois corrija e reorganize. O intervalo aumenta a cada vez.',
  'thinking.notebook.empty': 'Nenhuma folha ainda. Sua primeira lição começa com uma.',
  'thinking.notebook.pickLesson': 'Escolher uma lição',
  'thinking.notebook.sessionAnchors': 'Âncoras da sessão',
  'thinking.notebook.rebuilt': 'refeita {count}×, da última vez {remembered}/{total} de memória',
  'thinking.notebook.firstDraft': 'primeiro rascunho',
  'thinking.notebook.nextRedoNow': 'próxima reconstrução: agora',
  'thinking.notebook.nextRedoToday': 'próxima reconstrução: mais tarde hoje',
  'thinking.notebook.nextRedoTomorrow': 'próxima reconstrução: amanhã',
  'thinking.notebook.nextRedoDays': {
    one: 'próxima reconstrução em {count} dia',
    other: 'próxima reconstrução em {count} dias',
  },
  'thinking.notebook.cleanSheetFor': 'Folha a limpo de {title}',
  'thinking.notebook.firstDraftFor': 'Primeiro rascunho de {title}',
  'thinking.notebook.showSheet': 'Mostrar folha',
  'thinking.notebook.hideSheet': 'Ocultar folha',

  // ---------- Home teaser card ----------
  'thinking.teaser.eyebrow': 'Pensar no papel',
  'thinking.teaser.due': {
    one: '{count} folha pronta para refazer de memória. Sua próxima sessão começa com ela.',
    other: '{count} folhas prontas para refazer de memória. Sua próxima sessão começa com uma delas.',
  },
  'thinking.teaser.streak': { one: 'Sequência de reflexão: {count} dia.', other: 'Sequência de reflexão: {count} dias.' },
  'thinking.teaser.sheets': { one: '{count} folha no seu caderno.', other: '{count} folhas no seu caderno.' },
} satisfies Translation<typeof en>;
