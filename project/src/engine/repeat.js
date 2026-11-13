// 按住连续移动：按下时立即走一步，停顿后按固定间隔连续走。
// step() 返回 false 表示无法继续（撞墙、弹出窗口、战斗确认等），此时自动停止。
export function createHoldRepeat(step, { delay = 230, interval = 140 } = {}) {
  let timeout = null
  let timer = null

  function stop() {
    clearTimeout(timeout)
    clearInterval(timer)
    timeout = null
    timer = null
  }

  function start() {
    stop()
    if (!step()) return
    timeout = setTimeout(() => {
      timer = setInterval(() => {
        if (!step()) stop()
      }, interval)
    }, delay)
  }

  return { start, stop, get active() { return timer !== null || timeout !== null } }
}
