// This is a basic example LLM prototype with text streaming and storage
import "/research.js";

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

// Shared config
// Mapping of models for each provider
const modelMap = {
  openai: "gpt-4.1",
  anthropic: "claude-3-7-sonnet-latest",
  google: "gemini-2.5-flash-preview-04-17",
};
const systemPrompt = `You are an LLM agent`;

// Initialize providers with the proxy url and server side env var interpolation strings
// https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry
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
// Search form container
const searchForm = document.getElementById("search");
// Provider select dropdown
const providerSelect = document.getElementById("provider");
// User search input
const queryInput = document.getElementById("query");
// Answer display area
const answerContainer = document.getElementById("answer");
// Share thread button
const shareButton = document.getElementById("share");
shareButton.style.display = "none";
// Setup state
let userQuery = "";
let answerText = "";
// Handle input submission
searchForm.addEventListener("submit", async (event) => {
  // Set loading state
  event.preventDefault();
  answerContainer.innerHTML = "<div><p>Loading...</p></div>";
  shareButton.style.display = "none";
  userQuery = queryInput.value;
  // Send the LLM request
  const provider = providerSelect.value;
  const model = modelMap[provider];
  // AI SDK's streamText utility for normalizing providers and providing a stream part generator
  // https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
  const result = streamText({
    model: registry.languageModel(`${provider}:${model}`),
    system: systemPrompt,
    prompt: userQuery,
  });
  // Accumulate text parts asyncronously using text stream generator
  answerText = "";
  for await (const textPart of result.textStream) {
    answerText += textPart;
    // Render markdown text to an html string. HTML tags are supported and can be streamed in.
    // HTML web components tags are also supported out of the box and can be used for custom content.
    // No additional post-processing is necessary
    // https://marked.js.org/#usage
    const html = marked.parse(answerText);
    // Diffs the existing HTML and updates it with minimal changes to preserve prior DOM nodes.
    // This supports web components out of the box and no post-processing is necessary.
    // https://www.npmjs.com/package/morphdom#api
    morphdom(answerContainer, `<div>${html}</div>`, {
      childrenOnly: true,
    });
  }
  // Set complete state
  shareButton.style.display = "";
});
// Handle share button click
shareButton.addEventListener("click", async () => {
  // Store the question and answer text on the server store route
  const storeResponse = await fetch("/api/store/", {
    method: "POST",
    body: JSON.stringify({ question: userQuery, answer: answerText }),
  });
  // Get the url safe base64 storage id from the server store response
  const storeId = await storeResponse.text();
  // Redirect to the share url
  window.location = `?${storeId}`;
});
// Init app state
(async function init() {
  // Get url parameters for parsing thread storage id
  const urlParams = new URLSearchParams(window.location.search);
  const [id, value] = [...urlParams.entries()][0] ?? [];
  // Check if parameter is a base64 url safe thread storage id
  if (id && /^[a-z0-9_-]+$/i.test(id) && !value) {
    // Retrieve the stored thread from the id
    const storeResponse = await fetch(`/api/store/${id}`);
    // Extract the question and answer data from the storage response
    const { question, answer } = await storeResponse.json();
    // Update the app state with the thread data
    queryInput.value = question;
    const html = marked.parse(answer);
    answerContainer.innerHTML = `<div>${html}</div>`;
  }
})();
