// Spanish UI strings: home. Mirrors src/i18n/en/home.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/home.ts';

export default {
  'home.greet.late': '¡Trasnochando!',
  'home.greet.morning': '¡Buenos días!',
  'home.greet.afternoon': '¡Buenas tardes!',
  'home.greet.evening': '¡Buenas noches!',
  'home.greet.lateName': '¡Trasnochando, {name}!',
  'home.greet.morningName': '¡Buenos días, {name}!',
  'home.greet.afternoonName': '¡Buenas tardes, {name}!',
  'home.greet.eveningName': '¡Buenas noches, {name}!',
  'home.goalReached': 'Meta diaria cumplida. Todo lo demás es un extra.',
  'home.startWithReviews': {
    one: 'Empieza con {count} repaso pendiente y luego aprende algo nuevo.',
    other: 'Empieza con tus {count} repasos y luego aprende algo nuevo.',
  },
  'home.pickUp': 'Sigue donde lo dejaste.',

  'home.hero.eyebrow': 'Aprende mejor, no más horas',
  'home.hero.title': 'Domina el <hl>20%</hl> que te da el <hl>80%</hl>.',
  'home.hero.lead':
    'Cada curso empieza por sus ideas clave, te las enseña con ejemplos resueltos y ejercicios, y luego las mantiene en tu memoria con tests y repaso espaciado.',
  'home.hero.tryLesson': 'Prueba una lección, sin crear cuenta',

  'home.continue.eyebrow': 'Sigue aprendiendo',
  'home.continue.startHere': 'Empieza aquí',
  'home.continue.complete': '{course}: curso completado',
  'home.continue.progress': '{done} de {total} lecciones',
  'home.continue.counts': 'Esencial {coreDone}/{coreTotal} · {done}/{total} lecciones',
  'home.continue.continue': 'Continuar →',
  'home.continue.start': 'Empezar →',
  'home.continue.quiz': 'Hacer el test',

  'home.stat.goalValue': '{today} / {goal} XP',
  'home.stat.streakValue': { one: '{count} día', other: '{count} días' },
  'home.stat.level': 'Nivel {level} · {title}',
  'home.stat.levelProgress': 'Progreso hacia el siguiente nivel',
  'home.stat.toNext': '{xp} XP para el nivel {level}',
  'home.stat.dueNow': 'Pendientes: {count}',
  'home.stat.caughtUp': 'Todo al día',
  'home.stat.beforeForget': 'Antes de que lo olvides',
  'home.stat.nothingDue': 'Nada pendiente',

  'home.save.text': '<b>Tu progreso solo se guarda en este navegador.</b> Crea un perfil gratis para no perderlo y usarlo en cualquier dispositivo.',
  'home.save.button': 'Guardar mi progreso',

  'home.week.title': 'Esta semana',
  'home.method.title': 'El método 80/20',
  'home.method.core': '<b>Primero lo esencial.</b> Termina las lecciones <core>Esencial</core> de un curso antes de cualquier <extra>Profundización</extra>.',
  'home.method.testOut': '<b>Ponte a prueba.</b> Haz el test primero: te dice qué lecciones puedes saltarte.',
  'home.method.daily': '<b>Repasa a diario.</b> Con 5–10 minutos conservas todo lo que has aprendido.',
  'home.method.two': '<b>Dos cursos a la vez.</b> Termina su parte esencial y luego añade el siguiente.',

  'home.yourCourses': 'Tus cursos',
  'home.recommended': 'Cursos recomendados',
  'home.allCourses': 'Todos los cursos →',
} satisfies Translation<typeof en>;
