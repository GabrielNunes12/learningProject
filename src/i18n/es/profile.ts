// Spanish UI strings: profile. Mirrors src/i18n/en/profile.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/profile.ts';

export default {
  'profile.importBadFile': 'Ese archivo no parece una exportación de progreso de ProjectLearn.',

  'profile.guest': 'Invitado',
  'profile.guestLearner': 'Estudiante invitado',
  'profile.accountLine': '{email} <verified>✓ verificado</verified> · miembro desde {joined}',
  'profile.localOnly': 'El progreso solo se guarda en este navegador.',
  'profile.levelLine': 'Nivel {level} · {title}',
  'profile.levelXp': '{into} / {needed} XP',
  'profile.levelProgress': 'Progreso hacia el siguiente nivel',
  'profile.sync.saving': 'Guardando…',
  'profile.sync.offline': 'Sin conexión: se reintentará',
  'profile.sync.synced': 'Sincronizado',
  'profile.createProfile': 'Crear perfil',

  'profile.stat.totalXp': 'XP total',
  'profile.stat.currentStreak': 'Racha actual',
  'profile.stat.bestStreak': 'Mejor racha',
  'profile.stat.lessonsDone': 'Lecciones hechas',
  'profile.stat.mastered': 'Preguntas dominadas',
  'profile.stat.coursesStarted': 'Cursos empezados',

  'profile.activity': 'Actividad',

  'profile.goal.help': '¿Cuántos XP quieres ganar cada día? Una lección da unos 30–50 XP.',
  'profile.goal.label': 'Meta diaria de XP',
  'profile.goal.casual': 'Tranquilo',
  'profile.goal.regular': 'Regular',
  'profile.goal.serious': 'Serio',
  'profile.goal.intense': 'Intenso',

  'profile.courseProgress': 'Progreso por curso',
  'profile.notebookLink': 'Cuaderno →',
  'profile.reportLink': 'Tu informe de aprendizaje →',
  'profile.noCourses': 'Todavía no has empezado ningún curso. <link>Elige uno →</link>',
  'profile.courseLine': 'Esencial {done}/{total} · {mastery} dominado',
  'profile.courseLineQuiz': 'Esencial {done}/{total} · {mastery} dominado · test {quiz}',
  'profile.courseProgressLabel': 'Progreso de {title}',

  'profile.somethingWrong': 'Algo salió mal.',

  'profile.account.title': 'Cuenta',
  'profile.account.changePassword': 'Cambiar contraseña',
  'profile.account.currentPassword': 'Contraseña actual',
  'profile.account.newPassword': 'Nueva contraseña',
  'profile.account.passwordHelp': 'Al menos 8 caracteres.',
  'profile.account.updatePassword': 'Actualizar contraseña',
  'profile.account.passwordChanged': 'Contraseña cambiada. Se cerró la sesión en tus otros dispositivos.',
  'profile.account.session': 'Sesión',
  'profile.account.signOutHelp': 'Al cerrar sesión, tu progreso se borra de este navegador. Sigue guardado en tu cuenta.',
  'profile.account.signOut': 'Cerrar sesión',
  'profile.account.delete': 'Eliminar cuenta',
  'profile.account.deleteStart': 'Eliminar mi cuenta…',
  'profile.account.deleteWarning': 'Esto elimina para siempre tu perfil y todo el progreso sincronizado. No se puede deshacer.',
  'profile.account.deleteConfirm': 'Confirma con tu contraseña',
  'profile.account.deleteForever': 'Eliminar para siempre',

  'profile.data.title': 'Tus datos',
  'profile.data.helpSignedIn': 'Tu progreso se sincroniza automáticamente con tu cuenta. Aun así, puedes guardar un archivo de copia de seguridad.',
  'profile.data.helpGuest': 'Guarda una copia de tu progreso en un archivo o restáuralo en otro navegador.',
  'profile.data.export': 'Exportar progreso',
  'profile.data.import': 'Importar progreso',
  'profile.data.reset': 'Restablecer progreso',
  'profile.data.resetConfirm': '¿Borrar todo tu progreso de aprendizaje? Exporta primero si quieres una copia de seguridad.',
  'profile.data.importFailed': 'No se pudo leer ese archivo.',
} satisfies Translation<typeof en>;
