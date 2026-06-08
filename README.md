# ChatGPT Clone

A simple ChatGPT-style chat app. The frontend is plain **HTML + Tailwind + vanilla JS**, and the backend is a small **Node.js / Express** server that talks to the **Groq** LLM API, with **Tavily** web search as a tool the model can call.

## Features

- Clean ChatGPT-like UI (sidebar, chat area, input pill)
- Chat messages stack and **persist across page refreshes** (saved in `localStorage`)
- AI replies **type out word-by-word** (typewriter effect)
- The model can call a **web search** tool (Tavily) for fresh/live information
- Short-term conversation memory on the server (so the AI remembers the chat)

## Tech stack

| Layer    | Tech                                   |
|----------|----------------------------------------|
| Frontend | HTML, Tailwind CSS (CDN), vanilla JS   |
| Backend  | Node.js, Express                       |
| AI       | Groq (`llama-3.1-8b-instant`)          |
| Search   | Tavily                                 |
| Memory   | `@cacheable/node-cache`                |

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/Faizankhan17623/Chat-gpt-clone.git
cd Chat-gpt-clone
npm install
```

### 2. Add your API keys

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Then open `.env` and set:

- `GROQ_API_KEY` — from https://console.groq.com/keys
- `TAVILY_API_KEY` — from https://app.tavily.com

### 3. Run

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

> `npm run dev` uses **nodemon**, which auto-restarts the server whenever you save a file.

## Project structure

```
.
├── Script.js        # Express server + Groq/Tavily logic (backend)
├── app.js           # Browser code: sends messages, renders bubbles (frontend)
├── index.html       # Page markup
├── style.css        # Animations + extra styles
├── .env.example     # Template for required environment variables
└── package.json
```

## How it works

1. You type a message and press **Enter**.
2. The browser (`app.js`) sends a `POST /chat` request to the server.
3. The server (`Script.js`) passes it to the Groq model. If the model needs live info, it calls the Tavily web-search tool, then answers.
4. The reply is sent back and typed out in the chat area.

## Notes

- Never commit your real `.env` file — it holds your secret keys and is already in `.gitignore`.
- The browser-side chat history (`localStorage`) is separate from the server-side conversation memory; the first redraws the UI, the second gives the AI context.
