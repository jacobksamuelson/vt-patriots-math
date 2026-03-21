export interface InputState {
  mouseX: number
  mouseY: number
  clicked: boolean
}

export interface GameState {
  update(dt: number, input: InputState): void
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void
  isComplete(): boolean
  getScore(): number
}

/**
 * Starts a requestAnimationFrame game loop on the given canvas.
 * Returns a cleanup function that stops the loop and removes listeners.
 */
export function startGameLoop(
  canvas: HTMLCanvasElement,
  state: GameState,
  onComplete: (score: number) => void,
): () => void {
  const ctx = canvas.getContext('2d')!
  let running = true
  let lastTime = 0
  let animId = 0

  const input: InputState = { mouseX: 0, mouseY: 0, clicked: false }

  function getCanvasPos(e: MouseEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function onMouseMove(e: MouseEvent) {
    const pos = getCanvasPos(e)
    input.mouseX = pos.x
    input.mouseY = pos.y
  }

  function onMouseDown(e: MouseEvent) {
    const pos = getCanvasPos(e)
    input.mouseX = pos.x
    input.mouseY = pos.y
    input.clicked = true
  }

  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mousedown', onMouseDown)

  function frame(time: number) {
    if (!running) return

    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0.016
    lastTime = time

    state.update(dt, input)
    input.clicked = false // consume click

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    state.render(ctx, canvas.width, canvas.height)

    if (state.isComplete()) {
      running = false
      onComplete(state.getScore())
      return
    }

    animId = requestAnimationFrame(frame)
  }

  animId = requestAnimationFrame(frame)

  return () => {
    running = false
    cancelAnimationFrame(animId)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mousedown', onMouseDown)
  }
}
