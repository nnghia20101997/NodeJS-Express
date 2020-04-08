var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name    : String,
    status  : String,
    ordering: Number,
    content : String,
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

module.exports =  mongoose.model("items", schema);
