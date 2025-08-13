const { Router } = require("express");
const {
  listConversations,
  getMessages,
} = require("../controllers/conversationsController.js");

const router = Router();
router.get("/", listConversations);
router.get("/:waId/messages", getMessages);

module.exports = router;
