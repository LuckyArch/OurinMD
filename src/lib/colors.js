const chalk = require("chalk");
const gradient = require("gradient-string");
const figlet = require("figlet");
const timeHelper = require("./timeHelper");

const bannerGradient = gradient(["#00C9FF", "#92FE9D"]);

const theme = {
  primary: chalk.hex("#00FF88"),
  secondary: chalk.hex("#7B68EE"),
  accent: chalk.hex("#00C9FF"),
  text: chalk.hex("#FFFFFF"),
  dim: chalk.hex("#6B7280"),
  muted: chalk.hex("#4B5563"),
  success: chalk.hex("#10B981"),
  error: chalk.hex("#EF4444"),
  warning: chalk.hex("#F59E0B"),
  info: chalk.hex("#3B82F6"),
  debug: chalk.hex("#6B7280"),
  border: chalk.hex("#374151"),
  tag: chalk.hex("#A78BFA"),
};

const ICON = {
  ok: chalk.hex("#10B981")("✓"),
  fail: chalk.hex("#EF4444")("✗"),
  dot: chalk.hex("#3B82F6")("●"),
  warn: chalk.hex("#F59E0B")("!"),
  arrow: chalk.hex("#6B7280")("→"),
  line: "─",
};

function timestamp() {
  return chalk.hex("#6B7280")(`[${timeHelper.formatTime("HH:mm:ss")}]`);
}

function tag(label) {
  return chalk.hex("#A78BFA")(label.toUpperCase().padEnd(9));
}

const logger = {
  info: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.dot} ${theme.text(detail)}`);
  },

  success: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.ok} ${theme.text(detail)}`);
  },

  warn: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.warn} ${theme.warning(detail)}`);
  },

  error: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.fail} ${theme.error(detail)}`);
  },

  system: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.arrow} ${theme.dim(detail)}`);
  },

  debug: (label, detail = "") => {
    console.log(`${timestamp()} ${tag(label)}   ${theme.debug(detail)}`);
  },

  tag: (label, msg, detail = "") => {
    console.log(`${timestamp()} ${tag(label)} ${ICON.dot} ${theme.text(msg)} ${theme.dim(detail)}`);
  },
};

function logMessage(info) {
  if (typeof info === "string") {
    const [chatType, sender, message] = arguments;
    info = {
      chatType,
      sender,
      message,
      pushName: sender,
      groupName: chatType === "group" ? "Unknown" : "Private",
    };
  }

  const { chatType, groupName, pushName, sender, message } = info;
  if (!message || message.trim() === "" || !sender) return;

  const isGroup = chatType === "group";
  const senderNumber = sender.replace("@s.whatsapp.net", "");
  const cleanMsg = message.replace(/\n/g, " ").substring(0, 80) + (message.length > 80 ? "..." : "");
  const time = timeHelper.formatTime("HH:mm:ss");

  const header = isGroup
    ? chalk.hex("#FBBF24").bold(groupName)
    : chalk.hex("#34D399").bold("Private Chat");

  console.log("");
  console.log(theme.border("╭────────────────────────────────────────────╮"));
  console.log(`${theme.border("│")}  ${header}`);
  console.log(`${theme.border("│")}  ${theme.dim("Dari  :")} ${theme.text(pushName)} ${theme.dim(`(${senderNumber})`)}`);
  console.log(`${theme.border("│")}  ${theme.dim("Pesan :")} ${chalk.white(cleanMsg)}`);
  console.log(`${theme.border("│")}  ${theme.dim("Waktu :")} ${theme.dim(time)}`);
  console.log(theme.border("╰────────────────────────────────────────────╯"));
}

function logCommand(command, user, chatType) {
  const isGroup = chatType === "group";
  const type = isGroup
    ? chalk.hex("#7B68EE").bold("GRUP")
    : chalk.hex("#10B981").bold("PRIVAT");
  const time = timeHelper.formatTime("HH:mm:ss");
  const cmdBorder = chalk.hex("#7B68EE");

  console.log(cmdBorder("╭────────────────────────────────────────────╮"));
  console.log(`${cmdBorder("│")}  ${chalk.hex("#A78BFA").bold("⚡ COMMAND")} ${cmdBorder("│")} ${type}`);
  console.log(`${cmdBorder("│")}  ${theme.dim("User  :")} ${chalk.cyan(user)}`);
  console.log(`${cmdBorder("│")}  ${theme.dim("CMD   :")} ${chalk.hex("#00FF88").bold(command)}`);
  console.log(`${cmdBorder("│")}  ${theme.dim("Waktu :")} ${theme.dim(time)}`);
  console.log(cmdBorder("╰────────────────────────────────────────────╯"));
}

function logPlugin(name, category) {
  console.log(`${theme.dim("  ├─")} ${theme.primary(name)} ${theme.dim(`[${category}]`)}`);
}

function logConnection(status, info = "") {
  const w = 44;
  const label =
    status === "connected"
      ? chalk.hex("#10B981").bold("● TERHUBUNG")
      : status === "connecting"
        ? chalk.hex("#F59E0B").bold("◐ MENGHUBUNGKAN")
        : chalk.hex("#EF4444").bold("○ TERPUTUS");

  console.log("");
  console.log(theme.border("═".repeat(w)));
  console.log(`  ${label} ${theme.dim("—")} ${theme.text(info)}`);
  console.log(theme.border("═".repeat(w)));
}

function logErrorBox(title, message) {
  console.log("");
  console.log(chalk.red.bold("╔═ ERROR ═══════════════════════════════════"));
  console.log(`${chalk.red("║")} ${chalk.white.bold(title)}`);
  console.log(chalk.red("╠═══════════════════════════════════════════"));
  console.log(`${chalk.red("║")} ${chalk.gray(message)}`);
  console.log(chalk.red("╚═══════════════════════════════════════════"));
}

function printBanner(mini = false) {
  console.clear();
  if (mini) {
    console.log(bannerGradient("  OURIN-AI • WhatsApp Bot Engine"));
    console.log("");
    return;
  }
  console.log("");
  const ascii = figlet.textSync("OURIN AI", { font: "ANSI Shadow", horizontalLayout: "fitted" });
  console.log(bannerGradient(ascii));
  console.log(bannerGradient("  ══════════════════════════════════════"));
  console.log(`  ${chalk.hex("#6B7280")("WhatsApp Bot Engine")} ${chalk.hex("#374151")("│")} ${chalk.hex("#00FF88")("Powered by Ourin")}`);
  console.log(bannerGradient("  ══════════════════════════════════════"));
  console.log("");
}

function printStartup(info = {}) {
  const { name, version, mode } = info;
  const parts = [
    `${theme.dim("Bot:")} ${theme.primary(name)}`,
    `${theme.dim("v")}${theme.secondary(version)}`,
    `${theme.dim("Mode:")} ${theme.text(mode)}`,
    `${theme.dim("Prefix:")} ${theme.text(".")}`,
  ];
  console.log(`  ${parts.join(` ${theme.border("│")} `)}`);
  console.log("");
}

const CODES = {
  reset: "", bold: "", dim: "", italic: "", underline: "",
  green: "", purple: "", white: "", gray: "", phantom: "",
  lime: "", silver: "", red: "", yellow: "", blue: "",
  cyan: "", magenta: "", bgBlack: "", bgGray: "",
};

const c = {
  green: chalk.green,
  purple: chalk.hex("#9B30FF"),
  white: chalk.white,
  gray: chalk.gray,
  bold: chalk.bold,
  dim: chalk.dim,
  greenBold: (t) => chalk.green.bold(t),
  purpleBold: (t) => chalk.hex("#9B30FF").bold(t),
  whiteBold: (t) => chalk.white.bold(t),
  grayDim: (t) => chalk.gray.dim(t),
  red: chalk.red,
  yellow: chalk.yellow,
  cyan: chalk.cyan,
  blue: chalk.blue,
  magenta: chalk.magenta,
};

function divider() {
  console.log(theme.border("─".repeat(46)));
}

function createBanner(lines, color = "green") {
  const maxLen = Math.max(...lines.map((l) => l.length));
  const padded = lines.map((l) => l.padEnd(maxLen));
  let res = theme.border(`╭${"─".repeat(maxLen + 2)}╮`) + "\n";
  for (const line of padded) {
    res += theme.border("│") + " " + chalk.white(line) + " " + theme.border("│") + "\n";
  }
  res += theme.border(`╰${"─".repeat(maxLen + 2)}╯`);
  return res;
}

function getTimestamp() {
  return theme.dim(timeHelper.formatTime("HH:mm:ss"));
}

module.exports = {
  c,
  CODES,
  logger,
  logMessage,
  logCommand,
  logPlugin,
  logConnection,
  logErrorBox,
  printBanner,
  printStartup,
  createBanner,
  getTimestamp,
  divider,
  theme,
  chalk,
  gradient,
};
