var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const JoinSchema = new Schema({
	uid: Schema.ObjectId,
	gid: Schema.ObjectId,
	read_at: Date,
	removed: { type: Boolean, default: false },
});
module.exports = Join = mongoose.model('Join', JoinSchema);