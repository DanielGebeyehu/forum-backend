const express = require("express");
const router = express.Router();


const authmiddleware = require("../middleware/authmiddleware");

const {
  register,
  login,
  checkuser,
  resetPassword,
  forgotPassword,
} = require("../controllers/usercontrollers");

router.post("/register", register);

router.post("/login", login);

router.get("/checkUser", authmiddleware, checkuser);

router.post("/forgot-Password", forgotPassword);

router.post("/reset-Password", resetPassword);
module.exports = router;
