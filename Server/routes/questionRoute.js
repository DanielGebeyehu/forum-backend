const express = require("express");
const router = express.Router();
const authmiddleware = require("../middleware/authmiddleware");

const {
  get_all_questions,
  get_single_question,
  post_question,
  update_question,
  delete_question, 
} = require("../controllers/questioncontrollers");

router.get("/test-no-auth", (req, res) => {
  res.json({ status: "OK", message: "Test endpoint works!" });
});

router.get("/", authmiddleware, get_all_questions);

router.get("/:questionid", authmiddleware, get_single_question);

router.post("/", authmiddleware, post_question);

router.put("/:questionid", authmiddleware, update_question);

router.delete("/:questionid", authmiddleware, delete_question);

module.exports = router;
