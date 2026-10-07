// Brazilian Portuguese UI strings: roadmap. Mirrors src/i18n/en/roadmap.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/roadmap.ts';

export default {
  'roadmap.title': 'Trilhas',
  'roadmap.subtitle': 'As trilhas encadeiam cursos rumo a um objetivo. Siga as linhas em ordem — ou pule para onde quiser: nada fica bloqueado.',
  'roadmap.unavailable': 'As trilhas não estão disponíveis agora.',
  'roadmap.unavailableHelp': 'Não foi possível carregá-las. Enquanto isso, todos os cursos continuam abertos na página <link>Cursos</link>.',
  'roadmap.tracks': 'Trilhas',
  'roadmap.trackComplete': 'Trilha {track}: {pct} concluída',
  'roadmap.trackProgress': { one: '{pct} · {done}/{total} curso', other: '{pct} · {done}/{total} cursos' },
  'roadmap.allDone': { one: 'Trilha concluída — o curso foi finalizado.', other: 'Trilha concluída — todos os {count} cursos finalizados.' },
  'roadmap.someDone': { one: '{done} de {count} curso concluído', other: '{done} de {count} cursos concluídos' },
  'roadmap.someDoneNext': {
    one: '{done} de {count} curso concluído · Próximo: {course}',
    other: '{done} de {count} cursos concluídos · Próximo: {course}',
  },
  'roadmap.continueCourse': 'Continuar {course} →',
  'roadmap.startCourse': 'Começar {course} →',
  'roadmap.mapLabel': 'Mapa da trilha {track}',
  'roadmap.legend': 'Legenda',

  // Course status pills (a course: masculine).
  'roadmap.status.done': 'Concluído',
  'roadmap.status.inProgress': 'Cursando',
  'roadmap.status.upNext': 'A seguir',
  'roadmap.status.later': 'Depois',
  'roadmap.legend.done': 'lições essenciais concluídas',
  'roadmap.legend.inProgress': 'iniciado',
  'roadmap.legend.upNext': 'pronto para começar',
  'roadmap.legend.later': 'depois dos pré-requisitos',
  'roadmap.legend.solid': 'a partir de um curso concluído',
  'roadmap.legend.dashed': 'ainda por fazer',

  'roadmap.nodeLabel': {
    one: '{course}: {status}, {done} de {count} lição concluída',
    other: '{course}: {status}, {done} de {count} lições concluídas',
  },
  'roadmap.nodeLabelAfter': {
    one: '{course}: {status}, {done} de {count} lição concluída. Depois de {after}',
    other: '{course}: {status}, {done} de {count} lições concluídas. Depois de {after}',
  },
  'roadmap.nodeCount': '{done}/{total} lições',

  'roadmap.closeDetails': 'Fechar detalhes',
  'roadmap.after': 'Depois de {list}',
  'roadmap.core': 'Essenciais {done}/{total}',
  'roadmap.lessonsMastered': { one: '{done}/{count} lição · {pct} de domínio', other: '{done}/{count} lições · {pct} de domínio' },
  'roadmap.coreLessonsLabel': 'Lições essenciais de {course}',
  'roadmap.continueLesson': 'Continuar: {lesson}',
  'roadmap.startLesson': 'Começar: {lesson}',
  'roadmap.allDoneQuiz': 'Tudo concluído — faça o quiz',
  'roadmap.openCourse': 'Abrir o curso',
  'roadmap.inside': 'O que tem no curso',
  'roadmap.lessonDone': '(concluída)',
  'roadmap.lessonNotDone': '(não concluída)',
  'roadmap.coreLesson': 'Lição essencial',

  'roadmap.teaser.next': 'Próximo na trilha {track}: {course}',
  'roadmap.teaser.finished': 'Você concluiu a trilha {track}. Escolha outra!',
  'roadmap.teaser.cta': 'Ver o mapa →',
} satisfies Translation<typeof en>;
