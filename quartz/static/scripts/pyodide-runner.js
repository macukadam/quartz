let pyodide = null

async function initPyodide() {
  while (typeof loadPyodide === "undefined") {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  if (!pyodide) {
    pyodide = await loadPyodide()
  }
  return pyodide
}

document.addEventListener("DOMContentLoaded", () => {
  const pythonBlocks = document.querySelectorAll(
    'pre[data-language="python"], pre code[data-language="python"], pre code.language-python',
  )

  pythonBlocks.forEach((node) => {
    const block = node.tagName === "PRE" ? node : node.closest("pre")
    const code = node.tagName === "CODE" ? node : node.querySelector("code")
    if (!block || !code || block.dataset.pyodideAttached === "true") {
      return
    }

    block.dataset.pyodideAttached = "true"
    console.log("Found Python code block")
    console.log("Code content:", code.textContent)

    const btn = document.createElement("button")
    console.log("Creating run button")
    btn.textContent = "▶ Run"
    btn.className = "pyodide-run-btn"

    const output = document.createElement("pre")
    console.log("Creating output area")
    output.className = "pyodide-output"
    output.style.display = "none"

    btn.onclick = async () => {
      btn.textContent = "⏳ Running..."
      btn.disabled = true

      try {
        const py = await initPyodide()
        console.log("Pyodide initialized")

        // Capture stdout
        py.runPython(`
          import sys
          from io import StringIO
          sys.stdout = StringIO()
        `)

        py.runPython(code.textContent)

        const stdout = py.runPython("sys.stdout.getvalue()")
        output.textContent = stdout || "(no output)"
        output.style.display = "block"
      } catch (e) {
        output.textContent = "Error: " + e.message
        output.style.display = "block"
      }

      btn.textContent = "▶ Run"
      btn.disabled = false
    }

    block.style.position = "relative"
    block.appendChild(btn)
    block.after(output)
  })
})
