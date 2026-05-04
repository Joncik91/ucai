#!/usr/bin/env node

// Ucai SessionEnd Hook
// Cleans up stale iterate state file when the session terminates.
// Engine state files are only deleted when the pipeline has reached "complete"
// state — mid-flight engines survive SessionEnd so gate enforcement is not lost
// when a subagent stop or inactivity timeout fires before Phase 8 finishes.

const fs = require("fs")
const path = require("path")

const STATE_FILE = ".claude/ucai-iterate.local.md"
const SHIP_STATE_FILE = ".claude/ucai-ship.local.md"
const FORMATTER_CACHE = ".claude/ucai-formatter-cache.local.json"
const BUILD_ENGINE_FILE = ".claude/ucai-build-engine.local.json"
const SHIP_ENGINE_FILE = ".claude/ucai-ship-engine.local.json"

// Returns true only when the engine JSON indicates the pipeline has fully
// completed (project.state === "complete"). Returns false if the file is
// absent, unreadable, or mid-flight — caller must NOT delete in that case.
function isPipelineComplete(engineFile) {
  try {
    if (!fs.existsSync(engineFile)) return false
    const data = JSON.parse(fs.readFileSync(engineFile, "utf8"))
    return data.snapshot && data.snapshot.project && data.snapshot.project.state === "complete"
  } catch {
    return false
  }
}

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
    if (isPipelineComplete(BUILD_ENGINE_FILE)) {
      fs.unlinkSync(BUILD_ENGINE_FILE)
      console.error("Ucai: build engine state cleared on session end (pipeline complete)")
    } else if (fs.existsSync(BUILD_ENGINE_FILE)) {
      console.error("Ucai: build engine state preserved on session end (pipeline not complete)")
    }
    if (isPipelineComplete(SHIP_ENGINE_FILE)) {
      fs.unlinkSync(SHIP_ENGINE_FILE)
      console.error("Ucai: ship engine state cleared on session end (pipeline complete)")
    } else if (fs.existsSync(SHIP_ENGINE_FILE)) {
      console.error("Ucai: ship engine state preserved on session end (pipeline not complete)")
    }
    process.exit(0)
  } catch {
    process.exit(0)
  }
})
