var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username : String,
    karma   : Number
});

let User = mongoose.model('User', userSchema);

module.exports = User
