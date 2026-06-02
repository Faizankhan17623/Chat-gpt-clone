import "dotenv/config";
import Groq from "groq-sdk";
import { stdin, stdout } from "node:process";
import * as readline from 'node:readline/promises'
import {tavily}  from  '@tavily/core'
import NodeCache from "@cacheable/node-cache";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvyl = tavily({apiKey:process.env.TAVILY_API_KEY})

const rl = readline.createInterface({input:stdin , output:stdout})


// Temp memory: stdTTL is in seconds. After 1 hour of no use it clears itself.
const cache = new NodeCache({ stdTTL: 60 * 60 });

async function main(){
      try {
        while(true){

            const question = await rl.question('You: ')

            if (question === "/exit"){
                break;
            }

            if (question === "/clear"){
                console.clear()
                cache.del("chatHistory")   // wipe the memory too
                continue;
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
            // Final text answer -> show it and stop the inner loop.
             console.log("AI:", (responseMessage.content || "").replace(/[*#]/g, ""))
            break
        }
        }

        // 3) Save the updated conversation back to cache for the next turn.
        cache.set("chatHistory", message)
    }
    rl.close()
    } catch (error) {
        console.log(error)
        console.log(error.message)
        console.log("Error in the api calling")
    }
}


main()


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
    }
}
