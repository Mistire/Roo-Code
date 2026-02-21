import { HookEnginePlugin, PreToolUseParams, PostToolUseParams } from "./HookEngine"
import * as crypto from "crypto"
import * as fs from "fs/promises"
import * as path from "path"

export class OptimisticLockingPlugin implements HookEnginePlugin {
	name = "OptimisticLocking"

	private isStateChangingTool(toolName: string): boolean {
		return ["write_to_file", "apply_diff", "edit", "search_replace", "edit_file", "apply_patch"].includes(toolName)
	}

	private getFilePath(params: any): string | undefined {
		return params?.path || params?.file_path
	}

	async preToolUse(params: PreToolUseParams) {
		const { toolName, params: toolParams, task } = params

		if (!this.isStateChangingTool(toolName)) return
		const filePath = this.getFilePath(toolParams)
		if (!filePath) return

		const knownHashes = (task as any).knownFileHashes as Map<string, string> | undefined
		const fullPath = path.resolve(task.cwd, filePath)

		let currentHash: string | null = null
		try {
			const content = await fs.readFile(fullPath, "utf-8")
			currentHash = crypto.createHash("sha256").update(content).digest("hex")
		} catch (error) {
			// File doesn't exist or cannot be read - safe to proceed
		}

		if (currentHash !== null && knownHashes) {
			const knownHash = knownHashes.get(fullPath)
			// If we know the previous hash, and it differs from the current disk hash, block it.
			if (knownHash !== undefined && knownHash !== currentHash) {
				throw new Error(
					`Stale File Error: The file '${filePath}' was modified externally since you last read or wrote it. ` +
						`Please use 'read_file' to get the latest content before attempting to edit it again to prevent overwriting parallel changes.`,
				)
			}
		}
	}

	async postToolUse(params: PostToolUseParams) {
		const { toolName, params: toolParams, task } = params

		const isTrackableRead = ["read_file"].includes(toolName)
		const isTrackableWrite = this.isStateChangingTool(toolName)

		if (!isTrackableRead && !isTrackableWrite) return
		const filePath = this.getFilePath(toolParams)
		if (!filePath) return

		if (!(task as any).knownFileHashes) {
			;(task as any).knownFileHashes = new Map<string, string>()
		}
		const knownHashes = (task as any).knownFileHashes as Map<string, string>

		const fullPath = path.resolve(task.cwd, filePath)
		try {
			const content = await fs.readFile(fullPath, "utf-8")
			const hash = crypto.createHash("sha256").update(content).digest("hex")
			knownHashes.set(fullPath, hash)
		} catch (error) {
			// File might have been deleted or is binary enum
			knownHashes.delete(fullPath)
		}
	}
}

export const optimisticLockingPlugin = new OptimisticLockingPlugin()
