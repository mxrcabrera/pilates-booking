export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Términos de Servicio</h1>
        <p className="text-gray-600 mb-4">Última actualización: Diciembre 2024</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Aceptación de los términos</h2>
          <p className="text-gray-700">
            Al acceder y utilizar Pilates Booking, aceptás estos términos de servicio.
            Si no estás de acuerdo con alguno de estos términos, no debés usar la aplicación.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Descripción del servicio</h2>
          <p className="text-gray-700">
            Pilates Booking es una plataforma para la gestión de clases de pilates que
            permite a profesores administrar sus alumnos, horarios y reservas, y a
            alumnos reservar clases con sus profesores.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Cuentas de usuario</h2>
          <p className="text-gray-700 mb-2">
            Para usar Pilates Booking necesitás crear una cuenta. Sos responsable de:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Mantener la confidencialidad de tu cuenta</li>
            <li>Todas las actividades que ocurran bajo tu cuenta</li>
            <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Uso aceptable</h2>
          <p className="text-gray-700 mb-2">Te comprometés a no:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Usar el servicio para fines ilegales</li>
            <li>Intentar acceder a cuentas de otros usuarios</li>
            <li>Interferir con el funcionamiento del servicio</li>
            <li>Proporcionar información falsa</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Reservas y cancelaciones</h2>
          <p className="text-gray-700">
            Las políticas de cancelación de clases son establecidas por cada profesor
            individualmente. Consultá con tu profesor sobre sus políticas específicas.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. Limitación de responsabilidad</h2>
          <p className="text-gray-700">
            Pilates Booking se proporciona &quot;tal cual&quot;. No garantizamos que el servicio
            esté libre de errores o interrupciones. No somos responsables por daños
            indirectos o consecuentes derivados del uso del servicio.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">7. Modificaciones</h2>
          <p className="text-gray-700">
            Nos reservamos el derecho de modificar estos términos en cualquier momento.
            Los cambios entrarán en vigor inmediatamente después de su publicación.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">8. Contacto</h2>
          <p className="text-gray-700">
            Para consultas sobre estos términos, contactanos a través del correo
            electrónico de soporte.
          </p>
        </section>
      </div>
    </div>
  )
}
