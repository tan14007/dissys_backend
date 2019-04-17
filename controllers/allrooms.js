var express = require("express");
var router = express.Router();
var User = require("../models/user.js");
var Group = require("../models/group.js");
var Message = require("../models/message.js");
var Join = require("../models/join.js");

/*
 *  All rooms controller
 */

/*
 * GET: /
 * Request all room
 * Otherwise, return the uid
 * Body
 *    name: String // Registering name
 * Return
 *    uid: ObjectId // UserID for Registered name
 */
router.get("/", function(req, res) {
  Group.find({}, (err, groups) => {
    res.status(200).send(groups.filter(e => e.name).map(e => e.name));
  });
});

/*
 * POST: /
 * Create room with roomID (in this case, given name) if not exists, throw error if room exists
 * Body
 *    uid: String // UserID that want to get information for joining room
 * Return
 *    groups: [Group]
 */

router.post("/", function(req, res) {
  var query = { name: req.body.id };
  Group.find(query, function(err, groups) {
    if (err) {
      console.error("Error while finding group");
      return res.send({ gid: null, message: "Error while finding group" });
    } else if (groups.length == 0) {
      var group_model = new Group(query);
      group_model.save(function(err, group) {
        if (err) throw err;
        return res.status(201).send({ id: query.name });
      });
    } else {
      return res.status(404).send({ message: "ROOM_ID already exists" });
    }
  });
});

/*
 * PUT: /
 * Create room with roomID (in this case, given name) if not exists
 * Body
 *    uid: String // UserID that want to get information for joining room
 * Return
 *    groups: [Group]
 */

router.put("/", function(req, res) {
  var query = { name: req.body.id };
  Group.find(query, function(err, groups) {
    if (err) {
      console.error("Error while finding group");
      return res.send({ gid: null, message: "Error while finding group" });
    } else if (groups.length == 0) {
      var group_model = new Group(query);
      group_model.save(function(err, group) {
        if (err) throw err;
        return res.status(201).send({ id: query.name });
      });
    } else {
      return res.status(200).send({ id: query.name });
    }
  });
});

/*
 * DELETE: /
 * Delete room with roomID (in this case, given name) if not exists
 * Body
 *    uid: String // UserID that want to get information for joining room
 * Return
 *    groups: [Group]
 */

router.delete("/", function(req, res) {
  var query = { name: req.body.id };
  Group.find(query, function(err, groups) {
    if (err) {
      console.error("Error while finding group");
      return res.send({ gid: null, message: "Error while finding group" });
    } else if (groups.length != 0) {
      var group_model = new Group(query);
      Group.deleteMany(query, function(err) {
        if (err) throw err;
        return res.status(200).send({ message: "ROOM_ID Is deleted" });
      });
    } else {
      return res.status(404).send({ message: "Room id is not found" });
    }
  });
});

module.exports = router;
