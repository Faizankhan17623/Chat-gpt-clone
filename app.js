
// --- Main input area ---
const chatForm    = document.querySelector("#chatForm");     // the whole input pill (submit form)
const chatInput   = document.querySelector("#chatInput");    // the text box where the user types
const sendBtn     = document.querySelector("#sendBtn");      // black round send / voice button
const micBtn      = document.querySelector("#micBtn");       // microphone button
const plusBtn     = document.querySelector("#plusBtn");      // plus (+) button on the left

// --- Center content ---
const greeting     = document.querySelector("#greeting");     // "Hey, Faizan kahn..." heading
const chatMessagess = document.querySelector("#chatMessages"); // box where chat bubbles go

// --- Suggestion buttons (below the input) ---
const createImageBtn = document.querySelector("#createImageBtn"); // "Create an image"
const writeEditBtn   = document.querySelector("#writeEditBtn");   // "Write or edit"
const lookUpBtn      = document.querySelector("#lookUpBtn");      // "Look something up"

// --- Sidebar ---
const newChatBtn     = document.querySelector("#newChatBtn");     // "New chat" item
const searchChatsBtn = document.querySelector("#searchChatsBtn"); // "Search chats" item
const recentsList    = document.querySelector("#recentsList");    // container for recent chats

// suggestiosn btns 

const suggestiosn = document.querySelector('.suggestion_btns') // suggestion btns
const inputbox = document.querySelector('#inDiv')

// A random ID for THIS browser tab/session. The server uses it to keep
// each visitor's conversation separate. sessionStorage dies when the tab
// closes, so a fresh visit = a fresh ID = an empty chat.
let sessionId = sessionStorage.getItem("sessionId")
if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem("sessionId", sessionId)
}

// All messages so far. sessionStorage only holds strings, so we JSON-convert.
// (sessionStorage, not localStorage: it clears when the tab closes, so the
// chat survives a refresh but a brand-new visit starts with an empty screen.)
let history = JSON.parse(sessionStorage.getItem("chatHistory")) || []

// Draws ONE bubble on screen (does NOT touch storage).
// sender: "user" -> right grey bubble | "ai" -> left bubble
function drawBubble(text, sender) {
    const bubble = document.createElement('div')

    // shared look + the fade/slide animation
    bubble.className = "bubble-in max-w-[75%] bg-gray-100 rounded-2xl px-5 py-3 leading-relaxed"

    // align right for user, left for AI
    bubble.classList.add(sender === "user" ? "self-end" : "self-start")

    bubble.textContent = text             // textContent = safe, no HTML injection
    chatMessagess.append(bubble)          // add to the END -> stacks below old ones

    chatMessagess.scrollTop = chatMessagess.scrollHeight   // auto-scroll to newest
}

// Draws a bubble AND saves it to localStorage (so it survives a refresh).
function addBubble(text, sender) {
    drawBubble(text, sender)
    saveToHistory(text, sender)
}

// Saves one message to sessionStorage (so it survives a refresh).
function saveToHistory(text, sender) {
    history.push({ text, sender })
    sessionStorage.setItem("chatHistory", JSON.stringify(history))
}

// Like an empty AI bubble that types the text out word-by-word (ChatGPT style).
function typeBubble(fullText) {
    const bubble = document.createElement('div')
    bubble.className = "bubble-in self-start max-w-[75%] bg-gray-100 rounded-2xl px-5 py-3 leading-relaxed"
    chatMessagess.append(bubble)

    const words = fullText.split(" ")   // reveal one word at a time
    let i = 0

    const timer = setInterval(() => {
        bubble.textContent += (i === 0 ? "" : " ") + words[i]
        chatMessagess.scrollTop = chatMessagess.scrollHeight   // keep newest in view
        i++

        if (i >= words.length) {
            clearInterval(timer)               // done typing
            saveToHistory(fullText, "ai")      // save the full reply once finished
        }
    }, 60)   // 60ms between words — lower = faster
}

// On page load: if there's saved history, reveal the box and redraw it all.
if (history.length > 0) {
    suggestiosn.classList.add('hidden')
    greeting.classList.add('hidden')
    chatMessagess.classList.remove('hidden')
    chatMessagess.classList.add('flex')
    history.forEach(m => drawBubble(m.text, m.sender))
}

chatInput.addEventListener('keydown', async (e) => {
    if (e.key !== "Enter") return   // ignore every key except Enter

    e.preventDefault()
    const question = chatInput.value.trim()

    if (!question) return   // don't send empty/blank messages

    suggestiosn.classList.add('hidden')
    suggestiosn.classList.remove('flex')
    greeting.classList.add('hidden')

    chatMessagess.classList.remove('hidden')
    chatMessagess.classList.add('flex')

    addBubble(question, "user")   // show the user's message right away
    chatInput.value = ""          // clear the input box

    try {
        // Relative URL: works both locally and in production (same origin).
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, sessionId })   // sessionId keeps each visitor's memory separate
        })

        const data = await res.json()

        if (!res.ok) {
            typeBubble(data.error || "Something went wrong. Please try again.")
            return
        }

        typeBubble(data.answer)   // AI reply types out word-by-word (ChatGPT style)
    } catch (err) {
        typeBubble("Could not reach the server. Is it running?")
    }
})



// now we will work for the ai response display sir 



