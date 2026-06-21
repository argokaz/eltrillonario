// Genera build-info.js con el hash corto del commit en cada deploy de Vercel.
// Vercel expone VERCEL_GIT_COMMIT_SHA durante el build.
const fs = require("fs");
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || "dev").slice(0, 7);
fs.writeFileSync("build-info.js", `window.__BUILD__=${JSON.stringify(sha)};\n`);
console.log("Build stamped:", sha);
