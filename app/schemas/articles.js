var mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new mongoose.Schema({
    name    : String,
    slug    : String,
    status  : String,
    special  : String,
    ordering: Number,
    content : String,
    thumb  : String,
    categorys: {
        id: String,
        name: String
    },
    created : {
        user_id     : String,
        user_name   : String,
        time        : Date
    },
    modified : {
        user_id     : String,
        user_name   : String,
        time        : Date
    }
})

module.exports = mongoose.model('article', schema);