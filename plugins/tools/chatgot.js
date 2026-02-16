const axios = require("axios")
const crypto = require("crypto")
const fs = require("fs/promises")
const path = require("path")

const FILE = path.join(process.cwd(), "database", "chatgot.json")
const sleep = ms => new Promise(r => setTimeout(r, ms))

const models = {
  claude: "anthropic/claude-3-haiku",
  gpt41mini: "openai/gpt-4.1-mini",
  gpt4omini: "openai/gpt-4o-mini",
  gemini: "google/gemini-2.5-flash-lite",
  deepseek: "deepseek/deepseek-chat"
}

async function readAccount() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"))
  } catch {
    return null
  }
}

async function saveAccount(data) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2))
}

async function createTempEmail() {
  const { data } = await axios.get(
    "https://api.yabes-desu.workers.dev/test/mail",
    { params: { action: "create" } }
  )
  return data.email
}

async function getCfToken() {
  const { data } = await axios.get(
    "https://api.gimita.id/api/tools/bypasscf",
    {
      params: {
        method: "turnstile-min",
        siteKey: "0x4AAAAAAAxfq-hBQkOyW7zF",
        url: "https://www.chatgot.io/chat/"
      }
    }
  )
  return data.data
}

async function sendVerifyEmail(email, cfToken) {
  await axios.post(
    "https://api.chatgot.io/api/verify/send-email",
    {
      email,
      type: "register",
      cf_challenge_token: cfToken
    },
    {
      headers: {
        "content-type": "application/json",
        "i-version": "1.1.70",
        "i-lang": "en",
        "i-platform": "web_h5"
      }
    }
  )
}

async function getEmailCode(email, maxTry = 30, delay = 2000) {
  for (let i = 0; i < maxTry; i++) {
    const { data } = await axios.get(
      "https://api.yabes-desu.workers.dev/test/mail",
      { params: { action: "message", email } }
    )

    if (data?.data) {
      const list = Array.isArray(data.data) ? data.data : [data.data]
      for (const m of list) {
        const content = m.text_content || m.html_content || ""
        const match = content.match(/\b\d{6}\b/)
        if (match) return match[0]
      }
    }
    await sleep(delay)
  }
  throw new Error("Verification code not found")
}

async function registerChatgot() {
  const email = await createTempEmail()
  const cfToken = await getCfToken()
  await sendVerifyEmail(email, cfToken)
  const code = await getEmailCode(email)

  const password = crypto
    .createHash("md5")
    .update(crypto.randomUUID())
    .digest("hex")

  await axios.post(
    "https://api.chatgot.io/api/user/register",
    {
      email,
      password,
      emailCode: code,
      invitationId: "",
      gtag: {
        utm_source: "chatgot_www",
        utm_medium: "unknow",
        utm_campaign: "unknow",
        utm_term: "unknow",
        utm_content: "unknow",
        utm_id: "unknow"
      }
    },
    {
      headers: {
        "content-type": "application/json",
        "i-version": "1.1.70",
        "i-lang": "en",
        "i-platform": "web_h5"
      }
    }
  )

  const account = { email, password, created_at: Date.now() }
  await saveAccount(account)
  return account
}

async function login(email, password) {
  const { data } = await axios.post(
    "https://api.chatgot.io/api/user/login",
    { email, password },
    {
      headers: {
        "content-type": "application/json",
        "i-version": "1.1.70",
        "i-lang": "en",
        "i-platform": "web_h5"
      }
    }
  )
  return data.data.token
}

async function chatgot(prompt, modelKey = "gpt4omini") {
  let account = await readAccount()
  if (!account) account = await registerChatgot()

  const token = await login(account.email, account.password)
  const model = models[modelKey] || models.gpt4omini

  const res = await axios.post(
    "https://api.chatgot.io/api/v2/chat/conversation",
    {
      model,
      prompt,
      webAccess: "close",
      timezone: "Asia/Jakarta"
    },
    {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "i-version": "1.1.70",
        "i-lang": "en",
        "i-platform": "web_h5"
      },
      responseType: "stream"
    }
  )

  return new Promise((resolve, reject) => {
    let fullText = ""

    res.data.on("data", chunk => {
      const lines = chunk.toString().split("\n")
      for (const line of lines) {
        if (!line.startsWith("data:")) continue
        const json = line.slice(5).trim()
        if (!json) continue
        try {
          const parsed = JSON.parse(json)
          if (parsed?.data?.content) {
            fullText += parsed.data.content
          }
        } catch {}
      }
    })

    res.data.on("end", () => resolve(fullText.trim()))
    res.data.on("error", reject)
  })
}

module.exports = chatgot