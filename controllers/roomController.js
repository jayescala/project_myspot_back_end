const express = require('express');
const router = express.Router();
const Rooms = require('../models/rooms.js');

// Main Page Router // Index Route //
router.get('/', async (req, res, next) => {
  try {
    const Room = await Rooms.find();

    res.json({
      status: 200,
      data: Room
    });


  } catch(err) {
    res.send(err)

  }

});

// Search Route
router.get("/search", async (req, res) => {
  try {
    let roomCheck = false;
    Rooms.findOne({code: req.body.roomCode}, (err, roomCode) => {
      let message = "";
      if(roomCode === true){
        roomCheck = true;
        message = "";
      } else {
        roomCheck = false;
        message = "The room code you have entered is incorrect.";
      }
    });
    res.json({
      status: 200,
      data: roomCheck
    });
  } catch(err) {
    res.send(err)
  }
});

// Create Room //
router.post('/', async (req, res) => {
  try {
    const createdRoom = await Rooms.create(req.body);

    res.json({
      status: 200,
      data: createdRoom
  });

  } catch(err) {
    console.log(err);
    res.send(err);
  }
});

// Find Room //
router.get('/:id', async (req, res, next) => {
  try {
    const foundRoom = await Rooms.findOne({code: req.params.id});
    res.json({
      status: 200,
      data: foundRoom
    });


  } catch(err) {
    res.send(err);

  }

});

// Delete Room //
router.delete('/:id', async (req, res) => {
  try {
    const deletedRoom = await Rooms.findByIdAndRemove(req.params.id);
    res.json({
      status: 200,
      data: deletedRoom
    });
  } catch(err) {
    res.send(err);
  }
});

module.exports = router;
