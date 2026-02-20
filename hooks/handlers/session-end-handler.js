#!/usr/bin/env node

// Ucai SessionEnd Hook
// Cleans up stale iterate state file when the session terminates

const fs = require("fs")

const STATE_FILE = ".claude/ucai-iterate.local.md"

let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE)
      console.error("Ucai: iterate state cleared on session end")
    }
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
