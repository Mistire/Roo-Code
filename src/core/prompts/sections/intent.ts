import fs from "fs/promises"
import path from "path"
import yaml from "yaml"

export async function getIntentSection(
	cwd: string,
	activeIntent?: {
		id: string
		name?: string
		description: string
		status?: string
		owned_scope?: string[]
		scope?: string[]
		constraints: string[]
		acceptance_criteria?: string[]
	},
): Promise<string> {
	let section = `# Intent Governance & Handshake (State Machine)

Before performing any state-changing actions (write_to_file, execute_command, apply_diff, etc.), you MUST select an active intent from '.orchestration/active_intents.yaml' using the 'select_active_intent' tool. 

STRICT POLICY: 
1. DO NOT select an intent as a "placeholder". You must select the intent that actually defines the work and scope for your current task.
2. Every intent has a strictly defined 'owned_scope'. If you attempt to modify files outside this scope, the system will REJECT the tool call with a 'Scope Violation' error. There is NO bypass or override for this block.
3. If no existing intent matches your needs, you are effectively STUCK. Do not ask the user to "proceed anyway" because the system middleware will still block you. You must ask the human manager to explicitly update '.orchestration/active_intents.yaml' with an appropriate intent or scope expansion before you can continue.

FAILURE TO DO SO WILL RESULT IN AUTOMATIC EXECUTION BLOCKING.
`

	if (activeIntent) {
		const scope = activeIntent.owned_scope || activeIntent.scope || []
		section += `
## ACTIVE INTENT: ${activeIntent.id}
**Name**: ${activeIntent.name || activeIntent.id}
**Description**: ${activeIntent.description}
**Status**: ${activeIntent.status || "IN_PROGRESS"}
**Authorized Scope**: ${JSON.stringify(scope)}
**Constraints Enforced**: 
${activeIntent.constraints.map((c) => `- ${c}`).join("\n")}
`
		if (activeIntent.acceptance_criteria && activeIntent.acceptance_criteria.length > 0) {
			section += `**Acceptance Criteria (Definition of Done)**:
${activeIntent.acceptance_criteria.map((ac) => `- ${ac}`).join("\n")}
`
		}

		section += `
CRITICAL: You are authorized to modify ONLY files within the scope patterns listed above. Any attempt to modify files outside this scope will be REJECTED by the governance middleware.
`
	} else {
		section += `
WARNING: No intent is currently active. Your FIRST action for any request involving codebase changes MUST be to analyze the requirements and call 'select_active_intent' with the appropriate ID.
`
		try {
			const intentsFile = path.join(cwd, ".orchestration", "active_intents.yaml")
			const content = await fs.readFile(intentsFile, "utf-8")
			const parsed = yaml.parse(content)
			if (parsed && Array.isArray(parsed.active_intents)) {
				section += `\nAvailable Intents from .orchestration/active_intents.yaml:\n`
				parsed.active_intents.forEach((intent: any) => {
					if (intent.status !== "COMPLETED") {
						section += `- **${intent.id}**: ${intent.name || "Unnamed"} (Status: ${intent.status})\n`
						if (intent.description) {
							section += `  Description: ${intent.description.trim()}\n`
						}
					}
				})
			}
		} catch (e) {
			// If file doesn't exist or is invalid, just ignore
		}
	}

	return section
}
