import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Element } from "hast"

/**
 * Parses an SVG string and calculates the bounding box from all transform attributes.
 * Returns a viewBox string or null if unable to calculate.
 */
function calculateViewBox(
  svgContent: string,
): { viewBox: string; width: number; height: number } | null {
  // Find all translate transforms: translate(x, y) or translate(x y)
  const translateRegex = /translate\(\s*([-\d.]+)[\s,]+([-\d.]+)\s*\)/g

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  // Extract all translate coordinates
  let match
  while ((match = translateRegex.exec(svgContent)) !== null) {
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + 150) // Estimate element size
      maxY = Math.max(maxY, y + 150)
    }
  }

  // Also check for font-size to estimate text bounds
  const fontSizeRegex = /font-size="([-\d.]+)(?:px)?"/g
  const fontSizes: number[] = []
  while ((match = fontSizeRegex.exec(svgContent)) !== null) {
    fontSizes.push(parseFloat(match[1]))
  }
  const maxFontSize = fontSizes.length > 0 ? Math.max(...fontSizes) : 20

  // Look for path data to find actual bounds
  const pathRegex = /<path[^>]*d="([^"]+)"/g
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const pathData = match[1]
    // Extract all numbers from path data (simplified parsing)
    const numbers = pathData.match(/-?\d+\.?\d*/g)
    if (numbers) {
      for (let i = 0; i < numbers.length; i += 2) {
        const x = parseFloat(numbers[i])
        const y = parseFloat(numbers[i + 1])
        if (!isNaN(x) && !isNaN(y)) {
          // These are relative to the transform, so just track for size estimation
        }
      }
    }
  }

  // Check for text elements to get better bounds
  const textTransformRegex =
    /<g[^>]*transform="translate\(\s*([-\d.]+)[\s,]+([-\d.]+)\s*\)[^"]*"[^>]*>[\s\S]*?<text[^>]*>([\s\S]*?)<\/text>/g
  while ((match = textTransformRegex.exec(svgContent)) !== null) {
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    const textContent = match[3]
    if (!isNaN(x) && !isNaN(y)) {
      // Estimate text width based on content length and font size
      const estimatedWidth = textContent.length * maxFontSize * 0.6
      maxX = Math.max(maxX, x + estimatedWidth)
      maxY = Math.max(maxY, y + maxFontSize * 1.5)
    }
  }

  if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
    return null
  }

  // Add padding
  const padding = 10
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding

  const width = maxX - minX
  const height = maxY - minY

  return {
    viewBox: `${minX} ${minY} ${width} ${height}`,
    width,
    height,
  }
}

/**
 * Adds viewBox attribute to an SVG that doesn't have one.
 */
function addViewBoxToSvg(svgContent: string): string {
  // Check if SVG already has a viewBox
  if (/viewBox\s*=/.test(svgContent)) {
    return svgContent
  }

  const bounds = calculateViewBox(svgContent)
  if (!bounds) {
    return svgContent
  }

  // Insert viewBox and dimensions into the SVG tag
  return svgContent.replace(
    /<svg([^>]*)>/,
    `<svg$1 viewBox="${bounds.viewBox}" width="${bounds.width}" height="${bounds.height}">`,
  )
}

/**
 * Transforms Excalidraw div elements (with base64 background-image) into proper <img> tags.
 * Also adds viewBox to SVGs that don't have one, fixing rendering issues.
 */
export const ExcalidrawImages: QuartzTransformerPlugin = () => {
  return {
    name: "ExcalidrawImages",
    htmlPlugins() {
      return [
        () => {
          return (tree: Root) => {
            visit(tree, "element", (node: Element, index, parent) => {
              // Look for div elements with excalidraw-svg class
              if (
                node.tagName === "div" &&
                node.properties?.className &&
                Array.isArray(node.properties.className) &&
                node.properties.className.includes("excalidraw-svg")
              ) {
                const style = node.properties.style as string | undefined
                if (!style) return

                // Extract the base64 data URL from background-image
                const bgMatch = style.match(/background-image:\s*url\(([^)]+)\)/)
                if (!bgMatch) return

                let dataUrl = bgMatch[1]
                // Remove quotes if present
                dataUrl = dataUrl.replace(/^["']|["']$/g, "")

                // Process the SVG to add viewBox if missing
                if (dataUrl.startsWith("data:image/svg+xml;base64,")) {
                  try {
                    const base64Data = dataUrl.replace("data:image/svg+xml;base64,", "")
                    const svgContent = Buffer.from(base64Data, "base64").toString("utf-8")
                    const fixedSvg = addViewBoxToSvg(svgContent)
                    const newBase64 = Buffer.from(fixedSvg).toString("base64")
                    dataUrl = `data:image/svg+xml;base64,${newBase64}`
                  } catch (e) {
                    // If processing fails, use original
                    console.warn("Failed to process Excalidraw SVG:", e)
                  }
                }

                // Determine if this is dark or light mode version
                const classes = node.properties.className as string[]
                const isDark = classes.includes("excalidraw-dark")
                const isLight = classes.includes("excalidraw-light")

                // Create new img element
                const imgNode: Element = {
                  type: "element",
                  tagName: "img",
                  properties: {
                    src: dataUrl,
                    className: [
                      "excalidraw-img",
                      isDark ? "excalidraw-dark" : isLight ? "excalidraw-light" : "",
                    ],
                    alt: "Excalidraw diagram",
                    loading: "lazy",
                  },
                  children: [],
                }

                // Replace the div with the img
                if (parent && typeof index === "number") {
                  ;(parent as Element).children[index] = imgNode
                }
              }
            })
          }
        },
      ]
    },
  }
}
