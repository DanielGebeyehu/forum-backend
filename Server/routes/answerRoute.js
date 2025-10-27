const express = require("express");
const router = express.Router();
const authmiddleware = require("../middleware/authmiddleware");

const {
  get_answers,
  post_answers,
  update_answer,
  delete_answer,
} = require("../controllers/answercontrollers");

router.get("/:questionid", authmiddleware, get_answers);

router.post("/:questionid", authmiddleware, post_answers);

router.put("/:answerid", authmiddleware, update_answer);

router.delete("/:answerid", authmiddleware, delete_answer);

module.exports = router;
