#!/usr/bin/env node

// Ucai Lessons Consolidation
// Groups lessons by rule, merges duplicates, keeps last 20 recent entries
// Outputs consolidated content to stdout (does not auto-overwrite)

const fs = require("fs")

const LESSONS_FILE = "tasks/lessons.md"

function main() {
  if (!fs.existsSync(LESSONS_FILE)) {
    console.error("No lessons file found at " + LESSONS_FILE)
    process.exit(1)
  }

  const content = fs.readFileSync(LESSONS_FILE, "utf8")

  // Parse frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!fmMatch) {
    console.error("Lessons file has no frontmatter")
    process.exit(1)
  }

  const body = fmMatch[2]

  // Parse entries: each starts with "## YYYY-MM-DD"
  const entryRegex = /^## (\d{4}-\d{2}-\d{2})\s*[—–-]\s*(.*?)$/gm
  const entries = []
  let match

  while ((match = entryRegex.exec(body)) !== null) {
    const date = match[1]
    const title = match[2].trim()
    const startIdx = match.index + match[0].length

    // Find next entry or end of body
    const nextMatch = entryRegex.exec(body)
    const endIdx = nextMatch ? nextMatch.index : body.length
    // Reset regex to continue from where nextMatch was found
    if (nextMatch) entryRegex.lastIndex = nextMatch.index

    const entryBody = body.slice(startIdx, endIdx).trim()

    // Extract rule if present
    let rule = null
    const ruleMatch = entryBody.match(/\*\*Rule\*\*:\s*(.+)/i)
    if (ruleMatch) {
      rule = ruleMatch[1].trim()
    } else {
      // Try "Prevention:" as alternative
      const preventMatch = entryBody.match(/\*?\*?Prevention\*?\*?:\s*(.+)/i)
      if (preventMatch) rule = preventMatch[1].trim()
    }

    entries.push({ date, title, body: entryBody, rule: rule || title })
  }

  if (entries.length <= 100) {
    console.error("Only " + entries.length + " entries — consolidation not needed (threshold: 100)")
    process.exit(0)
  }

  // Group by normalized rule (lowercase, strip punctuation for fuzzy matching)
  function normalizeRule(rule) {
    return rule.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim()
  }

  const groups = new Map()
  for (const entry of entries) {
    const key = normalizeRule(entry.rule)

    // Find existing group with similar key (simple substring matching)
    let foundKey = null
    for (const [existingKey] of groups) {
      if (existingKey.includes(key) || key.includes(existingKey)) {
        foundKey = existingKey
        break
      }
    }

    const targetKey = foundKey || key
    if (!groups.has(targetKey)) {
      groups.set(targetKey, { rule: entry.rule, entries: [] })
    }
    groups.get(targetKey).entries.push(entry)
  }

  // Sort groups by number of entries (most frequent patterns first)
  const sortedGroups = Array.from(groups.values()).sort(
    (a, b) => b.entries.length - a.entries.length
  )

  // Keep last 20 entries as "Recent"
  const recentEntries = entries.slice(-20)

  // Build consolidated output
  const lines = []
  lines.push("---")
  lines.push("count: " + sortedGroups.length)
  lines.push("consolidated_from: " + entries.length)
  lines.push("consolidated_at: \"" + new Date().toISOString() + "\"")
  lines.push("---")
  lines.push("")
  lines.push("## Patterns")
  lines.push("")

  for (const group of sortedGroups) {
    if (group.entries.length < 2) continue

    lines.push("### " + group.rule)
    lines.push("- **Occurrences**: " + group.entries.length)
    lines.push("- **Dates**: " + group.entries.map((e) => e.date).join(", "))

    const latest = group.entries[group.entries.length - 1]
    if (latest.body) {
      lines.push("- **Context**: " + latest.body.split("\n")[0])
    }
    lines.push("")
  }

  // Singleton patterns
  const singletons = sortedGroups.filter((g) => g.entries.length === 1)
  if (singletons.length > 0) {
    lines.push("## One-Time Lessons")
    lines.push("")
    for (const s of singletons) {
      const entry = s.entries[0]
      lines.push("- **" + entry.date + "**: " + entry.title)
    }
    lines.push("")
  }

  // Recent entries in full detail
  lines.push("## Recent (last 20 entries)")
  lines.push("")
  for (const entry of recentEntries) {
    lines.push("## " + entry.date + " — " + entry.title)
    if (entry.body) lines.push(entry.body)
    lines.push("")
  }

  process.stdout.write(lines.join("\n"))
}

main()
