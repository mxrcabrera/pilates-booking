// Utilidad para generar links wa.me con mensajes pre-armados
// Esto abre WhatsApp Web/app con el mensaje listo para enviar

function formatPhone(telefono: string): string {
  // Remover espacios, guiones, paréntesis
  let phone = telefono.replace(/[\s\-\(\)]/g, '')

  // Si empieza con 0, quitarlo (Argentina)
  if (phone.startsWith('0')) {
    phone = phone.slice(1)
  }

  // Si no tiene código de país, agregar +54 (Argentina)
  if (!phone.startsWith('+') && !phone.startsWith('54')) {
    phone = '54' + phone
  }

  // Quitar el + si lo tiene
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

// Mensajes pre-armados para diferentes situaciones
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
