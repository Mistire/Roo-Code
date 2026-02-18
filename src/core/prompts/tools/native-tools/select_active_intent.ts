import type OpenAI from "openai"

const SELECT_ACTIVE_INTENT_DESCRIPTION = `Select an active intent from .orchestration/active_intents.yaml to authorize and contextualize your subsequent actions. 

CRITICAL: You MUST call this tool before performing any state-changing actions (like write_to_file or execute_command). Failure to do so will result in execution blocking. This tool loads the specific governance constraints and architectural scope for your chosen intent.`

const INTENT_ID_PARAMETER_DESCRIPTION = `The unique ID of the intent as defined in .orchestration/active_intents.yaml (e.g., initial-dig)`

export default {
	type: "function",
	function: {
		name: "select_active_intent",
		description: SELECT_ACTIVE_INTENT_DESCRIPTION,
		strict: true,
		parameters: {
			type: "object",
			properties: {
				intent_id: {
					type: "string",
					description: INTENT_ID_PARAMETER_DESCRIPTION,
				},
			},
			required: ["intent_id"],
			additionalProperties: false,
		},
	},
} satisfies OpenAI.Chat.ChatCompletionTool
