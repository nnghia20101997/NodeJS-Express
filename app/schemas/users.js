var mongoose = require('mongoose');
const Schema = mongoose.Schema;


let schema = new mongoose.Schema({
    name    : String,
    status  : String,
    ordering: Number,
    content : String,
    avatar  : String,
    password: String,
    username: String,
    groups: {
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

module.exports = mongoose.model('users', schema);