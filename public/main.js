// `ai` Vercel AI SDK https://ai-sdk.dev/docs/
import { streamText } from "https://cdn.jsdelivr.net/npm/ai@4.3.15/+esm";
// `@ai-sdk/openai` Vercel AI SDK OpenAI Provider https://ai-sdk.dev/providers/ai-sdk-providers/openai
import { createOpenAI } from "https://cdn.jsdelivr.net/npm/@ai-sdk/openai@1.3.22/+esm";
// `marked` Markdown parser
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.11/+esm";
// `morphdom` DOM diff minimizer
import morphdom from "https://cdn.jsdelivr.net/npm/morphdom@2.7.5/+esm";
// Initialize openAI provider with the proxy url and env var interpolation
const openai = createOpenAI({
  baseURL: "/api/proxy/https://api.openai.com/v1",
  apiKey: "${OPENAI_API_KEY}",
});
// Setup elements
const searchForm = document.getElementById("search");
const queryInput = document.getElementById("query");
const answerContainer = document.getElementById("answer");
// Handle input submission
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  // Send the LLM request
  const result = streamText({
    model: openai("gpt-4.1"),
    prompt: queryInput.value,
  });
  // Accumulate text parts
  let text = "";
  for await (const textPart of result.textStream) {
    text += textPart;
    // Render text to the answer container
    const html = marked.parse(text);
    morphdom(answerContainer, `<div>${html}</div>`, {
      childrenOnly: true,
    });
  }
});
