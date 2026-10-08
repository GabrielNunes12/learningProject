// Brazilian Portuguese UI strings: quiz. Mirrors src/i18n/en/quiz.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/quiz.ts';

export default {
  'quiz.noQuestions': 'Este curso ainda não tem questões.',
  'quiz.back': '← Voltar',
  'quiz.ritualTitle': 'Quiz: {title}',

  'quiz.end.xpEarned': 'XP ganho',
  'quiz.end.xpGain': '+{xp}',
  'quiz.end.toStudy': 'Para estudar',
  'quiz.end.solid': 'Sólidas',
  'quiz.end.studyThese': 'Estude estas',
  'quiz.end.solidTitle': 'Tudo certo aqui — pode pular estas',
  'quiz.end.reviewNote': 'As questões que você errou voltam na sua fila de Revisão.',
  'quiz.level.eyebrow': 'Seu nível',
  'quiz.level.startAt': 'Comece em “{lesson}”',
  'quiz.level.stoppedLead': { one: 'Você respondeu {count} lição com convicção e depois começou a chutar. É nessa fronteira que o aprendizado acontece: comece por ali.', other: 'Você respondeu {count} lições com convicção e depois começou a chutar. É nessa fronteira que o aprendizado acontece: comece por ali.' },
  'quiz.level.stoppedFirst': 'Você começou a chutar logo de cara. Comece do início: é nessa fronteira que o aprendizado acontece.',
  'quiz.level.allTitle': 'Você domina este curso',
  'quiz.level.allLead': 'Todas as lições certas, e você tinha certeza em cada uma.',
  'quiz.level.patchTitle': 'Quase lá',
  'quiz.level.patchLead': 'Você chegou ao fim. Reforce as lições que errou ou chutou e o curso é seu.',
  'quiz.level.startButton': 'Começar esta lição',
  'quiz.level.reason.missed': 'errou',
  'quiz.level.reason.guessed': 'chutou',
  'quiz.level.reason.unknown': 'não sabia',
  'quiz.level.notReached': { one: '{count} lição seguinte não foi alcançada: ela se apoia nestas.', other: '{count} lições seguintes não foram alcançadas: elas se apoiam nestas.' },
  'quiz.level.howItWorks': 'As perguntas ficam mais difíceis a cada lição, e o quiz para quando você começa a chutar ou errar. Marque “Estou chutando” sempre que não tiver certeza.',
  'quiz.end.backToCourse': 'Voltar ao curso',
  'quiz.end.retake': 'Refazer o quiz',
} satisfies Translation<typeof en>;
