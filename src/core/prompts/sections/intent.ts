export function getIntentSection(activeIntent?: {
	id: string
	description: string
	scope: string[]
	constraints: string[]
}): string {
	let section = `# Intent Governance & Handshake (State Machine)

Before performing any state-changing actions (write_to_file, execute_command, apply_diff, etc.), you MUST select an active intent from '.orchestration/active_intents.yaml' using the 'select_active_intent' tool. 

FAILURE TO DO SO WILL RESULT IN AUTOMATIC EXECUTION BLOCKING.
`

	if (activeIntent) {
		section += `
## ACTIVE INTENT: ${activeIntent.id}
**Description**: ${activeIntent.description}
**Authorized Scope**: ${JSON.stringify(activeIntent.scope)}
**Constraint Enforced**: 
${activeIntent.constraints.map((c) => `- ${c}`).join("\n")}

CRITICAL: You are authorized to modify ONLY files within the scope patterns listed above. Any attempt to modify files outside this scope will be REJECTED by the governance middleware.
`
	} else {
		section += `
WARNING: No intent is currently active. Your FIRST action for any request involving codebase changes MUST be to analyze the requirements and call 'select_active_intent' with the appropriate ID.
`
	}

	return section
}
