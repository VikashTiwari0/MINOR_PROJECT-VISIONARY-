import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: { type: String, required: true },

  avatar: {
    url: { type: String },          // image URL (Cloudinary/S3/etc.)
    public_id: { type: String }     // for deletion if using cloud storage
  },

  bio: { type: String, maxlength: 160, default: "" },
  website: { type: String, default: "" },

  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  refreshtoken: { type: String },
  otp: { type: String },
  otp_expiry: { type: Date },

}, { timestamps: true });


// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);

});


//  Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.AccessToken = function () {
  return jwt.sign({
    _id: this._id,
    name: this.name,
    email: this.email
  }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};
userSchema.methods.RefreshToken = function () {
  return jwt.sign({
    _id: this._id

  }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

userSchema.methods.GenerateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = bcrypt.hash(otp, 10);
  this.otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};





export default mongoose.model("User", userSchema);
