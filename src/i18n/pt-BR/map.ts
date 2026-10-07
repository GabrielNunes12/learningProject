// Brazilian Portuguese UI strings: map. Mirrors src/i18n/en/map.ts (see docs/TRANSLATING.md).
// "Ilha" is an idea not recalled yet; "bloco" is a group of ideas joined by correct links.
import type { Translation } from '../core.ts';
import type en from '../en/map.ts';

export default {
  // ---------- page ----------
  'map.notFound': 'Curso não encontrado',
  'map.allCourses': 'Todos os cursos',
  'map.eyebrow': 'Mapa do conhecimento',
  'map.unitCheckpoint': 'Ponto de controle da unidade {n}',
  'map.lead': 'Monte o mapa de memória, veja o que falta e depois ligue os pontos.',
  'map.scope.label': 'Mapa',
  'map.scope.wholeCourse': { one: 'Curso inteiro ({count} ideia)', other: 'Curso inteiro ({count} ideias)' },
  'map.scope.unit': 'Unidade {n}: {title} ({count})',
  'map.scope.empty': 'Esta unidade ainda não tem ideias no mapa do curso.',
  'map.scope.mapWhole': 'Mapear o curso inteiro',

  // ---------- courses without a concept map ----------
  'map.soon.title': 'O mapa de {course} chega em breve',
  'map.soon.lead':
    'Este curso ainda não tem mapa de conceitos. Enquanto isso, faça o mesmo no papel: cubra a lista abaixo, anote todas as ideias-chave de que você lembra e depois confira.',
  'map.soon.keyIdeas': 'As ideias-chave',
  'map.soon.backToCourse': 'Voltar ao curso',
  'map.soon.quiz': 'Teste-se com o quiz',

  // ---------- layers (stepper) ----------
  'map.layers': 'Camadas',
  'map.layer.1.title': 'O que eu já sei?',
  'map.layer.1.short': 'Lembrar',
  'map.layer.2.title': 'O que eu ainda não sei?',
  'map.layer.2.short': 'Lacunas',
  'map.layer.3.title': 'Ligue os pontos',
  'map.layer.3.short': 'Ligar',
  'map.layer.locked': '(bloqueada até você terminar a camada anterior)',

  // ---------- screen-reader announcements ----------
  'map.announce.layer': 'Camada {n}: {title}',
  'map.announce.linkedPickLabel': 'Ligação entre {a} e {b} criada. Escolha um rótulo abaixo, se quiser.',
  'map.announce.linked': 'Ligação entre {a} e {b} criada.',
  'map.announce.linkCancelled': 'Ligação cancelada.',
  'map.announce.tidied': 'Mapa organizado.',
  'map.announce.cleared': 'Tudo limpo. Comece a puxar da memória.',
  'map.announce.hint': 'Dica: {from} {label} {to}.',
  'map.announce.markedKnown': '{label}: marcada como conhecida agora.',
  'map.announce.merged': 'Juntada a {label}: conta como lembrada.',
  'map.linkingFrom': 'Ligando a partir de {label}: agora escolha uma segunda ideia.',
  'map.confirm.startOverCourse': 'Recomeçar o curso inteiro? As ideias lembradas, anotações e ligações daqui serão apagadas.',
  'map.confirm.startOverUnit': 'Recomeçar esta unidade? As ideias lembradas, anotações e ligações daqui serão apagadas.',

  // ---------- toolbar and footer ----------
  'map.view.label': 'Visualização',
  'map.view.canvas': 'Tela',
  'map.view.list': 'Lista',
  'map.zoomOut': 'Diminuir zoom',
  'map.zoomIn': 'Aumentar zoom',
  'map.fit': 'Ajustar',
  'map.tidy': 'Organizar',
  'map.saved': 'Salvo automaticamente.',
  'map.startOver': 'Recomeçar',

  // ---------- node kinds ----------
  'map.kind.recalled': 'lembrada de memória',
  'map.kind.island': 'ainda não lembrada',
  'map.kind.learned': 'aprendida depois',
  'map.kind.note': 'sua própria anotação',

  // Suggested link labels (glossary: concept-map link labels).
  'map.generic.isA': 'é um tipo de',
  'map.generic.isPartOf': 'faz parte de',
  'map.generic.needs': 'precisa de',
  'map.generic.causes': 'causa',
  'map.generic.replaces': 'substitui',
  'map.generic.isOppositeOf': 'é o oposto de',
  'map.link.linkedTo': 'tem ligação com',
  'map.link.isLinkedTo': 'tem ligação com',
  'map.noLabel': '(sem rótulo)',

  // ---------- layer 1: recall ----------
  'map.recall.intro':
    'Digite as ideias de que você lembra, uma de cada vez, e pressione Enter. Nada de espiar: tentar lembrar antes de olhar costuma fixar melhor o que você lê em seguida.',
  'map.recall.counterLabel': '{recalled} de {total} lembradas',
  'map.recall.counter': '{recalled}<rest>/ {total} lembradas</rest>',
  'map.recall.progress': 'Ideias lembradas',
  'map.recall.locked':
    'A recordação está fechada aqui porque o resto do mapa já foi revelado. Recomece para tentar de novo de memória, ou use as camadas 2 e 3.',
  'map.recall.inputLabel': 'Uma ideia de que você lembra',
  'map.recall.placeholder': 'ex.: um termo, uma regra, uma técnica',
  'map.recall.add': 'Adicionar',
  'map.recall.undo': 'Não era isso: manter minhas palavras',
  'map.recall.secondsLeft': { one: 'Falta {count} segundo', other: 'Faltam {count} segundos' },
  'map.recall.stopTimer': 'Parar o cronômetro',
  'map.recall.sprint': 'Opcional: sprint de 2 minutos',
  'map.recall.backToGaps': 'Voltar às lacunas',
  'map.recall.done': 'Acabaram as ideias: mostre o que falta',
  'map.recall.timeUp': 'Tempo! Foi um bom treino de recuperação: continue adicionando se lembrar de mais alguma, ou veja o que falta.',
  'map.recall.already': '{label} já está no seu mapa.',
  'map.recall.recalled': 'Lembrada: {label}.',
  'map.recall.recalledAll': 'Lembrada: {label}. Essas são todas as ideias daqui.',
  'map.recall.recalledRun': 'Lembrada: {label}. {count} de memória, boa sequência.',
  'map.recall.otherUnit': '{label} é da unidade {unit}. Boa lembrança: ela fica salva no mapa do curso inteiro.',
  'map.recall.dupNote': 'Você já anotou essa.',
  'map.recall.keptNote':
    '“{typed}” ficou como uma anotação sua. Se o curso chamar isso de outro nome, você pode juntá-la depois da revelação.',
  'map.recall.keptNoteInstead': '“{typed}” ficou como uma anotação sua.',
  'map.recall.msg.empty': 'Esta parte do curso ainda não tem conceitos para lembrar.',
  'map.recall.msg.all': {
    one: 'Você lembrou {count} ideia de memória. Esse é o mapa inteiro.',
    other: 'Você lembrou todas as {count} ideias de memória. Esse é o mapa inteiro.',
  },
  'map.recall.msg.none':
    'Nada veio à mente desta vez, e esse é um ponto de partida útil: estudos sugerem que tentar lembrar primeiro costuma fixar melhor a leitura seguinte.',
  'map.recall.msg.strong': {
    one: 'Você lembrou {recalled} de {count} ideia de memória. É uma ótima recordação; as poucas ilhas que restam são ganhos rápidos.',
    other: 'Você lembrou {recalled} de {count} ideias de memória. É uma ótima recordação; as poucas ilhas que restam são ganhos rápidos.',
  },
  'map.recall.msg.solid': {
    one: 'Você lembrou {recalled} de {count} ideia de memória. Uma base sólida para construir; as ilhas abaixo mostram exatamente o que ler a seguir.',
    other: 'Você lembrou {recalled} de {count} ideias de memória. Uma base sólida para construir; as ilhas abaixo mostram exatamente o que ler a seguir.',
  },
  'map.recall.msg.start': {
    one: 'Você lembrou {recalled} de {count} ideia de memória. Cada ideia que você puxou ficou um pouco mais forte, e as ilhas abaixo são sua lista de leitura.',
    other: 'Você lembrou {recalled} de {count} ideias de memória. Cada ideia que você puxou ficou um pouco mais forte, e as ilhas abaixo são sua lista de leitura.',
  },

  // ---------- layer 2: gaps ----------
  'map.gaps.recalledPct': '{pct} lembradas',
  'map.gaps.intro':
    'As ilhas tracejadas são as ideias de que você não lembrou. Abra uma para ler o que ela é, siga até a lição dela e marque quando fizer sentido.',
  'map.gaps.marked': '{learned} de {total} marcadas até agora.',
  'map.gaps.none': 'Nenhuma ilha: você lembrou de tudo nesta parte do curso.',
  'map.gaps.notesHint': 'Selecione uma anotação sua para juntá-la a uma ideia do curso, se as duas falarem da mesma coisa.',
  'map.gaps.backToConnecting': 'Voltar às ligações →',
  'map.gaps.connect': 'Ligue os pontos →',

  // ---------- layer 3: connect ----------
  'map.connect.intro':
    'Toque em uma ideia e depois em outra para ligá-las, ou arraste a partir do ponto de uma ideia. Desenhe as ligações que você saberia explicar em uma frase; ideias ligadas a outras costumam ser mais fáceis de lembrar e usar.',
  'map.connect.pickFromList': 'Ou escolha duas ideias de uma lista',
  'map.connect.from': 'De',
  'map.connect.link': 'Ligação',
  'map.connect.to': 'Para',
  'map.connect.chooseIdea': 'Escolha uma ideia',
  'map.connect.addLink': 'Adicionar ligação',
  'map.connect.check': 'Conferir meu mapa',
  'map.connect.checkAgain': 'Conferir de novo',

  // ---------- check results ----------
  'map.results.aria': 'Conferência do mapa',
  'map.results.title': 'Seu mapa x o mapa do curso',
  'map.results.found': { one: 'ligação encontrada', other: 'ligações encontradas' },
  'map.results.foundWithHint': { one: 'ligação encontrada, {withHint} com dica', other: 'ligações encontradas, {withHint} com dica' },
  'map.results.chunks': { one: 'bloco de compreensão', other: 'blocos de compreensão' },
  'map.results.ownLinks': { one: 'ligação sua', other: 'ligações suas' },
  'map.results.progress': 'Ligações do curso encontradas',
  'map.results.chunkExplain': 'Um bloco é um grupo de ideias unidas por ligações do curso, com o nome da ideia mais conectada.',
  'map.results.chunkIdeas': { one: '{count} ideia', other: '{count} ideias' },
  'map.results.extra': {
    one: '{count} ligação que você desenhou não está no mapa do curso. Ela ainda pode estar certa: o mapa do curso é a visão de um especialista, não a única.',
    other: '{count} ligações que você desenhou não estão no mapa do curso. Elas ainda podem estar certas: o mapa do curso é a visão de um especialista, não a única.',
  },
  'map.results.addToMap': 'Adicionar ao meu mapa',
  'map.results.showHint': 'Mostrar uma ligação que faltou',
  'map.results.allShown': 'Todas as ligações que faltaram estão à mostra',
  'map.results.msg.noLinks': 'O mapa do curso ainda não tem ligações dentro deste recorte, então toda ligação que você desenhar é sua.',
  'map.results.msg.none': {
    one: 'O mapa do curso liga essas ideias de {count} forma. Desenhe as ligações de que você tem certeza e confira de novo, ou peça uma dica.',
    other: 'O mapa do curso liga essas ideias de {count} formas. Desenhe algumas de que você tem certeza e confira de novo, ou peça uma dica.',
  },
  'map.results.msg.all': {
    one: 'Você encontrou {count} ligação, a única do mapa do curso. Conhecimento conectado assim costuma ser mais fácil de usar.',
    other: 'Você encontrou todas as {count} ligações do mapa do curso. Conhecimento conectado assim costuma ser mais fácil de usar.',
  },
  'map.results.msg.allWithHint': {
    one: 'Você encontrou {count} ligação, a única do mapa do curso ({withHint} com dica). Conhecimento conectado assim costuma ser mais fácil de usar.',
    other: 'Você encontrou todas as {count} ligações do mapa do curso ({withHint} com dica). Conhecimento conectado assim costuma ser mais fácil de usar.',
  },
  'map.results.msg.some': {
    one: 'Você encontrou {got} de {count} ligação do mapa do curso. Cada uma une duas ideias.',
    other: 'Você encontrou {got} de {count} ligações do mapa do curso. Cada uma une duas ideias.',
  },
  'map.results.msg.someWithHint': {
    one: 'Você encontrou {got} de {count} ligação do mapa do curso ({withHint} com dica). Cada uma une duas ideias.',
    other: 'Você encontrou {got} de {count} ligações do mapa do curso ({withHint} com dica). Cada uma une duas ideias.',
  },

  // ---------- details panels ----------
  'map.detail.selected': 'Selecionada: {label}',
  'map.detail.close': 'Fechar detalhes',
  'map.detail.taughtIn': 'Ensinada em {lesson}',
  'map.detail.learnThis': 'Aprender isto',
  'map.detail.knowNow': 'Agora eu sei',
  'map.detail.notYet': 'Ainda não, na verdade',
  'map.detail.linkFromHere': 'Ligar a partir daqui',
  'map.detail.removeFromMap': 'Tirar do meu mapa',
  'map.detail.deleteNote': 'Apagar anotação',
  'map.detail.mergeLabel': 'É a mesma ideia que um conceito do curso? Junte as duas:',
  'map.detail.chooseConcept': 'Escolha um conceito',
  'map.detail.merge': 'Juntar',
  'map.detail.mergeLater': 'Depois da revelação, você pode juntar uma anotação a um conceito do curso.',
  'map.detail.removeLinkTo': 'Remover ligação com {label}',
  'map.detail.remove': 'Remover',
  'map.detail.recalledFromMemory': 'Você lembrou desta de memória.',
  'map.detail.selectedLink': 'Ligação selecionada',
  'map.detail.linkKind': 'Ligação',
  'map.detail.label': 'Rótulo',
  'map.detail.inCourseMap': 'No mapa do curso: {from} {label} {to}.',
  'map.detail.inCourseMapHinted': 'No mapa do curso (encontrada com dica): {from} {label} {to}.',
  'map.detail.notInCourseMap': 'Não está no mapa do curso. Ainda pode estar certa: você consegue dizer como as duas se relacionam?',
  'map.detail.swap': 'Inverter direção',
  'map.detail.removeLink': 'Remover ligação',

  // ---------- legend and list view ----------
  'map.legend': 'Legenda',
  'map.legend.fromMemory': 'De memória',
  'map.legend.yourNote': 'Sua anotação',
  'map.legend.notYet': 'Ainda não',
  'map.legend.learnedSince': 'Aprendida depois',
  'map.legend.inCourseMap': 'No mapa do curso',
  'map.legend.ownLink': 'Ligação sua',
  'map.legend.hint': 'Dica',
  'map.list.ownNotes': 'Suas anotações',
  'map.list.links': 'Ligações',
  'map.list.status.found': 'no mapa do curso',
  'map.list.status.hinted': 'no mapa do curso, com dica',
  'map.list.status.extra': 'ligação sua',
  'map.list.empty': 'Nada no seu mapa ainda. Adicione a primeira ideia de que você lembra.',
  'map.list.noLinks': 'Nenhuma ligação ainda. Selecione uma ideia e depois outra.',
  'map.list.linkToThis': '(ligar a esta)',
  'map.list.startLink': '(começar uma ligação)',

  // ---------- canvas ----------
  'map.canvas.aria':
    'Tela do mapa do conhecimento. Arraste para mover, use o gesto de pinça ou role para dar zoom. As ideias são botões; as setas movem a ideia em foco. A visualização Lista mostra o mesmo mapa em listas.',
  'map.canvas.node': '{label}, {kind}',
  'map.canvas.nodeLinkTo': '{label}, {kind}. Pressione para ligar.',
  'map.canvas.nodeStartLink': '{label}, {kind}. Pressione para começar uma ligação.',
  'map.canvas.chunkTag': 'bloco',
  'map.canvas.empty': 'Seu mapa está vazio. Digite a primeira ideia de que você lembra.',
} satisfies Translation<typeof en>;
