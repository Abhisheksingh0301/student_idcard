var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cls_master = new Schema({
    class_order: { type: Number, requird: true },
    class: { type: String, required: true },
    entrydt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('class_master', cls_master);