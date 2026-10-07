// Brazilian Portuguese UI strings: profile. Mirrors src/i18n/en/profile.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/profile.ts';

export default {
  'profile.importBadFile': 'Este arquivo não parece ser uma exportação de progresso do ProjectLearn.',

  'profile.guest': 'Visitante',
  'profile.guestLearner': 'Estudante visitante',
  'profile.accountLine': '{email} <verified>✓ verificado</verified> · desde {joined}',
  'profile.localOnly': 'O progresso fica salvo só neste navegador.',
  'profile.levelLine': 'Nível {level} · {title}',
  'profile.levelXp': '{into} / {needed} XP',
  'profile.levelProgress': 'Progresso até o próximo nível',
  'profile.sync.saving': 'Salvando…',
  'profile.sync.offline': 'Offline — vamos tentar de novo',
  'profile.sync.synced': 'Sincronizado',
  'profile.createProfile': 'Criar perfil',

  'profile.stat.totalXp': 'XP total',
  'profile.stat.currentStreak': 'Sequência atual',
  'profile.stat.bestStreak': 'Melhor sequência',
  'profile.stat.lessonsDone': 'Lições concluídas',
  'profile.stat.mastered': 'Questões dominadas',
  'profile.stat.coursesStarted': 'Cursos iniciados',

  'profile.activity': 'Atividade',

  'profile.goal.help': 'Quanto XP você quer ganhar por dia? Uma lição vale cerca de 30–50 XP.',
  'profile.goal.label': 'Meta diária de XP',
  // Adjectives describing the goal ("meta", feminine).
  'profile.goal.casual': 'Leve',
  'profile.goal.regular': 'Regular',
  'profile.goal.serious': 'Puxada',
  'profile.goal.intense': 'Intensa',

  'profile.courseProgress': 'Progresso nos cursos',
  'profile.notebookLink': 'Caderno →',
  'profile.reportLink': 'Sua análise de aprendizado →',
  'profile.noCourses': 'Nenhum curso iniciado ainda. <link>Escolha um →</link>',
  'profile.courseLine': 'Essenciais {done}/{total} · {mastery} de domínio',
  'profile.courseLineQuiz': 'Essenciais {done}/{total} · {mastery} de domínio · quiz {quiz}',
  'profile.courseProgressLabel': 'Progresso em {title}',

  'profile.somethingWrong': 'Algo deu errado.',

  'profile.account.title': 'Conta',
  'profile.account.changePassword': 'Alterar senha',
  'profile.account.currentPassword': 'Senha atual',
  'profile.account.newPassword': 'Nova senha',
  'profile.account.passwordHelp': 'Pelo menos 8 caracteres.',
  'profile.account.updatePassword': 'Atualizar senha',
  'profile.account.passwordChanged': 'Senha alterada. Os outros dispositivos foram desconectados.',
  'profile.account.session': 'Sessão',
  'profile.account.signOutHelp': 'Ao sair, seu progresso é removido deste navegador. Ele continua salvo na sua conta.',
  'profile.account.signOut': 'Sair',
  'profile.account.delete': 'Excluir conta',
  'profile.account.deleteStart': 'Excluir minha conta…',
  'profile.account.deleteWarning': 'Isso exclui permanentemente seu perfil e todo o progresso sincronizado. Não dá para desfazer.',
  'profile.account.deleteConfirm': 'Confirme com sua senha',
  'profile.account.deleteForever': 'Excluir para sempre',

  'profile.data.title': 'Seus dados',
  'profile.data.helpSignedIn': 'O progresso é sincronizado com sua conta automaticamente. Mesmo assim, você pode guardar um arquivo de backup.',
  'profile.data.helpGuest': 'Faça backup do seu progresso em um arquivo ou restaure-o em outro navegador.',
  'profile.data.export': 'Exportar progresso',
  'profile.data.import': 'Importar progresso',
  'profile.data.reset': 'Zerar progresso',
  'profile.data.resetConfirm': 'Apagar todo o progresso de aprendizado? Exporte antes se quiser um backup.',
  'profile.data.importFailed': 'Não foi possível ler esse arquivo.',
} satisfies Translation<typeof en>;
