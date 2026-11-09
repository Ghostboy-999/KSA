/**
 * Mensajes de Supabase Auth traducidos y con qué hacer.
 * Los códigos están en https://supabase.com/docs/guides/auth/debugging/error-codes
 */
const BY_CODE: Record<string, string> = {
  email_address_invalid:
    'Ese correo no se acepta. Escribe un correo real que puedas abrir, por ejemplo el de tu empresa o tu Gmail.',
  email_address_not_authorized:
    'Todavía no podemos enviar el correo de confirmación a esa dirección. KSA está terminando de configurar el envío de correos; inténtalo más tarde o comunícate con el taller.',
  over_email_send_rate_limit:
    'Se enviaron demasiados correos en poco tiempo. Espera unos minutos e inténtalo de nuevo.',
  over_request_rate_limit: 'Demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.',
  user_already_exists: 'Ya hay una cuenta con ese correo. Ingresa con tu contraseña.',
  email_exists: 'Ya hay una cuenta con ese correo. Ingresa con tu contraseña.',
  weak_password: 'La contraseña es muy débil. Usa al menos 8 caracteres, mezclando letras y números.',
  email_not_confirmed: 'Confirma tu correo con el enlace que te enviamos antes de ingresar.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  signup_disabled: 'El registro de clientes no está abierto todavía. Comunícate con el taller.',
  user_banned: 'Esta cuenta está bloqueada. Comunícate con el taller.',
}

export function authErrorMessage(err: { code?: string; message?: string } | string | null | undefined) {
  if (!err) return null
  const code = typeof err === 'string' ? undefined : err.code
  const message = typeof err === 'string' ? err : (err.message ?? '')
  if (code && BY_CODE[code]) return BY_CODE[code]
  if (/email not confirmed/i.test(message)) return BY_CODE.email_not_confirmed
  if (/invalid login credentials/i.test(message)) return BY_CODE.invalid_credentials
  if (/already registered/i.test(message)) return BY_CODE.user_already_exists
  if (/is invalid/i.test(message) && /email/i.test(message)) return BY_CODE.email_address_invalid
  if (/rate limit/i.test(message)) return BY_CODE.over_request_rate_limit
  if (/failed to fetch|network/i.test(message)) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
  return message || 'Algo salió mal. Inténtalo de nuevo.'
}
