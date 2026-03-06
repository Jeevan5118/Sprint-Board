const express = require('express');
const multer = require('multer');
const AdminImportController = require('../controllers/adminImportController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.post('/import/csv', upload.single('file'), AdminImportController.importCsv);

module.exports = router;
