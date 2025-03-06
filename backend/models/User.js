const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },  // ✅ Added salt field
  publicKey: { type: String, required: false },  
  proof: { type: String }  
});

module.exports = mongoose.model('User', UserSchema);
