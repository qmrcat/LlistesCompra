const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const authMiddleware = require('../middlewares/auth');




// Proteger todas las rutas
router.use(authMiddleware);

router.use((req, res, next) => {
    console.log(`Captured endpoint: ${req.method} ${req.originalUrl}`);
    next();
});

router.post('/', listController.createList);
router.get('/', listController.getUserLists);
router.get('/invitations', listController.getPendingInvitations);
router.get('/listsItems/:listId', listController.getListDetail); 
router.get('/list/:listId', listController.getListDetail); 
router.put('/:listId', listController.updateListDetail); 
router.post('/:listId/invite', listController.inviteUserToList);
router.post('/:listId/leave', listController.leaveList); // 
router.get('/invitation/:token', listController.acceptInvitation);
router.delete('/invitation/:invitationId', listController.cancelInvitation);
router.post('/invitation/:invitationId/resend', listController.resendInvitation);
router.post('/invitation/:token/reject', listController.rejectInvitation);


module.exports = router;