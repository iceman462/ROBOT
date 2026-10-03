const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "data", "settings.json");
const defaults = {
  mode: "public",
  ai: true,
  welcome: true,
  goodbye: true,
  antilink: false,
  antidelete: false,
  antispam: false,
  anticall: false,
  autoread: false,
  autoreact: false,
  autotyping: false,
  online: false,
  recording: false,
  statusview: false,
  statuslike: false,
  groupAI: false,
  dailyAI: false,
  aisticker: false,
  gplinkauto: false,
  botProtect: false,
  ownerGroupLink: "",
  ownerChannelLink: "",
  welcomeText: "👋 Welcome @user to the group!",
  goodbyeText: "👋 Goodbye @user!",
  botAdmins: [],
  sudo: []
};

function load() {
  try {
    if (!fs.existsSync(file)) return {...defaults};
    return {...defaults, ...JSON.parse(fs.readFileSync(file, "utf8"))};
  } catch {
    return {...defaults};
  }
}

let settings = load();

function save() {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(settings, null, 2));
}

function get(key) { return settings[key]; }
function set(key, value) { settings[key] = value; save(); return value; }
function all() { return {...settings}; }

module.exports = {get, set, all, save};
