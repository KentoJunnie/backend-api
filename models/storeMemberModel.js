const mongoose = require('mongoose');

const storeMemberSchema = new mongoose.Schema({
	store: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Store',
		required: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	role: {
		type: String,
		enum: ['Owner', 'Manager', 'Staff'],
		default: 'Staff',
	},
	status: {
		type: String,
		enum: ['Active', 'Invited', 'Suspended'],
		default: 'Active',
	},
}, { timestamps: true });

storeMemberSchema.index({ store: 1, user: 1 }, { unique: true });

const StoreMember = mongoose.model('StoreMember', storeMemberSchema);

module.exports = StoreMember;



