const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 90 });

module.exports = myCache;