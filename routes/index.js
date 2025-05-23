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
  const db = req.body.stdob;
  const cls = req.body.stclass.toUpperCase();
  const sect = req.body.stsec.toUpperCase();
  const gen = req.body.cmbGender;
  const add1 = req.body.stadd1.toUpperCase();
  const add2 = req.body.stadd2.toUpperCase();
  const dist = req.body.stdistrict.toUpperCase();
  const pin = req.body.stpin;
  const adhr = req.body.staadhar;
  try {
    const result = await studMstModel.find({ class: cls, roll: rl, sec: sect }).countDocuments().exec();
    console.log("Total count :::: ", result);
    if (result > 0) {
      console.log("Duplicate record");
      res.render('error', { message: 'Duplicate record' })
    } else {
      const studData = {
        class: cls, roll: rl, sec: sect,
        aadhar: adhr,
        name: nm,
        fr_name: frnm,
        mother_name: mrnm,
        dob: db,
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
//Display list of Students
router.get('/display/', async (req, res) => {
  try {
    const studentlist = await studMstModel.find().sort({ class: 1, sec: 1, roll: 1 });

    res.render('display', { studentlist: studentlist, moment: moment, title: "List of students" });
  } catch (err) {
    // Log the error and send an appropriate response
    console.error('Error retrieving employee list:', err);
    res.status(500).send('Internal server error');
  }
})

//Edit records get method
router.get('/edit-stud/:id', async (req, res) => {
  var id = req.params.id;
  //var edit= studMstModel.findById(id);
  try {
    const data = await studMstModel.findById(id).exec();
    res.render('edit-stud', { sdata: data, moment: moment, title: "Edit student data" });
  } catch (err) {
    next(err);
  }
});

//Delete
router.post("/delete-stud/:id", async (req, res) => {
  var id = req.params.id;
  try {
    const data = await studMstModel.findByIdAndDelete(id).exec();
     res.redirect('../display');
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
})


//Edit POST method
router.post("/updatestudent/", async (req, res) => {
  try {
    const studData = {
      class: req.body.stclass.toUpperCase(),
      roll: req.body.stroll,
      sec: req.body.stsec.toUpperCase(),
      aadhar: req.body.staadhar,
      name: req.body.stname.toUpperCase(),
      fr_name: req.body.frname.toUpperCase(),
      mother_name: req.body.mrname.toUpperCase(),
      dob: req.body.stdob,
      mobile: req.body.stnumber,
      gender: req.body.cmbGender,
      address: {
        line1: req.body.stadd1.toUpperCase(),
        line2: req.body.stadd2.toUpperCase(),
        district: req.body.stdistrict.toUpperCase(),
        pin: req.body.stpin
      }
    };

    console.log("Updating student with ID:", req.body.id);
    const updated = await studMstModel.findByIdAndUpdate(req.body.id, studData, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      console.log('No document found to update.');
      return res.status(404).send('Student not found');
    }

    console.log('Updated student:', updated);
    res.redirect('../display');
  } catch (err) {
    console.log('Error updating student:', err);
    res.status(500).send('Internal Server Error');
  }
});


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
