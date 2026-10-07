// Spanish UI strings: cert. Mirrors src/i18n/en/cert.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/cert.ts';

export default {
  'cert.minutes': { one: '{count} minuto', other: '{count} minutos' },
  'cert.hours': { one: '{count} hora', other: '{count} horas' },

  // ---- the certificate (same text in the HTML view and the PDF) ----
  'cert.brandLabel': 'Certificado de finalización: {name}, {course}',
  'cert.id': 'ID del certificado {id}',
  'cert.title': 'Certificado de finalización',
  'cert.certifies': 'Se certifica que',
  'cert.completed': 'ha completado con éxito el curso',
  'cert.details': { one: '{count} lección · {hours} de aprendizaje', other: '{count} lecciones · {hours} de aprendizaje' },
  'cert.dateIssued': 'Fecha de emisión',
  'cert.issuer': 'Emisor',
  'cert.verifyAt': 'Verificable en {url}',
  'cert.pdfTitle': '{course}: certificado de finalización',
  'cert.pdfSubject': '{name} completó {course}',

  // ---- the name ----
  'cert.name.empty': 'Escribe tu nombre tal como debe aparecer en el certificado.',
  'cert.name.long': 'El nombre debe tener 60 caracteres como máximo.',
  'cert.name.letter': 'El nombre necesita al menos una letra.',
  'cert.name.chars': 'La fuente del certificado no puede imprimir “{chars}”. Usa letras latinas (los acentos como é, ñ, ü no dan problema).',

  // ---- sharing ----
  'cert.shareText': {
    one: 'Acabo de completar “{course}” en {issuer}: {count} lección, {hours} de aprendizaje.',
    other: 'Acabo de completar “{course}” en {issuer}: {count} lecciones, {hours} de aprendizaje.',
  },
  'cert.download': 'Descargar PDF',
  'cert.print': 'Imprimir',
  'cert.shareIt': 'Compártelo',
  'cert.addLinkedIn': 'Añadir al perfil de LinkedIn',
  'cert.postLinkedIn': 'Publicar en LinkedIn',
  'cert.postX': 'Publicar en X',
  'cert.shareFacebook': 'Compartir en Facebook',
  'cert.copyLink': 'Copiar enlace',
  'cert.linkCopied': 'Enlace copiado',
  'cert.copyPrompt': 'Copia el enlace del certificado:',
  'cert.anyoneVerify': 'Cualquiera con el enlace puede verificarlo: {link}',

  // ---- course page panel ----
  'cert.panel.title': 'Certificado',
  'cert.panel.ready': 'Terminaste todas las lecciones. Tu certificado está listo.',
  'cert.panel.get': 'Consigue tu certificado',
  'cert.panel.toGo': {
    one: 'Termina las {total} lecciones para obtener un certificado que podrás descargar y compartir. Te falta {count}.',
    other: 'Termina las {total} lecciones para obtener un certificado que podrás descargar y compartir. Te faltan {count}.',
  },

  // ---- issuing page ----
  'cert.almost': 'Ya casi',
  'cert.almostLead': {
    one: 'Termina las {total} lecciones de {course} para obtener tu certificado. Te falta {count}.',
    other: 'Termina las {total} lecciones de {course} para obtener tu certificado. Te faltan {count}.',
  },
  'cert.continueCourse': 'Continuar el curso',
  'cert.finished': 'Terminaste {course}',
  'cert.needProfile':
    'Los certificados se emiten a perfiles para que se puedan verificar y compartir. Crea un perfil gratis (tu progreso se conserva) o inicia sesión, y luego vuelve aquí.',
  'cert.courseComplete': 'Curso completado',
  'cert.yours': 'Tu certificado de {course}',
  'cert.nameLabel': 'Tu nombre, tal como debe aparecer en el certificado',
  'cert.namePlaceholder': 'p. ej., Ada Lovelace',
  'cert.issuing': 'Emitiendo…',
  'cert.update': 'Actualizar el certificado',
  'cert.create': 'Crear mi certificado',
  'cert.hoursNote': 'Las horas son tu tiempo de estudio activo en este curso, y nunca menos que el tiempo estimado de las lecciones.',
  'cert.wrongName': '¿Nombre incorrecto? <edit>Edítalo</edit>. El enlace y el ID no cambian.',

  // ---- public verification page ----
  'cert.loadingPublic': 'Cargando el certificado…',
  'cert.notFound': 'Certificado no encontrado',
  'cert.notFoundLead': 'No hay ningún certificado de {issuer} con el ID {id}. Revisa el enlace e inténtalo de nuevo.',
  'cert.verified': 'Verificado: emitido por {issuer} a {name} el {date}.',
  'cert.takeIt': 'Haz tú también {course}',

  // ---- share card (/c/<id>) ----
  'cert.card.title': '{name} completó “{course}”',
  'cert.card.description': {
    one: '{count} lección, {hours} de aprendizaje. Emitido por {issuer} el {date}. ID del certificado {id}.',
    other: '{count} lecciones, {hours} de aprendizaje. Emitido por {issuer} el {date}. ID del certificado {id}.',
  },
  'cert.card.notFound': 'Certificado no encontrado',
  'cert.card.invalid': 'Este enlace de certificado de {issuer} no es válido.',
  'cert.card.open': 'Abrir el certificado',
} satisfies Translation<typeof en>;
