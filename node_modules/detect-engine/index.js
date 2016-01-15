"use strict";

if (process.release) {
  module.exports = process.release.name === "io.js" ? "iojs" : "node";
} else {
  var engine = require("path").basename(process.execPath).toLowerCase();
  module.exports = process.platform === "win32" ? engine.replace(/\.exe$/, "") : engine;
}
