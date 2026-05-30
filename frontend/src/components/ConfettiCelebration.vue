<template>
  <canvas
    ref="canvas"
    class="fixed inset-0 z-[100] pointer-events-none"
    :width="w"
    :height="h"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{ done: [] }>()

const canvas = ref<HTMLCanvasElement>()
const w = ref(window.innerWidth)
const h = ref(window.innerHeight)

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  opacity: number
}

const COLORS = ['#fb7185', '#e11d48', '#fda4af', '#fbbf24', '#f9a8d4', '#c084fc', '#fb923c']
const PARTICLE_COUNT = 70
const DURATION = 2200

let particles: Particle[] = []
let animId = 0
let startTime = 0

function createParticles() {
  const cx = w.value / 2
  const cy = h.value * 0.35
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 6
    particles.push({
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    })
  }
}

function animate(time: number) {
  if (!startTime) startTime = time
  const elapsed = time - startTime
  const progress = elapsed / DURATION

  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, w.value, h.value)

  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.15
    p.rotation += p.rotationSpeed
    p.opacity = Math.max(0, 1 - progress * 1.2)

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
    ctx.restore()
  }

  if (elapsed < DURATION) {
    animId = requestAnimationFrame(animate)
  } else {
    emit('done')
  }
}

onMounted(() => {
  createParticles()
  animId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>
