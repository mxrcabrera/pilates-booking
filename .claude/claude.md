# Notas de Errores - Pilates Booking

## IMPORTANTE: Instrucciones para Claude

**SIEMPRE** leer este archivo `claude.md` cada vez que el usuario da una nueva instrucción o cuando se empieza una nueva tarea. Este archivo contiene notas importantes sobre errores conocidos, soluciones y mejores prácticas del proyecto.

---

## Error: Turbopack Panic al modificar archivos de configuración

**Fecha**: 2025-12-11

**Error**:
```
FATAL: An unexpected Turbopack error occurred
Failed to write app endpoint /(dashboard)/configuracion/page
```

**Causa**:
- Turbopack tiene problemas al recompilar archivos después de grandes cambios
- Puede ser por cache corrupta o cambios estructurales en componentes

**Solución**:
1. Matar todos los procesos de node
2. Borrar la carpeta `.next`
3. Reiniciar el servidor dev

**Comando**:
```bash
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2; Remove-Item -Path '.next' -Recurse -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; npm run dev"
```

**Prevención**:
- Evitar hacer cambios muy grandes en un solo archivo
- Si modificás estructura de componentes grandes, hacer restart del servidor
- Si ves error de Turbopack panic, SIEMPRE limpiar .next antes de seguir

---

## Problemas con inputs condicionales

**Causa**:
Inputs HTML con name condicional pueden causar problemas:
```tsx
// ❌ MAL - puede causar problemas
<input type="hidden" name={condition ? "field" : ""} value="on" />

// ✅ BIEN - usar renderizado condicional
{condition && <input type="hidden" name="field" value="on" />}
```

**Solución**: Siempre usar renderizado condicional completo con `&&` en lugar de props condicionales.

---

## Problema: Cards de horarios desalineadas verticalmente

**Fecha**: 2025-12-14

**Problema**:
Las cards de horarios (Lunes-Viernes, Sábado, Domingo) aparecen desalineadas verticalmente cuando tienen diferente contenido en la sección de acciones. Específicamente, cuando Lunes-Viernes tiene el botón "Editar días individuales" pero Sábado/Domingo no lo tienen.

**Causa**:
- Grid con `align-items: center` + diferentes alturas de contenido interno causan desalineación
- El contenedor `.horario-dia-content` no tiene altura fija
- Los elementos internos tienen diferentes alturas naturales

**Solución DEFINITIVA**:
```css
.horario-dia-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: start;  /* NO center, usar start */
  height: 72px;        /* Altura FIJA, no min-height */
}

.horario-dia-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
  height: 100%;
  padding-top: 4px;   /* Pequeño offset para alinear visualmente */
}

.horario-dia-actions {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  height: 100%;
  padding-top: 4px;   /* Mismo offset que info */
}
```

**Clave**: Usar `align-items: start` en el grid y agregar `padding-top` igual en ambas columnas para alinearlas visualmente.
