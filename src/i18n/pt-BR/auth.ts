// Brazilian Portuguese UI strings: auth. Mirrors src/i18n/en/auth.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/auth.ts';

export default {
  'auth.username': 'Nome de usuário',
  'auth.email': 'E-mail',
  'auth.password': 'Senha',
  'auth.confirmPassword': 'Confirmar senha',
  'auth.newPassword': 'Nova senha',
  'auth.confirmNewPassword': 'Confirmar nova senha',
  'auth.updatePassword': 'Atualizar senha',
  'auth.passwordTooShort': 'Pelo menos 8 caracteres.',
  'auth.passwordsDontMatch': 'As senhas não coincidem.',
  'auth.somethingWrong': 'Algo deu errado.',
  'auth.backToSignIn': 'Voltar ao login',
  'auth.devMailboxHint':
    'Modo de desenvolvimento: nenhum servidor de e-mail está configurado, então os e-mails vão para a <link>caixa de e-mails de desenvolvimento</link>.',

  // Password strength ("senha", feminine).
  'auth.strength.tooShort': 'Muito curta',
  'auth.strength.weak': 'Fraca',
  'auth.strength.okay': 'Razoável',
  'auth.strength.good': 'Boa',
  'auth.strength.strong': 'Forte',

  'auth.signUp.title': 'Crie seu perfil',
  'auth.signUp.subtitle': 'Salve seu progresso, sua sequência e suas revisões em todos os dispositivos.',
  'auth.signUp.footer': 'Já tem um perfil? <link>Entrar</link>',
  'auth.signUp.usernameHelp': 'Aparece no seu perfil. Letras, números e _.',
  'auth.signUp.usernameInvalid': 'De 3 a 20 letras, números ou sublinhados (_).',
  'auth.signUp.emailHelp': 'Vamos enviar um link para confirmá-lo.',
  'auth.signUp.emailInvalid': 'Digite um endereço de e-mail válido.',
  'auth.signUp.passwordHelp': 'Pelo menos 8 caracteres. Uma frase curta é mais fácil de lembrar.',
  'auth.signUp.creating': 'Criando…',
  'auth.signUp.submit': 'Criar perfil',

  'auth.checkEmail.title': 'Confira seu e-mail',
  'auth.checkEmail.subtitle': 'Enviamos um link de confirmação para {email}. Clique nele para ativar seu perfil.',
  'auth.checkEmail.spam': 'Não encontrou? Confira a pasta de spam. O link expira em 24 horas.',
  'auth.checkEmail.resent': 'Se esse endereço precisar de confirmação, um novo link está a caminho.',
  'auth.checkEmail.resend': 'Reenviar e-mail',
  'auth.checkEmail.resendIn': 'Reenviar em {seconds}s',

  'auth.signIn.title': 'Que bom ver você de novo',
  'auth.signIn.subtitle': 'Entre para continuar de onde parou.',
  'auth.signIn.footer': 'Primeira vez aqui? <link>Crie um perfil</link>',
  'auth.signIn.serverDown': 'O servidor não está acessível. Inicie-o com npm run dev.',
  'auth.signIn.login': 'Nome de usuário ou e-mail',
  'auth.signIn.forgot': 'Esqueceu a senha?',
  'auth.signIn.signingIn': 'Entrando…',
  'auth.unverified.message': 'Confirme seu e-mail primeiro — enviamos um link para {email}.',
  'auth.unverified.resent': 'Um novo link está a caminho.',
  'auth.unverified.resend': 'Reenviar link',

  'auth.verify.working': 'Confirmando seu e-mail…',
  'auth.verify.failedTitle': 'O link não funcionou',
  'auth.verify.failedHelp': 'Entre para receber um novo link de confirmação.',
  'auth.verify.goToSignIn': 'Ir para o login',
  'auth.verify.doneTitle': 'E-mail confirmado',
  'auth.verify.doneSubtitle': 'Seu perfil está ativo e você já entrou. Agora seu progresso é sincronizado entre dispositivos.',
  'auth.verify.startLearning': 'Começar a aprender',

  'auth.forgot.title': 'Redefina sua senha',
  'auth.forgot.subtitle': 'Digite seu e-mail e enviaremos um link para você escolher uma nova senha.',
  'auth.forgot.sent': 'Se houver uma conta para {email}, um link de redefinição está a caminho. Ele expira em 60 minutos.',
  'auth.forgot.submit': 'Enviar link de redefinição',

  'auth.reset.title': 'Escolha uma nova senha',
  'auth.reset.doneTitle': 'Senha atualizada',
  'auth.reset.doneSubtitle': 'Agora você pode entrar com sua nova senha.',

  'auth.devMailbox.title': 'E-mails de desenvolvimento',
  'auth.devMailbox.subtitle': 'E-mails que o servidor teria enviado. Configure o SMTP no .env para enviar e-mails de verdade.',
  'auth.devMailbox.unavailable': 'A caixa de e-mails de desenvolvimento só está disponível em desenvolvimento, sem SMTP configurado.',
  'auth.devMailbox.empty': 'Nenhum e-mail ainda.',
  'auth.devMailbox.meta': 'para {to} · {time}',
  'auth.devMailbox.confirm': 'Confirmar e-mail',
  'auth.devMailbox.refresh': 'Atualizar',
} satisfies Translation<typeof en>;
