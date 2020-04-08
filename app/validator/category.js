const { check, validationResult } = require('express-validator');
const notify = require(__base__configs + "notify")
const util = require("util");

let options = {
    name: {min: 5, max: 20},
    ordering: {gt: 0, lt: 100},
    status: "novalue",
    content: {min: 5, max: 200},
    slug: {min: 5, max: 20},
}


module.exports = {
    validator: ()=>[
        check('name', util.format(notify.ERR_NAME, options.name.min, options.name.max))
                          .isLength({ min: options.name.min, max: options.name.max }),

        check("ordering", util.format(notify.ERR_ORDERING, options.ordering.gt, options.ordering.lt))
                            .isInt({gt: options.ordering.gt, lt: options.ordering.lt}),

        check("status", notify.ERR_STATUS).not().isIn([options.status]),

        check('content', util.format(notify.ERR_CONTENT, options.content.min, options.content.max))
                          .isLength({ min: options.content.min, max: options.content.max }),

        check('slug', util.format(notify.ERR_NAME, options.slug.min, options.slug.max))
                            .isLength({ min: options.slug.min, max: options.slug.max }),
    ]
}