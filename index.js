require("dotenv").config()

const Bridge = require("./Bridge")
const config = require("./config.json")
const bridge = new Bridge(config)

bridge.start()