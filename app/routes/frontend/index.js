var express = require('express');
var router = express.Router();
const middleWare = require("./../../middleware/loginFrontend");

router.use("/auth", require("./auth"))
router.use("/", middleWare, require("./home"))
router.use("/category", require("./category"))
router.use("/", require("./post"))
router.use("/", require("./about"))
router.use("/", require("./contact"))


module.exports = router;
