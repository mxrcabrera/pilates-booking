export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
        <p className="text-gray-600 mb-4">Última actualización: Diciembre 2024</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Información que recopilamos</h2>
          <p className="text-gray-700 mb-2">
            Pilates Booking recopila la siguiente información cuando usás nuestra aplicación:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Nombre y dirección de correo electrónico (a través de Google Sign-In)</li>
            <li>Información de tu calendario de Google (para sincronización de clases)</li>
            <li>Datos de reservas y clases programadas</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Cómo usamos tu información</h2>
          <p className="text-gray-700 mb-2">Utilizamos tu información para:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Permitirte iniciar sesión en la aplicación</li>
            <li>Gestionar tus reservas de clases de pilates</li>
            <li>Sincronizar clases con tu Google Calendar (si lo autorizás)</li>
            <li>Enviarte notificaciones sobre tus clases</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Google Calendar</h2>
          <p className="text-gray-700">
            Si autorizás el acceso a Google Calendar, solo utilizamos este permiso para
            crear y gestionar eventos relacionados con tus clases de pilates. No accedemos
            ni modificamos otros eventos de tu calendario.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Compartir información</h2>
          <p className="text-gray-700">
            No vendemos ni compartimos tu información personal con terceros, excepto
            cuando sea necesario para proporcionar el servicio (por ejemplo, con tu
            profesor de pilates para gestionar las clases).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Seguridad</h2>
          <p className="text-gray-700">
            Implementamos medidas de seguridad para proteger tu información, incluyendo
            encriptación de datos y autenticación segura a través de Google.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. Contacto</h2>
          <p className="text-gray-700">
            Si tenés preguntas sobre esta política de privacidad, podés contactarnos
            a través del correo electrónico de soporte.
          </p>
        </section>
      </div>
    </div>
  )
}
