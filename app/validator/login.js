const { check, validationResult } = require('express-validator');
const notify = require(__base__configs + "notify")
const util = require("util");

let options = {
    name: {min: 5, max: 20},
    password: {min: 5, max: 20},
}


module.exports = {
    validator: ()=>[
        check('username', util.format(notify.ERR_NAME, options.name.min, options.name.max))
                          .isLength({ min: options.name.min, max: options.name.max }),
        check('password', util.format(notify.ERR_NAME, options.password.min, options.password.max))
                        .isLength({ min: options.password.min, max: options.password.max }),

    ]
}