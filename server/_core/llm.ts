// Claude API (Anthropic Messages API) クライアント。
// 旧Manus Forge API と同じ invokeLLM インターフェースを維持している。
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: string;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "url"; url: string } }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const toAnthropicBlocks = (
  parts: MessageContent[]
): Array<{ type: "text"; text: string } | { type: "image"; source: { type: "url"; url: string } }> =>
  parts.map(part => {
    if (typeof part === "string") {
      return { type: "text" as const, text: part };
    }
    if (part.type === "text") {
      return { type: "text" as const, text: part.text };
    }
    if (part.type === "image_url") {
      return {
        type: "image" as const,
        source: { type: "url" as const, url: part.image_url.url },
      };
    }
    throw new Error(`Unsupported message content part: ${part.type}`);
  });

const normalizeResponseFormat = (params: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}): JsonSchema | undefined => {
  const explicit = params.responseFormat || params.response_format;
  if (explicit) {
    if (explicit.type === "json_schema") {
      if (!explicit.json_schema?.schema) {
        throw new Error(
          "responseFormat json_schema requires a defined schema object"
        );
      }
      return explicit.json_schema;
    }
    return undefined;
  }

  const schema = params.outputSchema || params.output_schema;
  if (!schema) return undefined;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return schema;
};

function assertApiKey() {
  if (!ENV.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set it to use LLM features."
    );
  }
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const systemParts: string[] = [];
  const anthropicMessages: Array<{
    role: "user" | "assistant";
    content: ReturnType<typeof toAnthropicBlocks>;
  }> = [];

  for (const message of params.messages) {
    const parts = ensureArray(message.content);
    if (message.role === "system") {
      systemParts.push(
        parts
          .map(p => (typeof p === "string" ? p : p.type === "text" ? p.text : ""))
          .join("\n")
      );
      continue;
    }
    const role = message.role === "assistant" ? "assistant" : "user";
    anthropicMessages.push({ role, content: toAnthropicBlocks(parts) });
  }

  const jsonSchema = normalizeResponseFormat(params);

  const payload: Record<string, unknown> = {
    model: ENV.anthropicModel,
    max_tokens: params.maxTokens ?? params.max_tokens ?? 4096,
    messages: anthropicMessages,
  };
  if (systemParts.length > 0) {
    payload.system = systemParts.join("\n\n");
  }

  // JSONスキーマ指定時は tool を強制してスキーマ準拠のJSONを得る
  if (jsonSchema) {
    payload.tools = [
      {
        name: jsonSchema.name,
        description: "Return the result in the required JSON format.",
        input_schema: jsonSchema.schema,
      },
    ];
    payload.tool_choice = { type: "tool", name: jsonSchema.name };
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const data = (await response.json()) as {
    id: string;
    model: string;
    stop_reason: string | null;
    content: AnthropicContentBlock[];
    usage?: { input_tokens: number; output_tokens: number };
  };

  // 応答をOpenAI互換のInvokeResultへ変換（既存呼び出し側との互換のため）
  let content = "";
  const toolCalls: ToolCall[] = [];
  for (const block of data.content) {
    if (block.type === "text") {
      content += block.text;
    } else if (block.type === "tool_use") {
      if (jsonSchema && block.name === jsonSchema.name) {
        content = JSON.stringify(block.input);
      } else {
        toolCalls.push({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }
  }

  return {
    id: data.id,
    created: Math.floor(Date.now() / 1000),
    model: data.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: data.stop_reason,
      },
    ],
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
        }
      : undefined,
  };
}
