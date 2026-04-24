import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, maxlength: 500 },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  caption: { type: String, maxlength: 2200, default: "" },

  image: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  comments: [commentSchema],

  tags: [{ type: String }],

}, { timestamps: true });

// virtual for like count
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

export default mongoose.model("Post", postSchema);
