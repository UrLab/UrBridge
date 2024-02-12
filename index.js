require("dotenv").config()

const Bridge = require("./Bridge")

const bridge = new Bridge(true)

bridge.start()