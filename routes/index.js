var express = require("express");
var os = require('os');
var studMstModel = require("../schema/student_master");
var moment = require('moment');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Home', class:'', sec:'' });
});

/* POST METHOD OF STUDENT ENTRY*/
router.post('/addstudent/', async (req, res) => {
  // const nm = (req.body.stname);
  const nm = req.body.stname.toUpperCase();
  const rl = req.body.stroll;
  const frnm = req.body.frname.toUpperCase();
  const mob = req.body.stnumber;
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
      res.render('error', {message:'Duplicate record'})
    } else {
      const studData = {
        class: cls, roll: rl, sec: sect,
        name: nm,
        fr_name: frnm,
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
      res.render('index', { title: 'Home', class:cls, sec:sect });
    }
  } catch (err) {
    console.log('Error:', err);
    res.status(500).send('Internal Server Error');
  }
})
module.exports = router;
