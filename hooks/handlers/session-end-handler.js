#!/usr/bin/env node

// Ucai SessionEnd Hook
// Cleans up stale iterate state file when the session terminates

const fs = require("fs")

const STATE_FILE = ".claude/ucai-iterate.local.md"
const SHIP_STATE_FILE = ".claude/ucai-ship.local.md"
const FORMATTER_CACHE = ".claude/ucai-formatter-cache.local.json"
const BUILD_ENGINE_FILE = ".claude/ucai-build-engine.local.json"
const SHIP_ENGINE_FILE = ".claude/ucai-ship-engine.local.json"

let input = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => (input += chunk))
process.stdin.on("end", () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE)
      console.error("Ucai: iterate state cleared on session end")
    }
    if (fs.existsSync(SHIP_STATE_FILE)) {
      fs.unlinkSync(SHIP_STATE_FILE)
      console.error("Ucai: ship state cleared on session end")
    }
    if (fs.existsSync(FORMATTER_CACHE)) {
      fs.unlinkSync(FORMATTER_CACHE)
      console.error("Ucai: formatter cache cleared on session end")
    }
    if (fs.existsSync(BUILD_ENGINE_FILE)) {
      fs.unlinkSync(BUILD_ENGINE_FILE)
      console.error("Ucai: build engine state cleared on session end")
    }
    if (fs.existsSync(SHIP_ENGINE_FILE)) {
      fs.unlinkSync(SHIP_ENGINE_FILE)
      console.error("Ucai: ship engine state cleared on session end")
    }
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
