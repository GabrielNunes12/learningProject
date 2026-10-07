// Brazilian Portuguese UI strings: home. Mirrors src/i18n/en/home.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/home.ts';

export default {
  'home.greet.late': 'Estudando até tarde!',
  'home.greet.morning': 'Bom dia!',
  'home.greet.afternoon': 'Boa tarde!',
  'home.greet.evening': 'Boa noite!',
  'home.greet.lateName': 'Estudando até tarde, {name}!',
  'home.greet.morningName': 'Bom dia, {name}!',
  'home.greet.afternoonName': 'Boa tarde, {name}!',
  'home.greet.eveningName': 'Boa noite, {name}!',
  'home.goalReached': 'Meta diária batida. O que vier agora é bônus.',
  'home.startWithReviews': {
    one: 'Comece com {count} revisão pendente e depois aprenda algo novo.',
    other: 'Comece com as {count} revisões pendentes e depois aprenda algo novo.',
  },
  'home.pickUp': 'Continue de onde parou.',

  'home.hero.eyebrow': 'Estude melhor, não mais',
  'home.hero.title': 'Domine os <hl>20%</hl> que rendem <hl>80%</hl>.',
  'home.hero.lead':
    'Cada curso começa pelas ideias essenciais, ensina com exemplos resolvidos e exercícios e depois as mantém na sua memória com quizzes e revisões espaçadas.',
  'home.hero.tryLesson': 'Experimente uma lição — sem precisar de conta',

  'home.continue.eyebrow': 'Continue aprendendo',
  'home.continue.startHere': 'Comece por aqui',
  'home.continue.complete': '{course} — curso concluído!',
  'home.continue.progress': '{done} de {total} lições',
  'home.continue.counts': 'Essenciais {coreDone}/{coreTotal} · {done}/{total} lições',
  'home.continue.continue': 'Continuar →',
  'home.continue.start': 'Começar →',
  'home.continue.quiz': 'Fazer o quiz',

  'home.stat.goalValue': '{today} / {goal} XP',
  'home.stat.streakValue': { one: '{count} dia', other: '{count} dias' },
  'home.stat.level': 'Nível {level} · {title}',
  'home.stat.levelProgress': 'Progresso até o próximo nível',
  'home.stat.toNext': '{xp} XP para o nível {level}',
  'home.stat.dueNow': '{count} para revisar',
  'home.stat.caughtUp': 'Tudo em dia',
  'home.stat.beforeForget': 'Antes que você esqueça',
  'home.stat.nothingDue': 'Nada pendente',

  'home.save.text': '<b>Seu progresso fica salvo só neste navegador.</b> Crie um perfil grátis para mantê-lo seguro e usá-lo em qualquer dispositivo.',
  'home.save.button': 'Salvar meu progresso',

  'home.week.title': 'Esta semana',
  'home.method.title': 'O método 80/20',
  'home.method.core': '<b>Essencial primeiro.</b> Termine as lições <core>Essencial</core> de um curso antes de qualquer <extra>Aprofundamento</extra>.',
  'home.method.testOut': '<b>Teste-se antes.</b> Faça o quiz primeiro — ele mostra quais lições você pode pular.',
  'home.method.daily': '<b>Revise todo dia.</b> De 5 a 10 minutos bastam para manter tudo o que você aprendeu.',
  'home.method.two': '<b>Dois cursos por vez.</b> Termine o essencial deles e depois comece o próximo.',

  'home.yourCourses': 'Seus cursos',
  'home.recommended': 'Cursos recomendados',
  'home.allCourses': 'Todos os cursos →',
} satisfies Translation<typeof en>;
