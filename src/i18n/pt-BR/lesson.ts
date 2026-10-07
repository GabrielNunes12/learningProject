// Brazilian Portuguese UI strings: lesson. Mirrors src/i18n/en/lesson.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/lesson.ts';

export default {
  // ---------- lesson player ----------
  'lesson.xpEarnedAria': '{xp} XP ganhos nesta lição',
  'lesson.shorter.heading': 'Resuma “{title}” em âncoras',
  'lesson.shorter.intro':
    'Duas ou três âncoras, com até quatro palavras cada: as pistas que vão trazer esta lição de volta. Fragmentos funcionam melhor que frases completas.',
  'lesson.shorter.done': 'Concluir a lição',

  // ---------- worked example ----------
  'lesson.example.eyebrow': 'Exemplo resolvido',
  'lesson.example.attemptLabel': 'Primeiro, a sua resposta. Um chute vale; as etapas são liberadas depois que você se comprometer com uma.',
  'lesson.example.placeholder': 'Resolva e escreva sua resposta',
  'lesson.example.yourAnswer': 'Sua resposta',
  'lesson.example.compare': 'Compare com a sua resposta acima. Em que ponto o seu raciocínio tomou outro caminho?',
  'lesson.example.stepOf': 'Etapa {step} de {total}',
  'lesson.example.ready': 'No seu ritmo.',
  'lesson.example.writeToUnlock': 'Escreva sua resposta para liberar as etapas.',
  'lesson.example.lockIn': 'Confirmar minha resposta',
  'lesson.example.showFirstStep': 'Mostrar a primeira etapa',
  'lesson.example.nextStep': 'Próxima etapa',
  'lesson.example.showAnswer': 'Mostrar resposta',
  'lesson.example.notQuite': 'Não acertei',
  'lesson.example.hadIt': 'Acertei',

  // ---------- lesson complete ----------
  'lesson.complete.title': 'Lição concluída!',
  'lesson.complete.totalXp': 'XP total',
  'lesson.complete.accuracy': 'Acertos',
  'lesson.complete.today': '{today}/{goal} hoje',
  'lesson.complete.certTitle': 'Você concluiu {course}!',
  'lesson.complete.certText': 'Pegue seu certificado: baixe em PDF e compartilhe no LinkedIn, no X ou no Facebook.',
  'lesson.complete.takeaway': 'Para lembrar',
  'lesson.complete.checkpoint': 'Ponto de controle da unidade: mapeie o que você sabe',
  'lesson.complete.signupNudge': '<link>Crie um perfil grátis</link> para manter seu progresso em todos os dispositivos.',
  'lesson.complete.backToCourse': 'Voltar ao curso',
  'lesson.complete.next': 'Próxima: {title} →',
  'lesson.complete.quiz': 'Fazer o quiz do curso →',

  // ---------- question kinds ----------
  'lesson.kind.mcq': 'Escolha uma',
  'lesson.kind.numeric': 'Digite um número',
  'lesson.kind.text': 'Digite sua resposta',
  'lesson.kind.output': 'Preveja a saída',
  'lesson.kind.bug': 'Encontre o bug: clique na linha com erro',
  'lesson.kind.pickFix': 'Agora escolha a correção',

  // ---------- classic questions ----------
  'lesson.question.itPrints': 'O programa imprime:',
  'lesson.question.codeLinesAria': 'Código: escolha a linha com o bug',
  'lesson.question.lineAria': 'Linha {line}',
  'lesson.question.whenYouRun': 'Ao executar',
  'lesson.question.lineFound': '✓ O problema está na linha {line}. Qual mudança corrige?',
  'lesson.question.outputPlaceholder': 'Digite exatamente o que é impresso',
  'lesson.question.outputAria': 'Saída',
  'lesson.question.numericPlaceholder': 'ex.: 0,25; 1/4 ou 42',
  'lesson.question.textPlaceholder': 'Digite sua resposta',
  'lesson.question.outputTip': 'Uma linha para cada linha impressa. Pressione Ctrl/⌘ + Enter para verificar.',

  // ---------- question feedback (QuestionFrame) ----------
  'lesson.frame.needHint': 'Precisa de uma dica?',
  'lesson.frame.hintLine': '<b>Dica:</b> {hint}',
  'lesson.frame.why': 'Por quê',
  'lesson.frame.gotIt': 'Acertou!',
  'lesson.frame.xpGained': '+{xp} XP',
  'lesson.frame.secondTries': 'A segunda tentativa também conta.',
  'lesson.frame.notQuite': 'Quase.',
  'lesson.frame.retryNudge': 'Pense mais uma vez — é tentando de novo que se aprende.',
  'lesson.frame.incorrect': 'Incorreto',
  'lesson.frame.heresAnswer': 'Aqui está a resposta',
  'lesson.frame.readWhy': 'Leia a explicação: esta questão vai voltar nas suas revisões.',
  'lesson.frame.showAnswer': 'Mostrar resposta',
  'lesson.frame.correctAnswer': '<b>Resposta correta:</b> {answer}',

  // ---------- correct-answer texts (src/lib/answers.ts) ----------
  'lesson.answer.withUnit': '{value} {unit}',
  'lesson.answer.bugFix': 'Linha {line}: {fix}',
  'lesson.answer.traceValue': '`{expr}` depois da linha {line}',
  // V = verdadeiro, F = falso.
  'lesson.answer.true': 'V',
  'lesson.answer.false': 'F',

  // ---------- question sessions (review, mixed practice, quiz) ----------
  'lesson.session.correctSoFar': { one: '{count} acerto até agora', other: '{count} acertos até agora' },
  'lesson.session.shorterHeading': 'Resuma esta sessão em âncoras',
  'lesson.session.shorterIntro': 'O que você vai lembrar ou fazer diferente da próxima vez? Duas ou três âncoras, com até quatro palavras cada.',
  'lesson.session.seeResults': 'Ver resultados',
} satisfies Translation<typeof en>;
