// Utility for generating wa.me links with pre-built messages.
// Opens WhatsApp Web/app with the message ready to send.

function formatPhone(telefono: string): string {
  // Remove spaces, dashes, parentheses
  let phone = telefono.replace(/[\s\-\(\)]/g, '')

  // If starts with 0, remove it (Argentina format)
  if (phone.startsWith('0')) {
    phone = phone.slice(1)
  }

  // If no country code, prepend +54 (Argentina)
  if (!phone.startsWith('+') && !phone.startsWith('54')) {
    phone = '54' + phone
  }

  // Remove the + prefix if present
  if (phone.startsWith('+')) {
    phone = phone.slice(1)
  }

  return phone
}

export function getWhatsAppLink(telefono: string, mensaje: string): string {
  const phone = formatPhone(telefono)
  const encodedMessage = encodeURIComponent(mensaje)
  return `https://wa.me/${phone}?text=${encodedMessage}`
}

// Pre-built messages for different situations
export function getClaseNuevaMessage(
  alumnoNombre: string,
  fecha: string,
  hora: string
): string {
  return `Hola ${alumnoNombre}! 👋

Te confirmo tu clase para el ${fecha} a las ${hora}.

¡Te espero!`
}

export function getClaseModificadaMessage(
  alumnoNombre: string,
  fechaNueva: string,
  horaNueva: string
): string {
  return `Hola ${alumnoNombre}! 👋

Tu clase fue reprogramada para el ${fechaNueva} a las ${horaNueva}.

¡Te espero!`
}

export function getClaseCanceladaMessage(
  alumnoNombre: string,
  fecha: string,
  hora: string
): string {
  return `Hola ${alumnoNombre},

Lamentablemente tuve que cancelar la clase del ${fecha} a las ${hora}.

Avisame para reprogramarla cuando puedas. 🙏`
}

export function getRecordatorioClaseMessage(
  alumnoNombre: string,
  hora: string
): string {
  return `Hola ${alumnoNombre}! 👋

Te recuerdo que mañana tenés clase a las ${hora}.

¡Te espero!`
}

export function getLugarDisponibleMessage(
  alumnoNombre: string,
  fecha: string,
  hora: string
): string {
  return `Hola ${alumnoNombre}! 🎉

Se liberó un lugar para la clase del ${fecha} a las ${hora}.

¿Te interesa tomarlo? Avisame pronto que no dura mucho!`
}

export function getRecordatorioPagoMessage(
  alumnoNombre: string,
  monto: string
): string {
  return `Hola ${alumnoNombre}! 👋

Te recuerdo que tenés un pago pendiente de $${monto}.

Avisame cuando puedas abonarlo. ¡Gracias!`
}

export function getBienvenidaMessage(
  alumnoNombre: string,
  profesorNombre: string
): string {
  return `¡Hola ${alumnoNombre}! 👋

Soy ${profesorNombre}. ¡Bienvenido/a a mis clases de Pilates!

Cualquier consulta, escribime por acá. 😊`
}

export function getMensajeGenericoMessage(alumnoNombre: string): string {
  return `Hola ${alumnoNombre}! 👋

`
}
