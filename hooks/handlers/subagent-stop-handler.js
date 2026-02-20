#!/usr/bin/env node

// Ucai SubagentStop Hook
// Blocks subagents that produce empty final messages
// Injects a one-line result preview into the main session context

const PREVIEW_LENGTH = 150

let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input)

    if (data.stop_hook_active) {
      process.exit(0)
    }

    const agentType = data.agent_type || "Unknown"
    const message = data.last_assistant_message || ""

    if (message.trim().length === 0) {
      process.stdout.write(JSON.stringify({
        decision: "block",
        reason: "Produce a substantive response before completing. Summarize what you found, what you did, or why the task cannot be completed."
      }))
      process.exit(0)
    }

    const normalized = message.trim().replace(/\r?\n/g, " ")
    const preview = normalized.length > PREVIEW_LENGTH
      ? normalized.slice(0, PREVIEW_LENGTH) + "..."
      : normalized

    process.stdout.write(JSON.stringify({
      systemMessage: "Subagent " + agentType + ": " + preview
    }))
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
