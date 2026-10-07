// Brazilian Portuguese UI strings: course. Mirrors src/i18n/en/course.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/course.ts';

export default {
  'course.allCourses': '← Todos os cursos',
  'course.categoryLevel': '{category} · {level}',
  'course.continue': 'Continuar →',
  'course.startLearning': 'Começar a aprender →',
  'course.takeQuiz': 'Fazer o quiz',
  'course.testOut': 'Teste o que já sabe com o quiz',
  'course.unit': 'Unidade {number}',
  'course.lessonMeta': { one: '{minutes} min · {count} etapa', other: '{minutes} min · {count} etapas' },
  'course.lessonMetaDone': { one: '{minutes} min · {count} etapa · concluída', other: '{minutes} min · {count} etapas · concluída' },

  // "Caminho", not "trilha": "Trilhas" is the Roadmap page.
  'course.path.title': 'Caminho de aprendizado',
  'course.path.view': 'Visualização',
  'course.path.map': 'Mapa',
  'course.path.list': 'Lista',
  'course.path.fastTrack': 'Modo rápido: só o essencial',
  'course.path.fastTrackNote': {
    one: 'Mostrando a {count} lição essencial (~{minutes} min) que cobre quase tudo o que você vai usar.',
    other: 'Mostrando as {count} lições essenciais (~{minutes} min) que cobrem quase tudo o que você vai usar.',
  },
  'course.path.node': 'Lição {number}: {title}',
  'course.path.nodeDone': 'Lição {number}: {title}, concluída',
  'course.path.nodeNext': 'Lição {number}: {title}, a próxima',
  'course.path.nodeDeep': 'Lição {number}: {title}, aprofundamento',
  'course.path.nodeDeepDone': 'Lição {number}: {title}, aprofundamento, concluída',
  'course.path.nodeDeepNext': 'Lição {number}: {title}, aprofundamento, a próxima',
  'course.path.completed': '✓ Concluída',
  'course.path.review': 'Revisar',
  'course.path.unitCount': '{done}/{total}<sr> lições concluídas</sr>',

  'course.side.lessonsCompleted': 'Lições concluídas',
  'course.side.coreLessons': '<b>{done}/{total}</b> lições essenciais',
  'course.side.mastered': '<b>{pct}</b> de domínio',
  'course.side.bestQuiz': '<b>{score}</b> no melhor quiz',
  'course.side.mastery': 'Domínio',
  'course.side.masteredNote': 'Dominada = lembrada em várias revisões espaçadas.',
  'course.keyIdeas': 'Os 20% que importam',

  'course.links.quiz': 'Quiz',
  'course.links.quizHelp': { one: '{count} questão mista — encontre suas lacunas', other: '{count} questões mistas — encontre suas lacunas' },
  'course.links.map': 'Mapa do conhecimento',
  'course.links.mapProgress': '{recalled}/{total} ideias lembradas até agora — continue mapeando',
  'course.links.mapStart': 'Mapeie de memória o que você sabe e depois ligue os pontos',
  'course.links.mapRecall': 'Relembre de memória as ideias-chave',
  'course.links.review': 'Revisar este curso',
  'course.links.reviewHelp': 'Pratique o que está pendente em {title}',
  'course.links.cheatSheet': 'Resumo',
  'course.links.cheatSheetHelp': 'O curso inteiro em uma página para imprimir',

  'course.cheatSheet.back': '← {title}',
  'course.cheatSheet.print': 'Imprimir / salvar em PDF',
  'course.cheatSheet.title': '{title} — resumo',
  'course.cheatSheet.intro': 'Experimente primeiro: cubra a página e explique cada ideia em voz alta. Onde você travar é o que precisa revisar.',
  'course.cheatSheet.keyIdeas': 'Ideias-chave',
} satisfies Translation<typeof en>;
