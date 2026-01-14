#!/usr/bin/env node
// Generates manifest.json listing all Python files in quartz/static/python/

import { readdirSync, statSync, writeFileSync } from "fs"
import { join, relative } from "path"

const PYTHON_DIR = "quartz/static/python"
const MANIFEST_PATH = join(PYTHON_DIR, "manifest.json")

function findPythonFiles(dir, baseDir = dir) {
  const files = []

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...findPythonFiles(fullPath, baseDir))
    } else if (entry.endsWith(".py")) {
      files.push(relative(baseDir, fullPath))
    }
  }

  return files
}

const pythonFiles = findPythonFiles(PYTHON_DIR)
writeFileSync(MANIFEST_PATH, JSON.stringify(pythonFiles, null, 2))

console.log(`Generated ${MANIFEST_PATH} with ${pythonFiles.length} Python files`)
