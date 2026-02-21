const fs = require("fs");
const path = require("path");
const toml = require("toml");

const envName = process.argv[2];

if (!envName) {
    console.error("❌ Please specify environment: local or production");
    process.exit(1);
}

const tomlPath = path.join(__dirname, "config.toml");

if (!fs.existsSync(tomlPath)) {
    console.error("❌ config.toml not found");
    process.exit(1);
}

const fileContent = fs.readFileSync(tomlPath, "utf-8");
const parsed = toml.parse(fileContent);

if (!parsed[envName]) {
    console.error(`❌ Environment '${envName}' not found in config.toml`);
    process.exit(1);
}

const selectedEnv = parsed[envName];

let envFileContent = "";

for (const key in selectedEnv) {
    const value = selectedEnv[key];

    if (typeof value === "string") {
        envFileContent += `${key}="${value}"\n`;
    } else {
        envFileContent += `${key}=${value}\n`;
    }
}

fs.writeFileSync(path.join(__dirname, ".env"), envFileContent);

console.log(`✅ .env generated for '${envName}'`);