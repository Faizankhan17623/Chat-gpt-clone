require("dotenv/config");
const Groq = require("groq-sdk");
const { tavily } = require("@tavily/core");
const { NodeCache } = require("@cacheable/node-cache");
const express = require("express");
const cors = require('cors')
const app = express()

// Fail fast with a clear message if the API keys are missing.
if (!process.env.GROQ_API_KEY || !process.env.TAVILY_API_KEY) {
    console.error("Missing GROQ_API_KEY or TAVILY_API_KEY. Copy .env.example to .env and fill them in.")
    process.exit(1)
}

const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors())

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvyl = tavily({apiKey:process.env.TAVILY_API_KEY})

// NOTE: Frontend DOM code lives in app.js (the browser file).
// This Script.js is the Node backend.

// Temp memory: stdTTL is in seconds. The conversation clears itself after a day.
const cache = new NodeCache( { stdTTL: 1 * 24 * 60 * 60  } );

async function main(question){
      try {

            // const question = await rl.question('You: ')

            // if (question === "/exit"){
            //     break;
            // }

            if (question === "/clear"){
                cache.del("chatHistory")   // wipe the conversation memory
                return "Chat cleared."
            }

        // 1) Load the conversation from cache (temp memory).
        //    If nothing is saved yet, start with just the system prompt.
        const message = cache.get("chatHistory") || [
            {
                role:"system",
                content:`You are a friendly, helpful AI assistant.

OUTPUT STYLE:
- Keep answers short, clear, and easy to read.
- Use simple language. Explain things so even a 7-8 year old child could understand.
- Always be respectful and patient, no matter how tricky or simple the question is.

USING THE WebSearch TOOL:
- Only use WebSearch for things you cannot possibly know: very recent events,
  live data (prices, weather, scores, news), or facts after your training cutoff.
- Do NOT use WebSearch for general knowledge, math, coding, definitions, or
  explanations you already know. Answer those directly from your own knowledge.
- When in doubt, answer directly without searching.`
            },
        ]

        // 2) Add the user's new question to the history.
        message.push({
            role:"user",
            content:`${question}`
        })

        // The model may need more than one round (e.g. answer -> search -> answer),
        // so we loop until it gives a final text reply instead of a tool call.
        while(true){
        const Calling = await groq.chat.completions.create({
            messages:message,
            model:"llama-3.1-8b-instant",
            tools:[
                 {
      "type": "function",
      "function": {
        "name": "WebSearch",
        "description": "Will be used to retrive the latest information from the internet",
        "parameters": {
          // JSON Schema object
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "The search query to look up the latest information on the internet"
            }
          },
          "required": ["query"]
        }
      }
    }
            ],
            tool_choice:"auto"
        })


        const responseMessage = Calling.choices[0].message
        const toolCalls = responseMessage.tool_calls

        // Always push what the model said (its tool request OR its answer)
        // into the history so the next API call has full context.
        message.push(responseMessage)
        // console.log(Calling)

        if (toolCalls) {
            for (const tool of toolCalls) {
                const functionName = tool.function.name
                const args = JSON.parse(tool.function.arguments)

                if(functionName=== "WebSearch"){
                    const result = await WebSearch(args)
                    message.push({
                        tool_call_id:tool.id,
                        role:'tool',
                        name:functionName,
                        content:result
                    })
                }
            }
            // Tool result added -> loop again so the model can use it to answer.
            continue
        } else {
            // Final text answer -> save history, then return it to the caller.
            const finalAnswer = (responseMessage.content || "").replace(/[*#]/g, "")
            console.log("AI:", finalAnswer)

            // 3) Save the updated conversation back to cache for the next turn.
            cache.set("chatHistory", message)

            return finalAnswer
        }
        }
    // rl.close()
    } catch (error) {
        console.log(error)
        console.log(error.message)
        console.log("Error in the api calling")
    }
}

async function WebSearch({ query }){   
    try {
        console.log('..Web Search') 
        const response = await tvyl.search(query)
        const finalResult = response.results.map((result) => result.content).join('\n\n').replace(/[*#]/g, "");
        return finalResult || "No results found."
    } catch (error) {
        console.log(error)
        console.log(error.message)
        console.log("Error in the web search api call")
        // Always return a string so the tool message is never undefined.
        // An undefined tool result makes the next Groq API call fail.
        return "Web search failed. Please answer from your own knowledge."
    }
}


// --- Chat route: the browser (app.js) sends a question here ---
app.post("/chat", async (req, res) => {
    try {
        const question = req.body.question

        if (!question) {
            return res.status(400).json({ error: "Question is required." })
        }

        const answer = await main(question)
        return res.status(200).json({ answer })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: "Something went wrong on the server." })
    }
})

// Serve index.html / app.js / style.css so the browser can load them
app.use(express.static("."))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))