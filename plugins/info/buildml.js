const config = require('../../config')
const axios = require("axios")

const pluginConfig = {
  name: 'buildml',
  alias: [],
  category: 'info',
  description: 'Build hero Mobile Legends',
  usage: '.buildml <hero>',
  example: '.buildml gusion',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 1,
  isEnabled: true
}

async function handler(m, { sock }) {
  let text = m.args?.join(" ")
  if (!text) {
    return m.reply(
      `📚 *BUILD ML*\n\n> Masukan nama karakter\n\nContoh: ${m.prefix}buildml gusion`
    )
  }

  m.react("⏱️")

  try {
    const { data } = await axios.get(
      `https://api.apocalypse.web.id/search/buildml?hero=${encodeURIComponent(text)}`
    )

    const heroes = data.builds
    if (!heroes || !heroes.length) {
      return m.reply("❌ Build tidak ditemukan")
    }

    const pickRandom = heroes[Math.floor(Math.random() * heroes.length)]
    const title = pickRandom.title

    const itemnya = pickRandom.items?.map(v => {
      return `*ITEM NYA*
🌿 \`Nama\`: ${v.name}
🔮 \`Tipe\`: ${v.type}
💵 \`Harga\`: ${v.price}

*STATS*
🚧 \`Magic Power\`: ${v.stats?.magic_power || "-"}
👻 \`Movement Speed\`: ${v.stats?.movement_speed || "-"}
🎗️ \`Magic Penetration\`: ${v.stats?.magic_penetration || "-"}

*PASSIVE*
${v.passive_description || "-"}`
    }).join("\n\n")

    m.reply(`*BUILD ${text.toUpperCase()}*

🍯 *Title*
${title}

${itemnya}`)

  } catch (error) {
    console.error('BuildML Error:', error)
    await m.reply(`❌ *GAGAL*

> ${error.message}`)
  }
}

module.exports = {
  config: pluginConfig,
  handler
}