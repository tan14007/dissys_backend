var express = require("express");
var router = express.Router();
var User = require("../models/user.js");
var Group = require("../models/group.js");
var Message = require("../models/message.js");
var Join = require("../models/join.js");

/*
 * GET: /
 * Request all member
 * Query
 *    ROOM_ID: String // Room Name
 * Return
 *    [String]: Users name if the room is found
 *    Otherwise, return "Room does not exist"
 */
router.get("/", function(req, res) {
  User.find({}, err, users => {
    return res.status(200).send(users.map(user => user.name));
  });
});

module.exports = router;
