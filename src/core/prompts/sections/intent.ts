export function getIntentSection(activeIntent?: {
	id: string
	name?: string
	description: string
	status?: string
	owned_scope?: string[]
	scope?: string[]
	constraints: string[]
	acceptance_criteria?: string[]
}): string {
	let section = `# Intent Governance & Handshake (State Machine)

Before performing any state-changing actions (write_to_file, execute_command, apply_diff, etc.), you MUST select an active intent from '.orchestration/active_intents.yaml' using the 'select_active_intent' tool. 

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
	}

	return section
}
