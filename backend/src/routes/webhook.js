const { Router } = require("express");
const { handleWebhook } = require("../controllers/webhookController.js");
const { model } = require("mongoose");

const router = Router();
router.post("/", handleWebhook);

// optional: verify endpoint
router.get("/", (req, res) => res.send("Webhook up"));

module.exports = router;
