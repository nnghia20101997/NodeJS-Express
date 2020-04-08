var express = require('express');
var router = express.Router();
const middleware      = require("../../middleware/auth")

router.use("/items", require("./list-add.js"))
router.use("/groups", require("./groups.js"))
router.use("/users",middleware ,require("./users.js"))
router.use("/category", require("./category.js"))
router.use("/articles", require("./articles"))


module.exports = router;
