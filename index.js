const express = require('express')
const bodyParser = require('body-parser')
const mineflayer = require('mineflayer')
const fs = require('fs')

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = 13706
const bots = {}

let savedBots = []
if (fs.existsSync('bots.json')) {
  savedBots = JSON.parse(fs.readFileSync('bots.json'))
}

// ===== Bot 启动函数 =====
function startBot(cfg) {
  const key = `${cfg.host}:${cfg.port}:${cfg.username}`
  if (bots[key]) return

  function connect() {
    const bot = mineflayer.createBot({
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      version: false
    })

    bots[key] = bot

    bot.on('spawn', () => {
      console.log(`✅ ${cfg.username} 已连接 ${cfg.host}:${cfg.port}`)
      setInterval(() => {
        bot.setControlState('jump', true)
        setTimeout(() => bot.setControlState('jump', false), 300)
        bot.look(Math.random() * Math.PI * 2, 0, true)
      }, 30000)
    })

    bot.on('end', () => {
      console.log(`⚠️ ${cfg.username} 断开，10 秒后重连`)
      delete bots[key]
      setTimeout(connect, 10000)
    })

    bot.on('error', err => {
      console.log(`❌ ${cfg.username} 错误:`, err.message)
    })
  }

  connect()
}

// ===== 自动恢复之前的 Bot =====
savedBots.forEach(startBot)

// ===== 面板 =====
app.get('/', (req, res) => {
  res.send(`
    <h2>Minecraft 多服务器 Bot 面板</h2>
    <form method="POST" action="/add">
      <input name="host" placeholder="服务器IP" required />
      <input name="port" placeholder="端口" required />
      <input name="username" placeholder="Bot 名称" required />
      <button>启动 Bot</button>
    </form>
    <h3>已运行 Bot</h3>
    <ul>
      ${Object.keys(bots).map(k => `<li>${k}</li>`).join('')}
    </ul>
  `)
})

app.post('/add', (req, res) => {
  const cfg = {
    host: req.body.host,
    port: Number(req.body.port),
    username: req.body.username
  }

  savedBots.push(cfg)
  fs.writeFileSync('bots.json', JSON.stringify(savedBots, null, 2))
  startBot(cfg)
  res.redirect('/')
})

app.listen(PORT, () => {
  console.log(`🟢 面板已启动：http://localhost:${PORT}`)
})