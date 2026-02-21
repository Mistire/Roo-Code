/**
 * Command Classification Utility
 *
 * Classifies shell commands as "safe" (read-only) or "destructive" (state-changing).
 * Used by the governance layer to determine if HITL (Human-in-the-Loop)
 * authorization is needed before executing a command.
 */

export type CommandClassification = "safe" | "destructive"

/**
 * Commands/prefixes that are known to be read-only (safe).
 * If a command starts with any of these, it's classified as safe.
 */
const SAFE_COMMANDS = [
	"ls",
	"dir",
	"cat",
	"head",
	"tail",
	"less",
	"more",
	"echo",
	"pwd",
	"whoami",
	"which",
	"where",
	"type",
	"file",
	"wc",
	"find",
	"grep",
	"rg",
	"ag",
	"fd",
	"tree",
	"du",
	"df",
	"env",
	"printenv",
	"uname",
	"date",
	"uptime",
	"git status",
	"git log",
	"git diff",
	"git show",
	"git branch",
	"git remote",
	"git tag",
	"node --version",
	"npm --version",
	"pnpm --version",
	"python --version",
	"tsc --version",
	"npx tsc --noEmit",
]

/**
 * Commands/prefixes that are known to be destructive (state-changing).
 * These should trigger HITL authorization.
 */
const DESTRUCTIVE_COMMANDS = [
	"rm ",
	"rm -",
	"rmdir",
	"del ",
	"unlink",
	"mv ",
	"rename",
	"chmod",
	"chown",
	"mkfs",
	"dd ",
	"format",
	"git push",
	"git reset --hard",
	"git clean",
	"git checkout -- ",
	"npm publish",
	"npm unpublish",
	"docker rm",
	"docker rmi",
	"kubectl delete",
	"sudo ",
	"su ",
	"shutdown",
	"reboot",
	"kill ",
	"killall",
	"pkill",
	"DROP TABLE",
	"DROP DATABASE",
	"DELETE FROM",
	"TRUNCATE",
]

/**
 * Classify a shell command as safe or destructive.
 *
 * @param command - The shell command string to classify
 * @returns "safe" if the command is read-only, "destructive" if it modifies state
 */
export function classifyCommand(command: string): CommandClassification {
	const trimmed = command.trim()
	const lowered = trimmed.toLowerCase()

	// Check safe commands first (higher priority for explicit matches)
	for (const safeCmd of SAFE_COMMANDS) {
		if (lowered === safeCmd || lowered.startsWith(safeCmd + " ") || lowered.startsWith(safeCmd + "\t")) {
			return "safe"
		}
	}

	// Check destructive commands
	for (const destructiveCmd of DESTRUCTIVE_COMMANDS) {
		if (lowered.startsWith(destructiveCmd.toLowerCase())) {
			return "destructive"
		}
	}

	// Default: commands that install packages or build are generally fine
	// but unknown commands are treated as destructive to be safe
	const buildCommands = ["npm run", "npm test", "npm install", "npm i ", "pnpm ", "yarn ", "npx ", "pip ", "cargo "]
	for (const buildCmd of buildCommands) {
		if (lowered.startsWith(buildCmd)) {
			return "safe"
		}
	}

	// Default to destructive for unknown commands (fail-safe principle)
	return "destructive"
}
