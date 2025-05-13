// This is a basic example LLM prototype with text streaming and storage

// `ai` Vercel AI SDK https://ai-sdk.dev/docs/
import {
  streamText,
  createProviderRegistry,
} from "https://cdn.jsdelivr.net/npm/ai@4.3.15/+esm";
// `@ai-sdk/openai` Vercel AI SDK OpenAI Provider https://ai-sdk.dev/providers/ai-sdk-providers/openai
import { createOpenAI } from "https://cdn.jsdelivr.net/npm/@ai-sdk/openai@1.3.22/+esm";
// `@ai-sdk/anthropic` Vercel AI SDK Anthropic Provider https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
import { createAnthropic } from "https://cdn.jsdelivr.net/npm/@ai-sdk/anthropic@1.2.11/+esm";
// `@ai-sdk/google` Vercel AI SDK Google Provider https://ai-sdk.dev/providers/ai-sdk-providers/google
import { createGoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@ai-sdk/google@1.2.18/+esm";
// `marked` Markdown parser
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.11/+esm";
// `morphdom` DOM diff minimizer
import morphdom from "https://cdn.jsdelivr.net/npm/morphdom@2.7.5/+esm";
// Initialize providers with the proxy url and env var interpolation
const registry = createProviderRegistry({
  openai: createOpenAI({
    baseURL: "/api/proxy/https://api.openai.com/v1",
    apiKey: "${OPENAI_API_KEY}",
  }),
  anthropic: createAnthropic({
    baseURL: "/api/proxy/https://api.anthropic.com/v1",
    apiKey: "${ANTHROPIC_API_KEY}",
  }),
  google: createGoogleGenerativeAI({
    baseURL: "/api/proxy/https://generativelanguage.googleapis.com/v1beta",
    apiKey: "${GEMINI_API_KEY}",
  }),
});
// Setup elements
const searchForm = document.getElementById("search");
const providerSelect = document.getElementById("provider");
const queryInput = document.getElementById("query");
const answerContainer = document.getElementById("answer");
const shareButton = document.getElementById("share");
shareButton.style.display = "none";
// Setup state
const modelMap = {
  openai: "gpt-4.1",
  anthropic: "claude-3-7-sonnet-latest",
  google: "gemini-2.5-flash-preview-04-17",
};
let userQuery = "";
let answerText = "";
// Handle input submission
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  answerContainer.innerHTML = "Loading...";
  shareButton.style.display = "none";
  userQuery = queryInput.value;
  // Send the LLM request
  const provider = providerSelect.value;
  const model = modelMap[provider];
  const result = streamText({
    model: registry.languageModel(`${provider}:${model}`),
    prompt: userQuery,
  });
  answerText = "";
  // Accumulate text parts
  for await (const textPart of result.textStream) {
    answerText += textPart;
    // Render text to the answer container
    const html = marked.parse(answerText);
    morphdom(answerContainer, `<div>${html}</div>`, {
      childrenOnly: true,
    });
  }
  shareButton.style.display = "";
});
// Handle share button click
shareButton.addEventListener("click", async () => {
  const storeResponse = await fetch("/api/store/", {
    method: "POST",
    body: JSON.stringify({ question: userQuery, answer: answerText }),
  });
  const storeId = await storeResponse.text();
  const shareUrl = `${window.location.origin}?${storeId}`;
  window.location = shareUrl;
});
// Init state
(async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const [id, value] = [...urlParams.entries()][0] ?? [];
  if (!value && /^[a-z0-9_-]+$/i.test(id)) {
    const storeResponse = await fetch(`/api/store/${id}`);
    const { question, answer } = await storeResponse.json();
    queryInput.value = question;
    const html = marked.parse(answer);
    answerContainer.innerHTML = `<div>${html}</div>`;
  }
})();
