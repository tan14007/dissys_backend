var express = require("express");
var router = express.Router();
var User = require("../models/user.js");
var Group = require("../models/group.js");
var Message = require("../models/message.js");
var Join = require("../models/join.js");

/*
 *  Room controller
 */

/*
 * GET: /
 * Request all room member
 * Query
 *    ROOM_ID: String // Room Name
 * Return
 *    [String]: Users name if the room is found
 *    Otherwise, return "Room does not exist"
 */
router.get("/:ROOM_ID", function(req, res) {
  Group.findOne({ name: req.params.ROOM_ID }, (err, group) => {
    if (err) {
      console.log(err);
      res.status(500);
    }
    if (!group) {
      res.status(404).send({ message: "Room does not exist" });
    } else {
      var gid = group._id;
      var ret = [];
      Join.find({ gid: gid }, (err, joins) => {
        var usernames = [];
        User.find({ _id: { $in: joins.map(join => join.uid) } }).then(users => {
          ret = users.map(user => user.name);
          return res.status(200).send(ret);
        });
      });
    }
  });
});

/*
 * POST: /
 * Join the room
 * Query
 *    ROOM_ID: String // Room Name
 * Body
 *    user: String // User name
 * Return
 *    [String]: Users name
 */
router.post("/:ROOM_ID", function(req, res) {
  var uname = req.body.user;
  var gname = req.params.ROOM_ID;
  Group.findOne({ name: gname }, function(err, group) {
    if (err) throw err;
    if (!group) {
      return res.status(404).send({ mesage: "Group not found" });
    } else {
      var gid = group._id;
      var uid = null;
      User.findOne({ name: uname }, (err, user) => {
        if (!user) {
          var user_model = new User({
            name: uname
          });
          user_model.save().then(user => {
            uid = user._id;
          });
        } else uid = user._id;

        Join.find({ uid: uid, gid: gid }, (err, joins) => {
          if (joins && joins[0] && !joins[0].removed) {
            return res.status(200).send({});
          } else if (joins && joins[0] && joins[0].removed) {
            return res.status(404).send("Already exitted");
          }

          var join_model = new Join({
            uid: uid,
            gid: gid,
            read_at: 0
          });

          join_model.save();
          return res.status(201).send({});
        });
      });
    }
  });
});

/*
 * PUT: /
 * Join the room
 * Query
 *    ROOM_ID: String // Room Name
 * Body
 *    user: String // User name
 * Return
 *    [String]: Users name
 */
router.put("/:ROOM_ID", function(req, res) {
  var uname = req.body.user;
  var gname = req.params.ROOM_ID;
  Group.findOne({ name: gname }, function(err, group) {
    if (err) throw err;
    if (!group) {
      return res.status(404).send({ mesage: "Group not found" });
    } else {
      var gid = group._id;
      var uid = null;
      User.findOne({ name: uname }, (err, user) => {
        if (!user) {
          var user_model = new User({
            name: uname
          });
          user_model.save().then(user => {
            uid = user._id;
            console.log(uid);
            Join.find({ uid: uid, gid: gid }, (err, joins) => {
              if (joins && joins[0] && !joins[0].removed) {
                return res.status(200).send({});
              } else if (joins && joins[0] && joins[0].removed) {
                return res.send("Already exitted");
              }

              var join_model = new Join({
                uid: req.body.uid,
                gid: req.body.gid,
                read_at: 0
              });

              join_model.save(function(err) {
                if (err) throw err;
                else return res.status(201).send({});
              });
            });
          });
        }
      });
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

router.delete("/:ROOM_ID", function(req, res) {
  var uname = req.body.user;
  var gname = req.params.ROOM_ID;
  Group.findOne({ name: gname }, function(err, group) {
    if (err) throw err;
    if (!group) {
      return res.status(404).send({ mesage: "Group not found" });
    } else {
      var gid = group._id;
      var uid = null;
      User.findOne({ name: uname }).then(user => {
        uid = user._id;
        Join.findOne({ uid: uid, gid: gid }).then(join => {
          console.log(join);
          if (!join) {
            res.status(404).send({ message: "User id is not found" });
          } else {
            Join.deleteOne({ uid: uid, gid: gid }, err => {
              if (!err)
                res.status(200).send({
                  message: "USERS_ID leaves the room"
                });
            });
          }
        });
      });
    }
  });
});

module.exports = router;
