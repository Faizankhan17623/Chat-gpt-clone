import "dotenv/config";
import Groq from "groq-sdk";
import { stdin, stdout } from "node:process";
import * as readline from 'node:readline/promises'
import { callbackify } from "node:util";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const rl = readline.createInterface({input:stdin , output:stdout})

async function main(){
    try {


        while(true){

            const question = await rl.question('You: ')

        const message = [
            {
                role:"system",
                content:`Hello sir This is my personal project desiginign the ai chatboth the first time your taks is to provide me with quality ouput in short and in very easily understandable language 
                1 There are some ways how i want you to return the output to me 
                2 it should be in a easily readbale format 
                3 if a small child read it like an 7-8 year old child aks and quesiton that is much more tricky out of his league then also you should be respectfull and answer him in a manner that he will understand it 
                `
            },
            {
                role:"user",
                content:`${question}`
            }
        ]

        const Calling = await groq.chat.completions.create({
            messages:message,
            model:"llama-3.3-70b-versatile"
        })


        console.log(Calling.choices[0].message.content)

        if (question === "/exit"){
            break;
        }
    }
    rl.close()
    } catch (error) {
        console.log(error)
        console.log(error.message)
        console.log("Error in the api calling")
    }
}

main()
