const fs = require('fs')
const path = require('path')

// Use /tmp if write permission is denied in /app
const CONFIG_PATH = './config.json'

// Ensure the config file exists
if (!fs.existsSync(CONFIG_PATH)) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({}), 'utf8')
}

// Load current config
let db = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))

function getConfig(key) {
  return db[key]
}

function setConfig(key, value) {
  db[key] = value
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(db, null, 2), 'utf8')
}

module.exports = {
  getConfig,
  setConfig
}
