const { Router } = require("express");
const { createMessage } = require("../controllers/messagesController.js");

const router = Router();
router.post("/", createMessage);
module.exports = router;
