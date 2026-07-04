const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_ROOT = process.env.VIBLY_DATA_DIR || ROOT;
const DATA_DIR = path.join(DATA_ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

const DEFAULT_BASE_URL = "https://api.openai.com/v1/chat/completions";

ensureDir(DATA_DIR);
ensureStateFile();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/api/state" && req.method === "GET") {
      return json(res, 200, readState());
    }

    if (pathname === "/api/state" && req.method === "POST") {
      const body = await readJsonBody(req);
      writeState(body);
      return json(res, 200, { ok: true });
    }

    if (pathname === "/api/health" && req.method === "GET") {
      return json(res, 200, {
        ok: true,
        updatedAt: readState().updatedAt,
        projectCount: readState().projects.length
      });
    }

    if (pathname === "/api/detect" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await detectAi(body);
      return json(res, 200, result);
    }

    if (pathname === "/api/ai" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await proxyAi(body);
      return json(res, 200, result);
    }

    if (/^\/\d{3,}$/.test(pathname)) {
      return servePublished(pathname.slice(1), res);
    }

    return serveStatic(pathname, res);
  } catch (error) {
    console.error(error);
    json(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Vibly running on http://localhost:${PORT}`);
  getLocalAddresses().forEach((address) => {
    console.log(`LAN: http://${address}:${PORT}`);
  });
});

function ensureDir(target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
}

function ensureStateFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(createInitialState(), null, 2));
  }
}

function createInitialState() {
  return {
    projects: [createProject("Welcome Project", "html", 0)],
    activeProjectId: null,
    updatedAt: now()
  };
}

function createProject(name, framework, order) {
  return {
    id: makeId(),
    name,
    framework,
    libraries: [],
    files: getTemplate(framework),
    activeFile: framework === "react" ? "app.jsx" : framework === "vue" ? "app.js" : "index.html",
    versions: [],
    deployments: [],
    liveDeploymentId: null,
    deployNumber: String(order).padStart(3, "0"),
    ai: {
      provider: "openai",
      model: "gpt-4o-mini",
      baseUrl: DEFAULT_BASE_URL,
      headersJson: "",
      apiKey: "",
      messages: []
    },
    createdAt: now(),
    updatedAt: now()
  };
}

function getTemplate(framework) {
  if (framework === "react") {
    return {
      "index.html": `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Vibly Site</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
      "style.css": `body {
  margin: 0;
  font-family: "Segoe UI", sans-serif;
  background: linear-gradient(180deg, #fff7ef, #f0e1cf);
  color: #1f160f;
}

.wrap {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 16px;
  text-align: center;
  padding: 24px;
}`,
      "app.jsx": `function App() {
  return (
    <section className="wrap">
      <h1>React site by Vibly</h1>
      <p>자연어로 수정하거나 코드를 직접 바꿔보세요.</p>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);`
    };
  }

  if (framework === "vue") {
    return {
      "index.html": `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue Vibly Site</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>`,
      "style.css": `body {
  margin: 0;
  font-family: "Segoe UI", sans-serif;
  background: linear-gradient(180deg, #fff7ef, #eadccc);
  color: #1d140d;
}

.shell {
  min-height: 100vh;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 16px;
  padding: 24px;
}`,
      "app.js": `Vue.createApp({
  data() {
    return {
      title: "Vue site by Vibly",
      description: "자연어로 사이트를 만들고 수정해보세요."
    };
  },
  template: \`
    <section class="shell">
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </section>
  \`
}).mount("#app");`
    };
  }

  return {
    "index.html": `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Vibly Site</title>
</head>
<body>
  <main class="hero">
    <h1>Welcome to Vibly</h1>
    <p>AI로 사이트를 만들고, 여기서 바로 수정해보세요.</p>
    <button id="ctaBtn">Get Started</button>
  </main>
</body>
</html>`,
    "style.css": `body {
  margin: 0;
  font-family: "Segoe UI", sans-serif;
  background: linear-gradient(180deg, #fff8ef, #f3e6d6);
  color: #1f160f;
}

.hero {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 16px;
  text-align: center;
  padding: 24px;
}`,
    "script.js": `document.getElementById("ctaBtn")?.addEventListener("click", () => {
  alert("Vibly says hi.");
});`
  };
}

function readState() {
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const state = JSON.parse(raw);
  if (!state.activeProjectId && state.projects[0]) {
    state.activeProjectId = state.projects[0].id;
  }
  return state;
}

function writeState(state) {
  state.updatedAt = now();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function serveStatic(pathname, res) {
  const targetPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(PUBLIC_DIR, path.normalize(targetPath).replace(/^(\.\.[/\\])+/, ""));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return text(res, 403, "Forbidden");
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return text(res, 404, "Not found");
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
  });
  fs.createReadStream(filePath).pipe(res);
}

function servePublished(deployNumber, res) {
  const state = readState();
  const project = state.projects.find((item) => item.deployNumber === deployNumber);
  if (!project || !project.liveDeploymentId) {
    return text(res, 404, "No live deployment");
  }

  const deployment = project.deployments.find((item) => item.id === project.liveDeploymentId);
  if (!deployment) {
    return text(res, 404, "Deployment missing");
  }

  const html = buildPreviewHtml(project.framework, project.libraries, deployment.files);
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(html);
}

function buildPreviewHtml(framework, libraries, files) {
  const libs = Array.isArray(libraries) ? libraries : [];
  const cssLinks = libs
    .filter((url) => /\.css(\?|$)/i.test(url))
    .map((url) => `<link rel="stylesheet" href="${escapeAttribute(url)}">`)
    .join("\n");
  const jsLinks = libs
    .filter((url) => !/\.css(\?|$)/i.test(url))
    .map((url) => `<script src="${escapeAttribute(url)}"><\/script>`)
    .join("\n");
  const styleTag = files["style.css"] ? `<style>${files["style.css"]}</style>` : "";

  if (framework === "react") {
    const baseHtml = files["index.html"] || "";
    return baseHtml.replace("</head>", `${cssLinks}\n${styleTag}\n</head>`).replace(
      "</body>",
      `
      <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
      ${jsLinks}
      <script type="text/babel">
${files["app.jsx"] || ""}
      <\/script>
      </body>`
    );
  }

  if (framework === "vue") {
    const baseHtml = files["index.html"] || "";
    return baseHtml.replace("</head>", `${cssLinks}\n${styleTag}\n</head>`).replace(
      "</body>",
      `
      <script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>
      ${jsLinks}
      <script>
${files["app.js"] || ""}
      <\/script>
      </body>`
    );
  }

  let html = files["index.html"] || "";
  html = html.includes("</head>")
    ? html.replace("</head>", `${cssLinks}\n${styleTag}\n</head>`)
    : `${cssLinks}\n${styleTag}\n${html}`;

  if (files["script.js"]) {
    html = html.includes("</body>")
      ? html.replace("</body>", `${jsLinks}\n<script>${files["script.js"]}<\/script>\n</body>`)
      : `${html}\n${jsLinks}\n<script>${files["script.js"]}<\/script>`;
  } else if (jsLinks) {
    html = html.includes("</body>")
      ? html.replace("</body>", `${jsLinks}\n</body>`)
      : `${html}\n${jsLinks}`;
  }

  return html;
}

function text(res, statusCode, value) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end(value);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

async function detectAi(body) {
  const {
    provider = "auto",
    apiKey,
    baseUrl = "",
    headers = {}
  } = body;

  if (!apiKey) {
    throw new Error("API Key is required");
  }

  const candidates = getDetectionCandidates(provider, apiKey, baseUrl);
  const errors = [];

  for (const candidate of candidates) {
    try {
      if (candidate.provider === "gemini") {
        return await detectGemini(apiKey, candidate.baseUrl, headers);
      }
      if (candidate.provider === "anthropic") {
        return await detectAnthropic(apiKey, candidate.baseUrl, headers);
      }
      return await detectOpenAiCompatible(apiKey, candidate.baseUrl, headers);
    } catch (error) {
      errors.push(`${candidate.provider}: ${error.message}`);
    }
  }

  throw new Error(errors.join(" / ") || "Unknown API provider");
}

function getDetectionCandidates(provider, apiKey, baseUrl) {
  const lowerUrl = (baseUrl || "").toLowerCase();

  if (provider && provider !== "auto") {
    return [{ provider, baseUrl }];
  }

  if (lowerUrl.includes("generativelanguage.googleapis.com") || lowerUrl.includes("gemini")) {
    return [{ provider: "gemini", baseUrl }];
  }
  if (lowerUrl.includes("anthropic")) {
    return [{ provider: "anthropic", baseUrl }];
  }
  if (lowerUrl) {
    return [{ provider: "openai", baseUrl }];
  }
  if (apiKey.startsWith("sk-ant-")) {
    return [{ provider: "anthropic", baseUrl: "https://api.anthropic.com/v1/messages" }];
  }
  if (apiKey.startsWith("sk-or-v1-")) {
    return [{ provider: "openai", baseUrl: "https://openrouter.ai/api/v1/chat/completions" }];
  }
  if (apiKey.startsWith("gsk_")) {
    return [{ provider: "openai", baseUrl: "https://api.groq.com/openai/v1/chat/completions" }];
  }
  if (apiKey.startsWith("AIza")) {
    return [{ provider: "gemini", baseUrl: "" }];
  }

  return [
    { provider: "openai", baseUrl: DEFAULT_BASE_URL },
    { provider: "anthropic", baseUrl: "https://api.anthropic.com/v1/messages" },
    { provider: "gemini", baseUrl: "" }
  ];
}

async function detectOpenAiCompatible(apiKey, baseUrl, headers = {}) {
  const chatUrl = normalizeOpenAiChatUrl(baseUrl || DEFAULT_BASE_URL);
  const modelsUrl = deriveOpenAiModelsUrl(chatUrl);
  const response = await fetch(modelsUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...headers
    }
  });
  const data = await readJsonPayload(response);
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI-compatible model lookup failed");
  }
  const models = (data.data || []).map((model) => model.id).filter(Boolean);
  if (!models.length) {
    throw new Error("No models found");
  }
  const model = choosePreferredModel(models, ["gpt-4o-mini", "gpt-4.1-mini", "o4-mini", "gpt-4o"]);
  return {
    provider: "openai",
    label: "OpenAI compatible API",
    model,
    models,
    baseUrl: chatUrl
  };
}

async function detectAnthropic(apiKey, baseUrl, headers = {}) {
  const response = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      ...headers
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Anthropic model lookup failed");
  }

  const models = (data.data || []).map((model) => model.id).filter(Boolean);
  if (!models.length) {
    throw new Error("No Anthropic models found");
  }
  const model = choosePreferredModel(models, ["claude-3-5-sonnet-latest", "claude-3-7-sonnet-latest", "claude-sonnet-4-0"]);
  return {
    provider: "anthropic",
    label: "Anthropic",
    model,
    models,
    baseUrl: baseUrl || "https://api.anthropic.com/v1/messages"
  };
}

async function detectGemini(apiKey, baseUrl, headers = {}) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
    headers
  });
  const data = await readJsonPayload(response);
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini model lookup failed");
  }
  const models = (data.models || [])
    .map((model) => (model.name || "").replace(/^models\//, ""))
    .filter((name) => name && !name.includes("embedding"));
  if (!models.length) {
    throw new Error("No Gemini models found");
  }
  const model = choosePreferredModel(models, ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"]);
  return {
    provider: "gemini",
    label: "Google Gemini",
    model,
    models,
    baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  };
}

function normalizeOpenAiChatUrl(baseUrl) {
  const trimmed = String(baseUrl || "").trim().replace(/\/$/, "");
  if (!trimmed) return DEFAULT_BASE_URL;
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/models")) return trimmed.replace(/\/models$/, "/chat/completions");
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  if (trimmed.includes("/v1/")) return trimmed.replace(/\/v1\/.*$/, "/v1/chat/completions");
  return `${trimmed}/v1/chat/completions`;
}

function deriveOpenAiModelsUrl(chatUrl) {
  return normalizeOpenAiChatUrl(chatUrl).replace(/\/chat\/completions$/, "/models");
}

function choosePreferredModel(models, preferred) {
  for (const item of preferred) {
    const exact = models.find((model) => model === item);
    if (exact) return exact;
    const partial = models.find((model) => model.includes(item));
    if (partial) return partial;
  }
  return models[0];
}

async function proxyAi(body) {
  const {
    provider = "openai",
    apiKey,
    model,
    baseUrl = DEFAULT_BASE_URL,
    headers = {},
    mode = "build",
    prompt = "",
    history = [],
    project
  } = body;

  if (!apiKey || !model || !prompt || !project) {
    throw new Error("apiKey, model, prompt, project are required");
  }

  const systemPrompt = [
    "You are Vibly, an AI website builder.",
    "Return only JSON in this exact shape:",
    '{ "message": "short Korean reply for the chat UI", "applyChanges": true, "name": "optional new project name", "framework": "html|react|vue", "libraries": ["optional urls"], "files": { "fileName": "content" } }',
    "For html projects use index.html, style.css, script.js.",
    "For react projects use index.html, style.css, app.jsx.",
    "For vue projects use index.html, style.css, app.js.",
    "If the user is only chatting or asking a question, set applyChanges to false and omit file edits.",
    "Preserve useful existing files unless the user explicitly asks to remove them."
  ].join(" ");

  const request = buildAiRequest({
    provider,
    apiKey,
    model,
    baseUrl,
    headers,
    mode,
    prompt,
    history,
    project,
    systemPrompt
  });

  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(request.body)
  });

  const payload = await readJsonPayload(response);
  if (!response.ok) {
    throw new Error(payload.error?.message || payload.error || payload.message || `HTTP ${response.status}`);
  }

  const content = extractProviderText(provider, payload);
  if (!content) {
    throw new Error("AI response content is empty");
  }

  return extractJsonBlock(content, mode);
}

async function readJsonPayload(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: text };
  }
}

function buildAiRequest({
  provider,
  apiKey,
  model,
  baseUrl,
  headers,
  mode,
  prompt,
  history,
  project,
  systemPrompt
}) {
  const safeHeaders = headers && typeof headers === "object" ? headers : {};
  const userPrompt = [
    mode === "fix" ? "Fix and improve this project." : mode === "chat" ? "Answer the user and edit code only if truly needed." : "Create or update this project.",
    "User request:",
    prompt,
    "Current project bundle JSON:",
    JSON.stringify(project)
  ].join("\n");

  if (provider === "anthropic") {
    return {
      url: baseUrl,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...safeHeaders
      },
      body: {
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: buildHistoryMessages(history, userPrompt)
      }
    };
  }

  if (provider === "gemini") {
    const cleanBase = baseUrl.includes("?key=") ? baseUrl : `${baseUrl}?key=${encodeURIComponent(apiKey)}`;
    return {
      url: cleanBase,
      headers: {
        "Content-Type": "application/json",
        ...safeHeaders
      },
      body: {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: buildGeminiMessages(history, userPrompt),
        generationConfig: {
          temperature: 0.7
        }
      }
    };
  }

  return {
    url: baseUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...safeHeaders
    },
    body: {
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.text
        })),
        {
          role: "user",
          content: userPrompt
        }
      ]
    }
  };
}

function buildHistoryMessages(history, userPrompt) {
  const messages = history.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: [{ type: "text", text: message.text }]
  }));
  messages.push({
    role: "user",
    content: [{ type: "text", text: userPrompt }]
  });
  return messages;
}

function buildGeminiMessages(history, userPrompt) {
  const messages = history.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.text }]
  }));
  messages.push({
    role: "user",
    parts: [{ text: userPrompt }]
  });
  return messages;
}

function extractProviderText(provider, payload) {
  if (provider === "anthropic") {
    return (payload.content || [])
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");
  }

  if (provider === "gemini") {
    return (payload.candidates?.[0]?.content?.parts || [])
      .map((item) => item.text || "")
      .join("\n");
  }

  return payload.choices?.[0]?.message?.content;
}

function extractJsonBlock(text, mode = "build") {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    return {
      message: text.trim() || "AI responded, but the response body was empty.",
      applyChanges: false
    };
  }
  try {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  } catch (error) {
    return {
      message: text.trim() || "AI responded, but not as JSON.",
      applyChanges: false
    };
  }
}

function escapeAttribute(text) {
  return String(text).replace(/"/g, "&quot;");
}

function now() {
  return new Date().toLocaleString("ko-KR");
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function getLocalAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const entries of Object.values(nets)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }
  return addresses;
}
