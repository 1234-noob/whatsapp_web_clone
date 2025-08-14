const { Router } = require("express");
const {
  createMessage,
  markMessagesRead,
} = require("../controllers/messagesController.js");

const router = Router();
router.post("/", createMessage);
router.post("/:waId/read", markMessagesRead);

module.exports = router;
