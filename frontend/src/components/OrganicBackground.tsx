import { useEffect, useRef } from 'react'

/**
 * Organic Background — Visual landscape for the auth screen.
 * Uses SVG blob paths and CSS animations to create a living,
 * breathing organic feel reminiscent of hills, leaves, and flowing water.
 */
export default function OrganicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    // Organic particle system — flowing seeds/spores
    const particles: Array<{
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      phase: number
    }> = []

    const particleCount = 35
    const w = () => canvas.offsetWidth
    const h = () => canvas.offsetHeight

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.4 - 0.1,
        opacity: Math.random() * 0.4 + 0.2,
        phase: Math.random() * Math.PI * 2,
      })
    }

    const draw = () => {
      const width = w()
      const height = h()

      // Base gradient — deep forest to lighter green
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, '#1B4332')
      gradient.addColorStop(0.5, '#2D6A4F')
      gradient.addColorStop(1, '#40916C')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      time += 0.008

      // Draw organic blob shapes (hills)
      const drawBlob = (
        baseY: number,
        amplitude: number,
        frequency: number,
        phase: number,
        color: string
      ) => {
        ctx.beginPath()
        ctx.moveTo(0, height)
        for (let x = 0; x <= width; x += 3) {
          const y =
            baseY +
            Math.sin(x * frequency + time + phase) * amplitude +
            Math.sin(x * frequency * 1.7 + time * 0.7 + phase) * amplitude * 0.5
          ctx.lineTo(x, y)
        }
        ctx.lineTo(width, height)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
      }

      // Layered hills
      drawBlob(height * 0.35, 40, 0.003, 0, 'rgba(45, 106, 79, 0.6)')
      drawBlob(height * 0.45, 50, 0.004, 2, 'rgba(64, 145, 108, 0.5)')
      drawBlob(height * 0.6, 45, 0.0025, 4, 'rgba(82, 183, 136, 0.4)')
      drawBlob(height * 0.75, 35, 0.0035, 1, 'rgba(116, 198, 157, 0.3)')

      // Draw particles (floating seeds)
      particles.forEach((p) => {
        p.x += p.speedX + Math.sin(time + p.phase) * 0.2
        p.y += p.speedY
        p.phase += 0.01

        // Wrap around
        if (p.y < -10) {
          p.y = height + 10
          p.x = Math.random() * width
        }
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(244, 241, 222, ${p.opacity})`
        ctx.fill()

        // Tiny leaf shape on some particles
        if (p.size > 2.5) {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(time * 0.5 + p.phase)
          ctx.beginPath()
          ctx.ellipse(4, 0, 3, 1.5, 0, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(244, 241, 222, ${p.opacity * 0.5})`
          ctx.fill()
          ctx.restore()
        }
      })

      // Subtle terracotta accent orb
      const orbX = width * 0.7 + Math.sin(time * 0.3) * 30
      const orbY = height * 0.25 + Math.cos(time * 0.4) * 20
      const orbGradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 80)
      orbGradient.addColorStop(0, 'rgba(224, 122, 95, 0.15)')
      orbGradient.addColorStop(1, 'rgba(224, 122, 95, 0)')
      ctx.fillStyle = orbGradient
      ctx.fillRect(0, 0, width, height)

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}
