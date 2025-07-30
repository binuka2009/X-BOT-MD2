const fs = require('fs')
const path = require('path')

// Dynamically use /tmp if write is not allowed in root
const CONFIG_PATH = fs.existsSync('/tmp') ? '/tmp/config.json' : './config.json'

// Ensure the config file exists
if (!fs.existsSync(CONFIG_PATH)) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({}), 'utf8')
  } catch (e) {
    console.error(`❌ Failed to create config: ${e.message}`)
    process.exit(1)
  }
}

// Load current config
let db = {}
try {
  db = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
} catch (e) {
  console.warn(`⚠️ Failed to read config: ${e.message}`)
}

// Getter
function getConfig(key) {
  return db[key]
}

// Setter
function setConfig(key, value) {
  db[key] = value
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(db, null, 2), 'utf8')
  } catch (e) {
    console.error(`❌ Failed to write config: ${e.message}`)
  }
}

module.exports = {
  getConfig,
  setConfig
}
