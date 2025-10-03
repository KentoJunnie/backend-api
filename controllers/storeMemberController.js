const Store = require('../models/storeModel');
const StoreMember = require('../models/storeMemberModel');

const requireStoreRole = async (userId, storeId, roles = ['Owner', 'Manager']) => {
	const member = await StoreMember.findOne({ store: storeId, user: userId, status: 'Active' });
	if (!member) return false;
	return roles.includes(member.role);
};

const listMembers = async (req, res) => {
	try {
		const storeId = req.params.storeId;
		const canManage = await requireStoreRole(req.user._id, storeId, ['Owner', 'Manager']);
		if (!canManage) return res.status(403).json({ message: 'Not authorized' });
		const members = await StoreMember.find({ store: storeId }).populate('user', 'name email role');
		res.status(200).json({ members });
	} catch (err) {
		res.status(500).json({ message: 'Failed to list members', error: err.message });
	}
};

const addMember = async (req, res) => {
	try {
		const storeId = req.params.storeId;
		const { userId, role } = req.body;
		const canManage = await requireStoreRole(req.user._id, storeId, ['Owner', 'Manager']);
		if (!canManage) return res.status(403).json({ message: 'Not authorized' });
		const member = await StoreMember.findOneAndUpdate(
			{ store: storeId, user: userId },
			{ role: role || 'Staff', status: 'Active' },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
		res.status(200).json({ member });
	} catch (err) {
		res.status(500).json({ message: 'Failed to add member', error: err.message });
	}
};

const updateMember = async (req, res) => {
	try {
		const storeId = req.params.storeId;
		const memberId = req.params.memberId;
		const { role, status } = req.body;
		const canManage = await requireStoreRole(req.user._id, storeId, ['Owner', 'Manager']);
		if (!canManage) return res.status(403).json({ message: 'Not authorized' });
		const updated = await StoreMember.findOneAndUpdate(
			{ _id: memberId, store: storeId },
			{ ...(role ? { role } : {}), ...(status ? { status } : {}) },
			{ new: true }
		);
		if (!updated) return res.status(404).json({ message: 'Member not found' });
		res.status(200).json({ member: updated });
	} catch (err) {
		res.status(500).json({ message: 'Failed to update member', error: err.message });
	}
};

const removeMember = async (req, res) => {
	try {
		const storeId = req.params.storeId;
		const memberId = req.params.memberId;
		const canManage = await requireStoreRole(req.user._id, storeId, ['Owner', 'Manager']);
		if (!canManage) return res.status(403).json({ message: 'Not authorized' });
		const deleted = await StoreMember.findOneAndDelete({ _id: memberId, store: storeId });
		if (!deleted) return res.status(404).json({ message: 'Member not found' });
		res.status(200).json({ message: 'Member removed' });
	} catch (err) {
		res.status(500).json({ message: 'Failed to remove member', error: err.message });
	}
};

module.exports = { listMembers, addMember, updateMember, removeMember };



