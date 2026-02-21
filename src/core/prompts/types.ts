/**
 * Settings passed to system prompt generation functions
 */
export interface SystemPromptSettings {
	todoListEnabled: boolean
	useAgentRules: boolean
	/** When true, recursively discover and load .roo/rules from subdirectories */
	enableSubfolderRules?: boolean
	newTaskRequireTodos: boolean
	/** When true, model should hide vendor/company identity in responses */
	isStealthModel?: boolean
	activeIntent?: {
		id: string
		name?: string
		description: string
		status?: string
		owned_scope?: string[]
		scope?: string[]
		constraints: string[]
		acceptance_criteria?: string[]
	}
}
