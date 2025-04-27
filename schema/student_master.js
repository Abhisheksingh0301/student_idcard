var mongoose = require('mongoose');
var Schema=mongoose.Schema;

var stud_master=new Schema({
    name: {type:String, required:true},
    fr_name: {type:String, required:false},
    mother_name: {type:String, required:false},
    dob:{type : Date},
    class: {type:String, required:true},
    roll: {type:String, required:true},
    sec: {type:String, required:false},
    gender: {type:String, required:true},
    address:
    {
        line1:String,
        line2:String,
        district:String,
        pin:Number
    },
    pincode: {type:String, required:false},
    mobile: {type:Number, required:false},
    aadhar: {type:String, required:false, default:null},
    imglocation: { type: String },
    entrydt:{type:Date, default:Date.now}
});

module.exports=mongoose.model('student_master',stud_master);