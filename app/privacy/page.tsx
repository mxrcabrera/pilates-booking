export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">Política de Privacidad</h1>
        <p className="legal-date">Última actualización: Diciembre 2024</p>

        <section className="legal-section">
          <h2 className="legal-heading">1. Información que recopilamos</h2>
          <p className="legal-text">
            Pilates Booking recopila la siguiente información cuando usás nuestra aplicación:
          </p>
          <ul className="legal-list">
            <li>Nombre y dirección de correo electrónico (a través de Google Sign-In)</li>
            <li>Información de tu calendario de Google (para sincronización de clases)</li>
            <li>Datos de reservas y clases programadas</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">2. Cómo usamos tu información</h2>
          <p className="legal-text">Utilizamos tu información para:</p>
          <ul className="legal-list">
            <li>Permitirte iniciar sesión en la aplicación</li>
            <li>Gestionar tus reservas de clases de pilates</li>
            <li>Sincronizar clases con tu Google Calendar (si lo autorizás)</li>
            <li>Enviarte notificaciones sobre tus clases</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">3. Google Calendar</h2>
          <p className="legal-text">
            Si autorizás el acceso a Google Calendar, solo utilizamos este permiso para
            crear y gestionar eventos relacionados con tus clases de pilates. No accedemos
            ni modificamos otros eventos de tu calendario.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">4. Compartir información</h2>
          <p className="legal-text">
            No vendemos ni compartimos tu información personal con terceros, excepto
            cuando sea necesario para proporcionar el servicio (por ejemplo, con tu
            profesor de pilates para gestionar las clases).
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">5. Seguridad</h2>
          <p className="legal-text">
            Implementamos medidas de seguridad para proteger tu información, incluyendo
            encriptación de datos y autenticación segura a través de Google.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">6. Contacto</h2>
          <p className="legal-text">
            Si tenés preguntas sobre esta política de privacidad, podés contactarnos
            a través del correo electrónico de soporte.
          </p>
        </section>
      </div>
    </div>
  )
}
