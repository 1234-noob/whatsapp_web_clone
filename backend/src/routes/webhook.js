const { Router } = require("express");
const { handleWebhook } = require("../controllers/webhookController.js");
const { model } = require("mongoose");

const router = Router();
router.post("/", handleWebhook);

module.exports = router;
