const mongoose = require('mongoose');

const schema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
schema.statics.next = async function next(key) {
  const doc = await this.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return doc.seq;
};

module.exports = mongoose.model('Counter', schema);