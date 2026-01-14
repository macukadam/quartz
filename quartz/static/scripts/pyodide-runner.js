let pyodide = null
let modulesLoaded = false

async function initPyodide() {
  while (typeof loadPyodide === "undefined") {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  if (!pyodide) {
    pyodide = await loadPyodide()
  }

  // Load shared modules if not already loaded
  if (!modulesLoaded) {
    // Use the injected static base path from Quartz (absolute URL)
    const staticPythonBase = window.__PYODIDE_STATIC_BASE__ || "/static/python/"

    try {
      // Fetch the auto-generated manifest
      const manifestUrl = staticPythonBase + "manifest.json"
      const manifestResponse = await fetch(manifestUrl)
      if (!manifestResponse.ok) {
        console.warn("Python manifest not found. Run the build to generate it.")
        modulesLoaded = true
        return pyodide
      }

      const modules = await manifestResponse.json()

      // Add root to Python path so imports work
      pyodide.runPython(`
        import sys
        if '/' not in sys.path:
            sys.path.insert(0, '/')
      `)

      // Track created directories to avoid duplicates
      const createdDirs = new Set()

      for (const modulePath of modules) {
        try {
          // Create parent directories if needed
          const parts = modulePath.split("/")
          if (parts.length > 1) {
            let dirPath = ""
            for (let i = 0; i < parts.length - 1; i++) {
              dirPath += "/" + parts[i]
              if (!createdDirs.has(dirPath)) {
                try {
                  pyodide.FS.mkdir(dirPath)
                } catch (e) {
                  // Directory might already exist
                }
                createdDirs.add(dirPath)
              }
            }
          }

          const moduleUrl = staticPythonBase + modulePath
          const response = await fetch(moduleUrl)
          if (response.ok) {
            const moduleCode = await response.text()
            pyodide.FS.writeFile(`/${modulePath}`, moduleCode)
          }
        } catch (e) {
          console.warn(`Could not load Python module ${modulePath}:`, e)
        }
      }
    } catch (e) {
      console.warn("Could not load Python modules:", e)
    }

    modulesLoaded = true
  }

  return pyodide
}

const attachPyodideButtons = () => {
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

    const btn = document.createElement("button")
    btn.textContent = "▶ Run"
    btn.className = "pyodide-run-btn"

    const output = document.createElement("pre")
    output.className = "pyodide-output"
    output.style.display = "none"

    btn.onclick = async () => {
      btn.textContent = "⏳ Running..."
      btn.disabled = true

      try {
        const py = await initPyodide()

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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attachPyodideButtons)
} else {
  attachPyodideButtons()
}

document.addEventListener("nav", attachPyodideButtons)
