var express = require("express");
var os = require('os');
var studMstModel = require("../schema/student_master");
var clsMstModel = require("../schema/class_master");
var moment = require('moment');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

// Create upload folder if it doesn't exist
const uploadDir = path.join(__dirname, '../public/upload');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const clsdata = await clsMstModel.find().sort({ class_order: 1 });
    res.render('index', { title: 'Home', classdata: clsdata, sec: '' });
  } catch (err) {
    console.log('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

/* POST METHOD OF STUDENT ENTRY*/
router.post('/addstudent/', async (req, res) => {
  // const nm = (req.body.stname);
  const clsdata = await clsMstModel.find().sort({ class_order: 1 });
  const nm = req.body.stname.toUpperCase();
  const rl = req.body.stroll;
  const frnm = req.body.frname.toUpperCase();
  const mrnm = req.body.mrname.toUpperCase();
  const mob = req.body.stnumber;
  const db = req.body.stdob;
  const cls = req.body.stclass;
  const sect = req.body.stsec;
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
      res.render('msgpage', { message: 'Duplicate record' })
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
      res.render('index', { title: 'Home', class: cls, classdata: clsdata, sec: sect });
    }
  } catch (err) {
    console.log('Error:', err);
    //res.status(500).send('Internal Server Error');
  }
})
//Display list of Students

router.get('/display/', async (req, res) => {
  const { class: cls, sec } = req.query;

  const matchStage = {};
  if (cls) matchStage.class = cls;
  if (sec) matchStage.sec = sec;

  try {
    const students = await studMstModel.aggregate([
      { $match: matchStage }, // ⬅️ Apply filters here

      {
        $lookup: {
          from: 'class_masters',
          localField: 'class',
          foreignField: 'class',
          as: 'class_info'
        }
      },
      {
        $unwind: {
          path: '$class_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: {
          'class_info.class_order': 1,
          sec: 1,
          roll: 1
        }
      }
    ]);

    // Optional: Fetch distinct class/sec for dropdowns
    const allStudents = await studMstModel.find(); // simple query, no sort needed
    const uniqueClasses = [...new Set(allStudents.map(s => s.class))].sort();
    const uniqueSecs = [...new Set(allStudents.map(s => s.sec))].sort();

    res.render('display', {
      studentlist: students,
      moment,
      title: "List of students",
      selectedClass: cls || '',
      selectedSec: sec || '',
      uniqueClasses,
      uniqueSecs
    });
  } catch (err) {
    console.error('Error retrieving student list:', err);
    res.status(500).send('Internal server error');
  }  //fuse.js -> to implement search ramu as rammu
});


//Edit records get method
router.get('/edit-stud/:id', async (req, res) => {
  var id = req.params.id;
  //var edit= studMstModel.findById(id);
  try {
    const data = await studMstModel.findById(id).exec();
    const clsdata = await clsMstModel.find().sort({ class_order: 1 });
    res.render('edit-stud', { sdata: data, classdata: clsdata, moment: moment, title: "Edit student data" });
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
      class: req.body.stclass,
      roll: req.body.stroll,
      sec: req.body.stsec,
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
  console.log(imageName);
  //const match = fileBase.match(/^([A-Z]+)([A-Z])(\d+)$/);
  //const match = fileBase.match(/^([A-Z0-9]+)_([A-Z])_(\d+)$/);
  const match = fileBase.match(/^([A-Z0-9]+)_?([A-Z]?)_(\d+)$/);

  if (!match) {
    return res.status(400).send('Invalid filename format. Expected CLASS_SEC_ROLL.jpg');
  }
  const cls = match[1];  // e.g. "II"
  const sec = match[2];  // e.g. "B"
  const roll = match[3]; // e.g. "66"
  console.log(cls, sec === "" ? "[no section]" : sec, roll);
  try {
    const query = { class: cls, roll: roll };
    if (sec !== "") query.sec = sec; // only add 'sec' to query if it's not empty

    const student = await studMstModel.findOne(query);

    //const student = await studMstModel.findOne({ class: cls, sec: sec, roll: roll });
    //console.log(student);
    if (!student) {
      console.log(`Student not found with: ${cls} ${sec} ${roll}`);
      return res.status(404).send('Student not found to update image.');
    }

    //console.log("Before update:", student);

    student.imglocation = imageName;
    //student.imglocation = `upload/${imageName}`;
    await student.save();

    const updated = await studMstModel.findById(student._id);
    //console.log("After update:", updated);

    res.send('Image uploaded and student updated successfully.');
  } catch (err) {
    console.error('Error saving image name:', err);
    res.status(500).send('Error updating student image.');
  }
});


// 📥 POST route to handle CSV upload
router.post('/upload', upload.single('csvfile'), (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // 🔄 Convert and map row to schema structure
      results.push({
        name: row.name?.toUpperCase(),
        fr_name: row.fr_name?.toUpperCase(),
        mother_name: row.mother_name?.toUpperCase(),
        dob: row.dob ? new Date(row.dob) : null,
        class: row.class?.toUpperCase(),
        roll: row.roll,
        sec: row.sec?.toUpperCase(),
        gender: row.gender
          ? row.gender.charAt(0).toUpperCase() + row.gender.slice(1).toLowerCase()
          : null,
        address: {
          line1: row['address.line1']?.toUpperCase(),
          line2: row['address.line2']?.toUpperCase(),
          district: row['address.district']?.toUpperCase(),
          pin: parseInt(row['address.pin']) || null
        },
        pincode: row.pincode,
        mobile: row.mobile ? parseInt(row.mobile) : null,
        aadhar: row.aadhar || null,
        imglocation: row.imglocation,
        entrydt: new Date()
      });
    })
    .on('end', async () => {
      try {
        await studMstModel.insertMany(results);
        fs.unlinkSync(req.file.path); // clean up uploaded file
        res.redirect('/'); // or res.send('Upload successful')
      } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading CSV: ' + error.message);
      }
    });
});

//To download all the data
router.get('/download', async (req, res) => {
  try {
    const students = await studMstModel.find().lean(); // get all records

    const formattedStudents = students.map((student) => ({
      ...student,
      dob: student.dob
        ? new Date(student.dob).toISOString().split('T')[0] // Format: YYYY-MM-DD
        : '',
      entrydt: student.entrydt
        ? new Date(student.entrydt).toISOString().split('T')[0]
        : ''
    }));

    const fields = [
      'name', 'fr_name', 'mother_name', 'dob', 'class', 'roll', 'sec',
      'gender', 'address.line1', 'address.line2', 'address.district', 'address.pin',
      'pincode', 'mobile', 'aadhar', 'imglocation', 'entrydt'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(formattedStudents);

    res.header('Content-Type', 'text/csv');
    res.attachment('students.csv');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating CSV');
  }
});

module.exports = router;
