// Brazilian Portuguese UI strings: insights. Mirrors src/i18n/en/insights.ts (see docs/TRANSLATING.md).
// The in-sentence format names (formatInline) must read naturally after "em" ("40% de acerto em caça a bugs")
// and after a colon in a title ("Formato mais fraco: caça a bugs").
// Mastery states avoid gender agreement ("com domínio", "com dificuldade") because the items can be concepts
// (masculine) or lessons (feminine).
import type { Translation } from '../core.ts';
import type en from '../en/insights.ts';

export default {
  // ---------- question formats ----------
  'insights.format.mcq': 'Múltipla escolha',
  'insights.format.numeric': 'Respostas numéricas',
  'insights.format.text': 'Respostas curtas',
  'insights.format.output': 'Preveja a saída',
  'insights.format.bug': 'Caça a bugs',
  'insights.format.order': 'Coloque em ordem',
  'insights.format.buckets': 'Separe em grupos',
  'insights.format.trace': 'Acompanhe o código',
  'insights.format.truthtable': 'Tabelas-verdade',
  'insights.format.logicgrid': 'Grades lógicas',
  'insights.format.balance': 'Desafios da balança',
  'insights.formatInline.mcq': 'múltipla escolha',
  'insights.formatInline.numeric': 'respostas numéricas',
  'insights.formatInline.text': 'respostas curtas',
  'insights.formatInline.output': 'prever a saída',
  'insights.formatInline.bug': 'caça a bugs',
  'insights.formatInline.order': 'colocar em ordem',
  'insights.formatInline.buckets': 'separar em grupos',
  'insights.formatInline.trace': 'acompanhar o código',
  'insights.formatInline.truthtable': 'tabelas-verdade',
  'insights.formatInline.logicgrid': 'grades lógicas',
  'insights.formatInline.balance': 'desafios da balança',
  'insights.formatAdvice.mcq': 'Tente responder de cabeça antes de ler as alternativas e depois escolha a que bate com a sua resposta.',
  'insights.formatAdvice.numeric': 'Estime a resposta primeiro, para que um resultado muito fora chame a atenção, e confira as unidades.',
  'insights.formatAdvice.text': 'Diga a ideia com suas palavras primeiro e depois dê o termo exato que a questão pede.',
  'insights.formatAdvice.output': 'Acompanhe o código no papel: anote cada variável depois de cada linha antes de digitar a saída.',
  'insights.formatAdvice.bug': 'Leia o erro primeiro e depois acompanhe as variáveis linha por linha para achar onde elas dão errado.',
  'insights.formatAdvice.order': 'Coloque primeiro a primeira e a última peça, depois preencha o meio.',
  'insights.formatAdvice.buckets': 'Diga a regra por trás de cada grupo antes de separar o primeiro cartão.',
  'insights.formatAdvice.trace': 'Preveja o que cada linha muda antes de avançar e depois compare.',
  'insights.formatAdvice.truthtable': 'Preencha uma coluna por vez e apoie-se nas colunas auxiliares.',
  'insights.formatAdvice.logicgrid': 'Marque o que cada pista descarta, não só o que ela confirma.',
  'insights.formatAdvice.balance': 'Junte as incógnitas de um lado primeiro e os números soltos do outro.',

  // ---------- small helpers ----------
  'insights.quoted': '“{title}”',
  'insights.list.separator': ', ',
  'insights.list.and': '{items} e {last}',
  'insights.list.more': { one: '{items} e mais {count}', other: '{items} e mais {count}' },

  // ---------- "you missed X n of the last m times" ----------
  'insights.miss.concept': {
    one: 'Você errou {name} na última vez ({misses} de {count}).',
    other: 'Você errou {name} {misses} das últimas {count} vezes.',
  },
  'insights.miss.conceptAllTime': {
    one: 'Até agora, você errou {name} {misses} de {count} vez.',
    other: 'Até agora, você errou {name} {misses} de {count} vezes.',
  },
  'insights.miss.lesson': {
    one: 'Você errou questões de “{name}” na última vez ({misses} de {count}).',
    other: 'Você errou questões de “{name}” {misses} das últimas {count} vezes.',
  },
  'insights.miss.lessonAllTime': {
    one: 'Até agora, você errou questões de “{name}” {misses} de {count} vez.',
    other: 'Até agora, você errou questões de “{name}” {misses} de {count} vezes.',
  },

  // ---------- struggle patterns ----------
  'insights.pattern.formats.title': 'Formato mais fraco: {format}',
  'insights.pattern.formats.detail': '{worst}: {worstPct} de acerto, contra {bestPct} em {best} (todas as respostas até agora).',
  'insights.pattern.forgetting.title': 'Acertou antes, errou depois',
  'insights.pattern.forgetting.detail': {
    one: '{items}: você acertou uma questão sobre isso pelo menos duas vezes e depois errou na última tentativa. É o esquecimento normal, e o sinal para revisar.',
    other: '{items}: você acertou questões sobre esses itens pelo menos duas vezes e depois errou na última tentativa. É o esquecimento normal, e o sinal para revisar.',
  },
  'insights.pattern.pileup.title': 'As revisões estão se acumulando',
  'insights.pattern.pileup.detail': { one: '{count} revisão pendente.', other: '{count} revisões pendentes.' },
  'insights.pattern.pileup.detailOldest': {
    one: '{count} revisão pendente, a mais antiga há {days}.',
    other: '{count} revisões pendentes, a mais antiga há {days}.',
  },
  'insights.pattern.skipped.title': 'Lições essenciais que você pulou',
  'insights.pattern.skipped.detail': {
    one: '{lessons} é uma lição essencial que você não abriu, embora já tenha feito lições seguintes.',
    other: '{lessons} são lições essenciais que você não abriu, embora já tenha feito lições seguintes.',
  },

  // ---------- tips ----------
  'insights.tip.clearReviews.title': {
    one: 'Faça primeiro sua {count} revisão pendente',
    other: 'Faça primeiro suas {count} revisões pendentes',
  },
  'insights.tip.clearReviews.evidence': { one: '{count} revisão pendente.', other: '{count} revisões pendentes.' },
  'insights.tip.clearReviews.evidenceOldest': {
    one: '{count} revisão pendente; a mais antiga espera há {days}.',
    other: '{count} revisões pendentes; a mais antiga espera há {days}.',
  },
  'insights.tip.clearReviews.advice':
    'Faça as revisões antes das lições novas. A revisão espaçada costuma funcionar melhor quando acontece perto da data marcada.',
  'insights.tip.weak.title': 'Retome {name}',
  'insights.tip.weak.adviceConcept':
    'Releia a lição “{lesson}” e depois faça uma prática mista curta: misturar com outras ideias ajuda a escolher a abordagem certa, não só a repeti-la.',
  'insights.tip.weak.adviceLesson': 'Refaça a lição e depois uma prática mista curta de {course}.',
  'insights.tip.forgetting.title': 'Revise {name} mais cedo',
  'insights.tip.forgetting.evidence': 'Você tinha acertado {name} pelo menos duas vezes e depois errou na última tentativa.',
  'insights.tip.forgetting.advice':
    'A prática de recuperação espalhada por vários dias costuma fazer as memórias durarem. Pratique suas questões mais fracas hoje e deixe a agenda trazê-las de volta.',
  'insights.tip.format.title': '{format}: tente outra abordagem',
  'insights.tip.format.evidence': '{worstPct} de acerto em {worst} contra {bestPct} em {best}.',
  'insights.tip.skipped.title': 'Faça a lição essencial “{lesson}”',
  'insights.tip.skipped.evidence': 'É uma lição essencial de {course} que você não abriu, embora já tenha passado dela.',
  'insights.tip.skipped.advice': 'As lições essenciais carregam a maior parte de um curso; as lições seguintes costumam se apoiar nelas.',
  'insights.tip.confirm.title': 'Confira o que você sabe com um quiz',
  'insights.tip.confirm.evidence.concepts': { one: 'Você domina {count} conceito.', other: 'Você domina {count} conceitos.' },
  'insights.tip.confirm.evidence.lessons': { one: 'Você domina {count} lição.', other: 'Você domina {count} lições.' },
  'insights.tip.confirm.evidence.topics': { one: 'Você domina {count} tópico.', other: 'Você domina {count} tópicos.' },
  'insights.tip.confirm.advice': 'Um quiz mistura questões do curso inteiro: um jeito rápido de confirmar que ficou e de achar lacunas.',
  'insights.tip.mix.title': 'Misture sua prática',
  'insights.tip.mix.evidence.concepts': {
    one: '{count} conceito ainda te pega de vez em quando.',
    other: '{count} conceitos ainda te pegam de vez em quando.',
  },
  'insights.tip.mix.evidence.lessons': {
    one: '{count} lição ainda te pega de vez em quando.',
    other: '{count} lições ainda te pegam de vez em quando.',
  },
  'insights.tip.mix.evidence.topics': {
    one: '{count} tópico ainda te pega de vez em quando.',
    other: '{count} tópicos ainda te pegam de vez em quando.',
  },
  'insights.tip.mix.evidenceNone': 'Nenhum ponto fraco se destaca agora.',
  'insights.tip.mix.advice': 'Praticar vários tópicos na mesma sessão ajuda a escolher o método certo, não só a lembrar dele.',

  // ---------- tip buttons ----------
  'insights.action.startReviews': 'Começar revisões',
  'insights.action.openLesson': 'Abrir “{lesson}”',
  'insights.action.redoLesson': 'Refazer a lição',
  'insights.action.practiseConcept': 'Praticar {concept}',
  'insights.action.mixedPractice': 'Prática mista',
  'insights.action.practiseWeakest': 'Praticar pontos fracos',
  'insights.action.openLessonPlain': 'Abrir lição',
  'insights.action.courseQuiz': 'Quiz de {course}',

  // ---------- the report page ----------
  'insights.title': 'Sua análise de aprendizado',
  'insights.subtitle': 'O que você erra, onde tem dificuldade e como melhorar.',
  'insights.subtitleCourse': 'O que você erra, onde tem dificuldade e como melhorar em {course}.',
  'insights.filter': 'Filtrar por curso',
  'insights.allCourses': 'Todos os cursos',
  'insights.notFound.title': 'Curso não encontrado',
  'insights.notFound.body': 'Não existe um curso chamado “{id}”. <link>Veja a análise de todos os seus cursos</link>.',

  'insights.noun.concepts': 'Conceitos',
  'insights.noun.lessons': 'Lições',
  'insights.noun.topics': 'Tópicos',

  'insights.state.mastered': 'Com domínio',
  'insights.state.learning': 'Em progresso',
  'insights.state.struggling': 'Com dificuldade',
  'insights.state.untested': 'Sem prática ainda',
  'insights.state.none': 'Sem questões ainda',

  // ---------- empty state ----------
  'insights.empty.title': 'Ainda falta prática',
  'insights.empty.start': 'Responda algumas questões e esta análise vai se preenchendo.',
  'insights.empty.startIn': 'Responda algumas questões de {course} e esta análise vai se preenchendo.',
  'insights.empty.answered': { one: 'Você respondeu {count} questão.', other: 'Você respondeu {count} questões.' },
  'insights.empty.answeredIn': {
    one: 'Você respondeu {count} questão de {course}.',
    other: 'Você respondeu {count} questões de {course}.',
  },
  'insights.empty.more': {
    one: 'Mais {count} resposta e esta análise fica pronta.',
    other: 'Mais {count} respostas e esta análise fica pronta.',
  },
  'insights.empty.needsAttention': '<b>Precisa de atenção:</b> conceitos que você vive errando, ordenados pelas suas respostas recentes.',
  'insights.empty.patterns':
    '<b>Padrões:</b> quais formatos de questão te pegam, o que você acertou uma vez mas esqueceu e as revisões que se acumulam.',
  'insights.empty.strengths': '<b>Pontos fortes:</b> o que você acertou três vezes seguidas.',
  'insights.empty.tips': '<b>Dicas:</b> alguns próximos passos concretos, cada um baseado nas suas próprias respostas.',
  'insights.empty.openCourse': 'Abrir o curso',
  'insights.empty.continue': 'Continuar estudando',
  'insights.empty.review': 'Revisar',

  // ---------- sections ----------
  'insights.tips.title': 'Como melhorar',
  'insights.tips.basis': 'Com base nas suas próprias respostas',
  'insights.weak.title': 'Precisa de atenção',
  'insights.weak.ranked': 'Ordenado pelos erros recentes',
  'insights.patterns.title': 'Padrões de dificuldade',
  'insights.strengths.title': 'Pontos fortes',
  'insights.strengths.count.concepts': { one: '{count} conceito dominado', other: '{count} conceitos dominados' },
  'insights.strengths.count.lessons': { one: '{count} lição dominada', other: '{count} lições dominadas' },
  'insights.strengths.count.topics': { one: '{count} tópico dominado', other: '{count} tópicos dominados' },
  'insights.strengths.more': { one: 'e mais {count}', other: 'e mais {count}' },
  'insights.strengths.none.concepts':
    'Nada dominado ainda. Um conceito conta como dominado quando você acerta três vezes seguidas cada questão que respondeu sobre ele.',
  'insights.strengths.none.lessons':
    'Nada dominado ainda. Uma lição conta como dominada quando você acerta três vezes seguidas cada questão que respondeu sobre ela.',
  'insights.strengths.none.topics':
    'Nada dominado ainda. Um tópico conta como dominado quando você acerta três vezes seguidas cada questão que respondeu sobre ele.',
  'insights.map.title': 'Domínio por curso',

  // ---------- overview tiles ----------
  'insights.window.label': { one: 'Taxa de acerto, último {count} dia', other: 'Taxa de acerto, últimos {count} dias' },
  'insights.window.detail': {
    one: 'Última tentativa em {count} questão: você acertou {right}',
    other: 'Última tentativa em {count} questões: você acertou {right}',
  },
  'insights.window.empty': 'Nenhuma resposta neste período',
  'insights.counts.mastered': { one: '<b>{count}</b> com domínio', other: '<b>{count}</b> com domínio' },
  'insights.counts.learning': { one: '<b>{count}</b> em progresso', other: '<b>{count}</b> em progresso' },
  'insights.counts.struggling': { one: '<b>{count}</b> com dificuldade', other: '<b>{count}</b> com dificuldade' },
  'insights.counts.untested': { one: '{count} sem prática ainda', other: '{count} sem prática ainda' },
  'insights.due.label': 'Revisões pendentes',
  'insights.due.oldest': { one: 'A mais antiga espera há {count} dia', other: 'A mais antiga espera há {count} dias' },
  'insights.due.today': 'Para hoje',
  'insights.due.none': 'Tudo em dia',

  // ---------- needs attention ----------
  'insights.weak.nothing': 'Nada se destaca agora.',
  'insights.weak.thin.concepts': {
    one: '{count} conceito tem menos de {min} respostas, então ainda é cedo para dizer.',
    other: '{count} conceitos têm menos de {min} respostas, então ainda é cedo para dizer.',
  },
  'insights.weak.thin.lessons': {
    one: '{count} lição tem menos de {min} respostas, então ainda é cedo para dizer.',
    other: '{count} lições têm menos de {min} respostas, então ainda é cedo para dizer.',
  },
  'insights.weak.thin.topics': {
    one: '{count} tópico tem menos de {min} respostas, então ainda é cedo para dizer.',
    other: '{count} tópicos têm menos de {min} respostas, então ainda é cedo para dizer.',
  },
  'insights.weak.lesson': 'Lição “{title}”',
  'insights.weak.lastToday': 'última resposta hoje',
  'insights.weak.lastYesterday': 'última resposta ontem',
  'insights.weak.lastDaysAgo': { one: 'última resposta há {count} dia', other: 'última resposta há {count} dias' },
  'insights.weak.due': { one: '{count} pendente', other: '{count} pendentes' },
  'insights.weak.practise': 'Praticar',
  'insights.weak.practiseLabel': 'Praticar {name} com ideias relacionadas',
  'insights.weak.more': { one: 'e mais {count} nas visões por curso abaixo', other: 'e mais {count} nas visões por curso abaixo' },

  // ---------- sparkline ----------
  'insights.spark.empty': 'sem histórico',
  'insights.spark.right': 'acerto',
  'insights.spark.wrong': 'erro',
  'insights.spark.guessed': 'chute',
  'insights.spark.label': {
    one: 'Última {count} resposta, da mais antiga para a mais recente: {results}',
    other: 'Últimas {count} respostas, da mais antiga para a mais recente: {results}',
  },
  'insights.spark.point': 'Resposta {index} de {total}: {result} (últimas 3: {pct} de acerto)',

  // ---------- patterns ----------
  'insights.types.title': 'Taxa de acerto por formato de questão',
  'insights.types.tip': '{format}: você acertou {right} de {total}',
  'insights.types.row': 'Você acertou {right} de {total} ({pct})',
  'insights.types.needMore': 'Cada formato precisa de {min} respostas antes de aparecer aqui.',
  'insights.types.hidden': {
    one: '{count} formato com menos de {min} respostas ficou de fora. Todas as respostas até agora contam.',
    other: '{count} formatos com menos de {min} respostas ficaram de fora. Todas as respostas até agora contam.',
  },
  'insights.patterns.none':
    'Nenhum padrão claro ainda: nenhuma diferença entre formatos, nada esquecido, revisões sob controle e nenhuma lição essencial pulada.',

  // ---------- mastery map ----------
  'insights.chip.noQuestions': 'Ainda sem questões de prática',
  'insights.chip.untested': { one: '{count} questão, sem prática ainda', other: '{count} questões, sem prática ainda' },
  'insights.chip.score': 'Acertos: {right}/{total}',
  'insights.chip.scoreThin': 'Acertos: {right}/{total} (poucas respostas para avaliar)',
  'insights.chip.scoreRecent': 'Acertos: {right}/{total}; últimas {count}: {pct}',
  'insights.chip.scoreRecentThin': 'Acertos: {right}/{total}; últimas {count}: {pct} (poucas respostas para avaliar)',
  'insights.chip.label': '{name}: {state}. {detail}',
  'insights.legend': 'Legenda',
  'insights.course.masteredConcepts': {
    one: '{mastered} de {count} conceito dominado',
    other: '{mastered} de {count} conceitos dominados',
  },
  'insights.course.masteredLessons': {
    one: '{mastered} de {count} lição dominada · agrupado por lição até este curso ter um mapa de conceitos',
    other: '{mastered} de {count} lições dominadas · agrupado por lição até este curso ter um mapa de conceitos',
  },
  'insights.course.focus': 'Focar',

  // ---------- Home card ----------
  'insights.teaser.weak': '{miss} Veja como melhorar.',
  'insights.teaser.mastered.concepts': {
    one: '{count} conceito dominado. Veja o que praticar a seguir.',
    other: '{count} conceitos dominados. Veja o que praticar a seguir.',
  },
  'insights.teaser.mastered.lessons': {
    one: '{count} lição dominada. Veja o que praticar a seguir.',
    other: '{count} lições dominadas. Veja o que praticar a seguir.',
  },
  'insights.teaser.mastered.topics': {
    one: '{count} tópico dominado. Veja o que praticar a seguir.',
    other: '{count} tópicos dominados. Veja o que praticar a seguir.',
  },
  'insights.teaser.default': 'Veja o que você erra, onde tem dificuldade e como melhorar.',

  // ---------- charts (Home, Review, Profile) ----------
  'insights.chart.goal': 'meta {goal}',
  'insights.chart.xpTip': '{day}: {count} XP',
  'insights.chart.xpLabel': 'XP ganho nos últimos 7 dias',
  'insights.chart.tomorrow': 'Amanhã',
  'insights.chart.dueTip': { one: '{day}: {count} pendente', other: '{day}: {count} pendentes' },
  'insights.chart.reviews': { one: '{count} revisão', other: '{count} revisões' },
  'insights.chart.forecastLabel': 'Revisões pendentes nos próximos 7 dias',
  'insights.box.1': 'Reaprendendo',
  'insights.box.2': 'Nova',
  'insights.box.3': 'Familiar',
  'insights.box.4': 'Firme',
  'insights.box.5': 'Forte',
  'insights.box.6': 'Dominada',
  'insights.chart.strengthLabel': 'Questões por força da memória',
  'insights.chart.strengthTip': { one: '{box}: {count} questão', other: '{box}: {count} questões' },
  'insights.chart.heatmapLabel': {
    one: 'Atividade nas últimas {weeks} semanas: {count} dia ativo',
    other: 'Atividade nas últimas {weeks} semanas: {count} dias ativos',
  },
  'insights.chart.activeDays': { one: '{count} dia ativo', other: '{count} dias ativos' },
  'insights.chart.less': 'Menos',
  'insights.chart.more': 'Mais',
} satisfies Translation<typeof en>;
