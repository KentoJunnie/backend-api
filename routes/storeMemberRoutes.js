const express = require('express');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const { listMembers, addMember, updateMember, removeMember } = require('../controllers/storeMemberController');

const router = express.Router({ mergeParams: true });

// All routes require authentication and Seller role (owner or manager will be enforced inside controller)
router.use(authenticate, checkRole('Seller'));

router.get('/:storeId/members', listMembers);
router.post('/:storeId/members', addMember);
router.patch('/:storeId/members/:memberId', updateMember);
router.delete('/:storeId/members/:memberId', removeMember);

module.exports = router;



