var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
	name: String,
});
module.exports = User = mongoose.model('User', UserSchema);