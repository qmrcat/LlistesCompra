const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const authMiddleware = require('../middlewares/auth');

// Proteger todas las rutas
router.use(authMiddleware);

// Rutas para listas
// router.post('/', listController.createList);
// router.get('/', listController.getUserLists);
// router.get('/:listId', listController.getListDetail);
// router.post('/:listId/invite', listController.inviteUserToList);
// router.get('/invitation/:token', listController.acceptInvitation);

// router.post('/', listController.createList);
// router.get('/', listController.getUserLists);
// router.get('/invitations', listController.getPendingInvitations);
// router.get('/:listId', listController.getListDetail);
// router.post('/:listId/invite', listController.inviteUserToList);
// router.get('/invitation/:token', listController.acceptInvitation);

// router.post('/', listController.createList);
// router.get('/', listController.getUserLists);
// router.get('/invitations', listController.getPendingInvitations);
// router.get('/:listId', listController.getListDetail);
// router.post('/:listId/invite', listController.inviteUserToList);
// router.get('/invitation/:token', listController.acceptInvitation);
// router.delete('/invitation/:invitationId', listController.cancelInvitation);
// router.post('/invitation/:invitationId/resend', listController.resendInvitation);

router.post('/', listController.createList);
router.get('/', listController.getUserLists);
router.get('/invitations', listController.getPendingInvitations);
router.get('/:listId', listController.getListDetail);
router.post('/:listId/invite', listController.inviteUserToList);
router.post('/:listId/leave', listController.leaveList);
router.get('/invitation/:token', listController.acceptInvitation);
router.delete('/invitation/:invitationId', listController.cancelInvitation);
router.post('/invitation/:invitationId/resend', listController.resendInvitation);
router.post('/invitation/:token/reject', listController.rejectInvitation);


module.exports = router;