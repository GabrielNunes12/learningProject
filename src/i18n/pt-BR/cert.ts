// Brazilian Portuguese UI strings: cert. Mirrors src/i18n/en/cert.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/cert.ts';

export default {
  // pt-BR uses "one" for 1.5 too ("1,5 hora"), which is the standard form.
  'cert.minutes': { one: '{count} minuto', other: '{count} minutos' },
  'cert.hours': { one: '{count} hora', other: '{count} horas' },

  // ---- the certificate (same text in the HTML view and the PDF) ----
  'cert.brandLabel': 'Certificado de conclusão: {name}, {course}',
  'cert.id': 'ID do certificado: {id}',
  'cert.title': 'Certificado de conclusão',
  'cert.certifies': 'Certificamos que',
  'cert.completed': 'concluiu com êxito o curso',
  'cert.details': { one: '{count} lição · {hours} de estudo', other: '{count} lições · {hours} de estudo' },
  'cert.dateIssued': 'Data de emissão',
  'cert.issuer': 'Emitido por',
  'cert.verifyAt': 'Verifique em {url}',
  'cert.pdfTitle': '{course}: certificado de conclusão',
  'cert.pdfSubject': '{name} concluiu {course}',

  // ---- the name ----
  'cert.name.empty': 'Digite seu nome como ele deve aparecer no certificado.',
  'cert.name.long': 'Use no máximo 60 caracteres no nome.',
  'cert.name.letter': 'O nome precisa ter pelo menos uma letra.',
  'cert.name.chars': 'A fonte do certificado não consegue imprimir “{chars}”. Use letras latinas (acentos como á, ç, ã e ü funcionam).',

  // ---- sharing ----
  'cert.shareText': {
    one: 'Acabei de concluir “{course}” no {issuer}: {count} lição, {hours} de estudo.',
    other: 'Acabei de concluir “{course}” no {issuer}: {count} lições, {hours} de estudo.',
  },
  'cert.download': 'Baixar PDF',
  'cert.print': 'Imprimir',
  'cert.shareIt': 'Compartilhe',
  'cert.addLinkedIn': 'Adicionar ao perfil do LinkedIn',
  'cert.postLinkedIn': 'Publicar no LinkedIn',
  'cert.postX': 'Publicar no X',
  'cert.shareFacebook': 'Compartilhar no Facebook',
  'cert.copyLink': 'Copiar link',
  'cert.linkCopied': 'Link copiado',
  'cert.copyPrompt': 'Copie o link do certificado:',
  'cert.anyoneVerify': 'Qualquer pessoa com o link pode verificá-lo: {link}',

  // ---- course page panel ----
  'cert.panel.title': 'Certificado',
  'cert.panel.ready': 'Você concluiu todas as lições. Seu certificado está pronto.',
  'cert.panel.get': 'Obter meu certificado',
  'cert.panel.toGo': {
    one: 'Conclua todas as {total} lições para ganhar um certificado que você pode baixar e compartilhar. Falta {count}.',
    other: 'Conclua todas as {total} lições para ganhar um certificado que você pode baixar e compartilhar. Faltam {count}.',
  },

  // ---- issuing page ----
  'cert.almost': 'Quase lá',
  'cert.almostLead': {
    one: 'Conclua todas as {total} lições de {course} para ganhar seu certificado. Falta {count}.',
    other: 'Conclua todas as {total} lições de {course} para ganhar seu certificado. Faltam {count}.',
  },
  'cert.continueCourse': 'Continuar o curso',
  'cert.finished': 'Você concluiu {course}',
  'cert.needProfile':
    'Os certificados são emitidos para perfis, para que possam ser verificados e compartilhados. Crie um perfil grátis (seu progresso vai junto) ou entre na sua conta e depois volte aqui.',
  'cert.courseComplete': 'Curso concluído',
  'cert.yours': 'Seu certificado de {course}',
  'cert.nameLabel': 'Seu nome, como deve aparecer no certificado',
  'cert.namePlaceholder': 'ex.: Ada Lovelace',
  'cert.issuing': 'Emitindo…',
  'cert.update': 'Atualizar certificado',
  'cert.create': 'Criar meu certificado',
  'cert.hoursNote': 'As horas são o seu tempo ativo de estudo neste curso e nunca ficam abaixo do tempo estimado das lições.',
  'cert.wrongName': 'Nome errado? <edit>Edite</edit>. O link e o ID continuam os mesmos.',

  // ---- public verification page ----
  'cert.loadingPublic': 'Carregando certificado…',
  'cert.notFound': 'Certificado não encontrado',
  'cert.notFoundLead': 'Não existe certificado do {issuer} com o ID {id}. Confira o link e tente de novo.',
  'cert.verified': 'Verificado: emitido pelo {issuer} para {name} em {date}.',
  'cert.takeIt': 'Faça o curso {course} também',

  // ---- share card (/c/<id>) ----
  'cert.card.title': '{name} concluiu “{course}”',
  'cert.card.description': {
    one: '{count} lição, {hours} de estudo. Emitido pelo {issuer} em {date}. ID do certificado: {id}.',
    other: '{count} lições, {hours} de estudo. Emitido pelo {issuer} em {date}. ID do certificado: {id}.',
  },
  'cert.card.notFound': 'Certificado não encontrado',
  'cert.card.invalid': 'Este link de certificado do {issuer} não é válido.',
  'cert.card.open': 'Abrir o certificado',
} satisfies Translation<typeof en>;
