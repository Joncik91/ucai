#!/usr/bin/env node

// Ucai Stop Hook
// Prevents session exit when an /iterate loop is active
// Feeds the task back as input to continue the loop

const fs = require("fs");
const readline = require("readline");

const STATE_FILE = ".claude/ucai-iterate.local.md";

// Check if iterate loop is active
if (!fs.existsSync(STATE_FILE)) {
  process.exit(0);
}

// Read hook input from stdin
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    run(input);
  } catch (err) {
    console.error("Ucai iterate: " + err.message);
    cleanup();
    process.exit(0);
  }
});

function cleanup() {
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {}
}

function run(hookInput) {
  const stateContent = fs.readFileSync(STATE_FILE, "utf8");

  // Parse markdown frontmatter (YAML between ---)
  const fmMatch = stateContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    console.error("Ucai iterate: State file has no frontmatter");
    cleanup();
    process.exit(0);
  }

  const frontmatter = fmMatch[1];
  const promptText = fmMatch[2].trim();

  // Parse YAML fields
  function getField(name) {
    const m = frontmatter.match(new RegExp("^" + name + ":\\s*(.*)$", "m"));
    return m ? m[1].trim() : null;
  }

  const iteration = parseInt(getField("iteration"), 10);
  const maxIterations = parseInt(getField("max_iterations"), 10);
  let completionPromise = getField("completion_promise");

  // Strip quotes from completion_promise
  if (
    completionPromise &&
    completionPromise.startsWith('"') &&
    completionPromise.endsWith('"')
  ) {
    completionPromise = completionPromise.slice(1, -1);
  }

  // Validate numeric fields
  if (isNaN(iteration)) {
    console.error(
      "Ucai iterate: State file corrupted (iteration: '" +
        getField("iteration") +
        "')"
    );
    cleanup();
    process.exit(0);
  }

  if (isNaN(maxIterations)) {
    console.error(
      "Ucai iterate: State file corrupted (max_iterations: '" +
        getField("max_iterations") +
        "')"
    );
    cleanup();
    process.exit(0);
  }

  // Check if max iterations reached
  if (maxIterations > 0 && iteration >= maxIterations) {
    console.error(
      "Ucai iterate: Max iterations (" + maxIterations + ") reached."
    );
    cleanup();
    process.exit(0);
  }

  // Parse hook input for transcript path
  let transcriptPath = null;
  try {
    const hookData = JSON.parse(hookInput);
    transcriptPath = hookData.transcript_path;
  } catch {
    console.error("Ucai iterate: Failed to parse hook input");
    cleanup();
    process.exit(0);
  }

  // Check completion promise against transcript
  if (
    completionPromise &&
    completionPromise !== "null" &&
    transcriptPath &&
    fs.existsSync(transcriptPath)
  ) {
    const transcript = fs.readFileSync(transcriptPath, "utf8");
    const lines = transcript.trim().split("\n");

    // Find last assistant message (JSONL format)
    let lastAssistantLine = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('"role":"assistant"')) {
        lastAssistantLine = lines[i];
        break;
      }
    }

    if (lastAssistantLine) {
      try {
        const msg = JSON.parse(lastAssistantLine);
        const textParts = (msg.message?.content || [])
          .filter((c) => c.type === "text")
          .map((c) => c.text);
        const lastOutput = textParts.join("\n");

        // Check for <promise>...</promise> tag
        const promiseMatch = lastOutput.match(
          /<promise>([\s\S]*?)<\/promise>/
        );
        if (promiseMatch) {
          const promiseText = promiseMatch[1].trim().replace(/\s+/g, " ");
          if (promiseText === completionPromise) {
            console.error(
              "Ucai iterate: Completion promise met - <promise>" +
                completionPromise +
                "</promise>"
            );
            cleanup();
            process.exit(0);
          }
        }
      } catch {
        // Failed to parse assistant message, continue loop
      }
    }
  }

  // Not complete - continue loop
  const nextIteration = iteration + 1;

  if (!promptText) {
    console.error("Ucai iterate: No task prompt found in state file");
    cleanup();
    process.exit(0);
  }

  // Update iteration counter in state file
  const updatedContent = stateContent.replace(
    /^iteration:\s*\d+/m,
    "iteration: " + nextIteration
  );
  fs.writeFileSync(STATE_FILE, updatedContent);

  // Build system message
  let systemMsg;
  if (completionPromise && completionPromise !== "null") {
    systemMsg =
      "Ucai iteration " +
      nextIteration +
      "/" +
      maxIterations +
      " | To complete: output <promise>" +
      completionPromise +
      "</promise> (ONLY when TRUE)";
  } else {
    const maxDisplay = maxIterations > 0 ? maxIterations : "unlimited";
    systemMsg =
      "Ucai iteration " + nextIteration + " | Max: " + maxDisplay;
  }

  // Block exit and feed task back
  const result = JSON.stringify({
    decision: "block",
    reason: promptText,
    systemMessage: systemMsg,
  });

  process.stdout.write(result);
  process.exit(0);
}
