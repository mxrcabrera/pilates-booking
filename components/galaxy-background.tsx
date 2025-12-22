'use client'

// Fondo de galaxia usando CSS puro - más confiable que filtros SVG
export function GalaxyBackground() {
  return (
    <div className="galaxy-bg" aria-hidden="true">
      <div className="nebula-layer" />
      <div className="stars-layer" />
    </div>
  )
}
