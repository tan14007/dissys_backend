var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Group = require('../models/group.js');
var Message = require('../models/message.js');
var Join = require('../models/join.js');

/*
 *  User Section
 */

/*
 * POST: /register
 * If there is no user with given name (req.body.name), register as new user and return uid
 * Otherwise, return the uid
 * Body
 *    name: String // Registering name
 * Return
 *    uid: ObjectId // UserID for Registered name
 */
router.post('/register', function (req, res) {
  var query = { name: req.body.name };
  User.find(query, function (err, users) {
    if (err) throw err
    else if (users.length == 0) {

      var user_model = new User(query);
      user_model.save(function (err, newUser) {
        if (err) throw err
        return res.send({ "uid": newUser.id, "name": req.body.name });
      });
    }
    else return res.send({ "uid": users[0].id, "name": req.body.name });
  });
});

/* 
 * GET: /getuserinformation
 * Get the group id (gid) which given uid staying and not exitting
 * Body
 *    uid: String // UserID that want to get information for joining room
 * Return
 *    groups: [Group]
 */

router.get('/getuserinformation', function (req, res) {
  Join.find( {uid: req.query.uid} , function (err, joins) {
    if(err || !joins) {
      console.error(err);
      res.send({groups: []});
    }
    else {
      var result = [];
      var promises;

      promises = joins.map((join, index) =>
        Group.findById(join.gid).then(function (groups) {
          console.log(join)
          if (join && join.removed) return;
          else if (groups) result.push(groups);
        })
      );

      Promise.all(promises).then(() => {
        if(result.length == 0){
          console.log("No chatroom available");
        }

        res.send({
          groups: result
        });

      });
    }

  });
});

/*
 *  Chat Section
 */

/*
 * POST: /creategroup
 * If there is no group with given name (req.body.gname), register as a new group and return gid
 * Otherwise, return the gid
 * Body
 *    gname: String // Registering group name
 * Return
 *    gid: ObjectId // GroupID for Registered group name
 *    message: String // Descriptive status
 */

router.post('/creategroup', function (req, res) {
  var query = { name: req.body.gname };
  Group.find(query, function (err, groups) {
    if (err) {
      console.error("Error while finding group");
      return res.send({ "gid" : null, "message": "Error while finding group"})
    }
    else if (groups.length == 0) {
      var group_model = new Group(query);
      group_model.save(function (err, group) {
        if (err) throw err;
        var join_model = new Join({ uid: req.body.uid, gid: group.id, read_at: 0 });
        join_model.save(function (err) {
          if (err) throw err;
          return res.send({ "gid": group._id, "message": "Group Created" });
        })
      })
    }
    else {
      return res.send({ "gid": groups[0]._id, "message": "Group Exists" });
    }
  })
});

/*
 * POST: /joingroup
 * Join the group with given gid (req.body.gid)
 *    If the user has been exitted, return string "Already exitted"
 *    If the user user already join, return string "Already joined"
 *    If the gid give is not found, return string "Group not found"
 *    Otherwise, return string "Joined"
 * Body
 *    uid: ObjectID // Joining UserID
 *    gid: ObjectId // GroupID for joining group
 * Return
 *    String, as described above
 */

router.post('/joingroup', function (req, res) {
  Group.findById( req.body.gid, function (err, groups) {
    if (err) throw err
    if (groups.length == 0) {
      return res.send("Group not found");
    }
    else {
      Join.find({ "uid": req.body.uid, "gid": req.body.gid }, (err, joins) => {
        if(joins && joins[0] && !joins[0].removed) {
          return res.send("Already joined");
        }
        else if (joins && joins[0] && joins[0].removed){
          return res.send("Already exitted");
        }


        var join_model = new Join({
          "uid": req.body.uid,
          "gid": req.body.gid,
          "read_at": 0
        });

        join_model.save(function (err) {
          if (err) throw err;
          else
            return res.send("Joined");
        })
      });
    }
  })
});

/*
 * POST: /leavegroup
 * Temporary exit the group with given gid (req.body.gid)
 *    If the user has been exitted, return string "SUCCESS"
 *    Otherwise, return string "ERROR"
 * Body
 *    uid: ObjectID // Exitting UserID
 *    gid: ObjectId // GroupID for exitting group
 * Return
 *    String, as described above
 */

router.post('/leavegroup', function (req, res) {
  var query = { uid: req.body.uid, gid: req.body.gid };
  try{
    ret = Join.find(query, function(err, joins){
      joins.map(function(join, index){
        join.removed = true;
        join.save();
      });
    });
    res.send("SUCCESS");
  }
  catch(e){
    console.log(e);
    res.send("ERROR")
  }

});

/*
 * POST: /exitgroup
 * Permanently exit the group with given gid (req.body.gid)
 *    If the user has been exitted, return string "SUCCESS"
 *    Otherwise, return string "ERROR"
 * Body
 *    uid: ObjectID // Leaving UserID
 *    gid: ObjectId // GroupID for leaving group
 * Return
 *    String, as described above
 */

router.post('/exitgroup', function (req, res) {
  var query = { uid: req.body.uid, gid: req.body.gid };
  Join.remove(query, function (err, joins) {
    console.log(query,joins);
    if (err) return res.send("ERROR");
    return res.send("SUCCESS");
  });
});

/*
 * GET: /getgroup
 * Get all groups
 * Return
 *    [Groups]
 */

router.get('/getgroup', function (req, res) {
  
  Group.find({}, function (err, groups) {
    if (err) {
      throw err;
    }else {
      return res.send(groups);
    }
  });
});


/*
 * GET: /getgroupuser
 * Get all uid in the given gid
 * Body
 *    gid: ObjectId // GroupID for querying group
 * Return
 *    [{ 
 *        uid: ObjectID // UserID associated with the group
 *    }]
 */

router.get('/getgroupuser', function (req, res) {
  result = []
  Join.find({ gid: req.query.gid }, function (err, joins) {
    if (err) {
      throw err
    } else {
      joins.map((join, index) => {
        result.push({ "uid": join.uid });
        if (index === joins.length - 1) return res.send(result);
      });
    }
  });
});

/*
 * GET: /getm
 * Get all messages from the given gid
 *    If the room found, return array of messages
 *    Otherwise, return string "FAIL"
 * Body
 *    gid: ObjectId // GroupID for querying group
 * Return
 *    messages: [{ 
 *        message: {
 *          ...Message, 
 *          user: User, // User info associated with the message
 *        }  
 *    }]
 */

router.get("/getm", function (req, res) {
  Message.find({ gid: req.query.gid }, function (err, messages) {
    if (err) res.send('FAIL');
    else {
      let promises = [];
      promises = messages.map(message => {
        return new Promise((resolve, reject) => {
          
          User.findById( message.uid , (err, user) => {
            if(err) {
              console.error(err);
              reject()
            }
            else {
              
              message._doc.user = user;
              resolve();
            }
          });
        });
      });

      Promise.all(promises).then(() => {
        res.send({messages: messages});
      }).catch((err) => {
        res.send('FAIL');
      });
    }
  });
});

/*
 * GET: /viewunreadm
 * Get all unread messages (for user with given uid) from the given gid
 *    If the error occur, return string "FAIL"
 *    Otherwise, return an object with array of messages
 * Body
 *    uid: ObjectId // UserID for querying group
 *    gid: ObjectId // GroupID for querying group
 * Return
 *    messages: [{ 
 *        message: {
 *          ...Message, 
 *          user: User, // User info associated with the message
 *        }  
 *    }]
 */

router.get('/viewunreadm', function (req, res) {
  var uid = req.query.uid;
  var gid = req.query.gid;
  var query = { uid: uid, gid: gid };
  var read_at;
  Join.find(query, function (err, join) {
    if (err) {
      throw err;
    }
    else
    
    if(join.length) {
      read_at = join[0].read_at;
      Message.find({ send_at: { $gt: read_at }, gid: req.query.gid }).sort('send_at').exec(function (err, messages) {
        if (err) throw err
        else {
          let promises = [];

          promises = messages.map(message => {
            return new Promise((resolve, reject) => {
              User.findById(message.uid, (err, user) => {
                console.log(user);
                if(err) {
                  console.error(err);
                  reject()
                }
                else {
                  message._doc.user = user;
                  resolve();
                }
              });
            });
          });

          Promise.all(promises).then(() => {
            res.send({messages: messages});
          }).catch((err) => {
            res.send('FAIL');
          });
        }
      });
    }
  });
});

/*
 * POST: /sendm
 * Send a message
 *    If the error occur, return string "ERROR"
 *    Otherwise, return an object with sent message with sent user information
 * Body
 *    uid: ObjectId // UserID for querying group
 *    gid: ObjectId // GroupID for querying group
 *    content: String // Message
 * Return
 *    message: String // Sent message
 *    messageOrder: Number // Integer represent message order
 *    user: User //Sent user information
 */

router.post('/sendm', function (req, res) {
  var query = Group.findOne({ gid: req.body.gid }).select('gid');
  query.exec(function (err, group) {
    if (err) throw err;
    else {
      var message_model = new Message({ uid: req.body.uid, gid: req.body.gid, content: req.body.content, send_at: Date.now() });
      message_model.save(function (err, result) {
        if (err) {
          res.send("ERROR");
          throw err
        }
        else {
          User.findById(req.body.uid, (err, users) => {
            let message = result._doc;
            message.user = users
            Message.find({}).then(allMessages => {
              res.send({ message: message, messageOrder: allMessages.length });
            });
          });
        }
      })
    }
  })
});

/*
 * POST: /setread
 * Set message as read at the current time
 *    If the error occur, return string "ERROR"
 *    Otherwise, return string "SUCCESS"
 * Body
 *    uid: ObjectId // UserID for desired group
 *    gid: ObjectId // GroupID for desired group
 * Return
 *    ["SUCCESS" / "ERROR"]
 */

router.post("/setread", function (req, res) {

  Join.findOne({ uid: req.body.uid, gid: req.body.gid }, function (err, joins) {

    if (err) throw err
    else if (joins == null) return res.send("ERROR");
    else {
      joins.set({ read_at: Date.now() });
      joins.save(function (err, update) {
        if (err) throw err
        else {

          return res.send("SUCCESS");
        }
      });
    }
  });
});

/*
 * GET: /getmessageorder
 * Get latest messageOrder number 
 * Return
 *    messageOrder: Number // Number of messages sent
 */
 
router.get('/getmessageorder', function (req, res) {
  Message.find({}).then(allMessages => {
    return res.send({messageOrder: allMessages.length});
  });
});

module.exports = router;
