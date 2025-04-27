var express = require("express");
var os = require('os');
var studMstModel = require("../schema/student_master");
var moment = require('moment');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload folder if it doesn't exist
const uploadDir = path.join(__dirname, '../public/upload');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Home', class: '', sec: '' });
});

/* POST METHOD OF STUDENT ENTRY*/
router.post('/addstudent/', async (req, res) => {
  // const nm = (req.body.stname);
  const nm = req.body.stname.toUpperCase();
  const rl = req.body.stroll;
  const frnm = req.body.frname.toUpperCase();
  const mrnm = req.body.mrname.toUpperCase();
  const mob = req.body.stnumber;
  const db=req.body.stdob;
  const cls = req.body.stclass.toUpperCase();
  const sect = req.body.stsec.toUpperCase();
  const gen = req.body.cmbGender;
  const add1 = req.body.stadd1.toUpperCase();
  const add2 = req.body.stadd2.toUpperCase();
  const dist = req.body.stdistrict.toUpperCase();
  const pin = req.body.stpin;
  try {
    const result = await studMstModel.find({ class: cls, roll: rl, sec: sect }).countDocuments().exec();
    console.log("Total count :::: ", result);
    if (result > 0) {
      console.log("Duplicate record");
      res.render('error', { message: 'Duplicate record' })
    } else {
      const studData = {
        class: cls, roll: rl, sec: sect,
        name: nm,
        fr_name: frnm,
        mother_name:mrnm,
        dob:db,
        mobile: mob, gender: gen,
        address: {
          line1: add1,
          line2: add2,
          district: dist,
          pin: pin
        },
      }
      var data = new studMstModel(studData);
      await data.save();
      res.render('index', { title: 'Home', class: cls, sec: sect });
    }
  } catch (err) {
    console.log('Error:', err);
    res.status(500).send('Internal Server Error');
  }
})


// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/upload'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Ex: VA.jpg
  }
});

const upload = multer({ storage: storage });
//const studMstModel = require('../models/StudentModel'); // adjust if path is different

// Route for uploading photo
router.post('/uploadphoto', upload.single('photo'), async (req, res) => {
  const imageName = req.file.filename;
  const fileBase = path.parse(imageName).name;

  const match = fileBase.match(/^([A-Z]+)([A-Z])(\d+)$/);
  if (!match) {
    return res.status(400).send('Invalid filename format. Expected CLASSSECTIONROLL.jpg');
  }

  const cls = match[1].trim().toUpperCase();
  const sec = match[2].trim().toUpperCase();
  const roll = match[3].trim(); // "52"

  try {
    const student = await studMstModel.findOne({ class: cls, sec: sec, roll: roll });

    if (!student) {
      console.log(`Student not found with: ${cls} ${sec} ${roll}`);
      return res.status(404).send('Student not found to update image.');
    }

    console.log("Before update:", student);

    student.imglocation = imageName;
    await student.save();

    const updated = await studMstModel.findById(student._id);
    console.log("After update:", updated);

    res.send('Image uploaded and student updated successfully.');
  } catch (err) {
    console.error('Error saving image name:', err);
    res.status(500).send('Error updating student image.');
  }
});




module.exports = router;
