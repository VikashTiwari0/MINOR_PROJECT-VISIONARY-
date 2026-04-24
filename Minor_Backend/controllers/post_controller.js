import express from 'express';
import 'dotenv/config';
import authMiddleware from '../middleware/auth.js';
import monngoDB from '../db/index.js';
import Post from '../models/postSchema.js';
import User from '../models/userSchema.js';
import upload from '../middleware/multer.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

await monngoDB;
const router = express.Router();

// ─── CREATE POST ───────────────────────────────────────────────
router.post("/create", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const cloudRes = await uploadOnCloudinary(req.file.path);
    if (!cloudRes) return res.status(500).json({ message: "Image upload failed" });

    const post = await Post.create({
      author: req.user._id,
      caption: req.body.caption || "",
      image: { url: cloudRes.secure_url, public_id: cloudRes.public_id },
      tags: req.body.tags ? req.body.tags.split(",").map(t => t.trim()) : []
    });

    const populated = await post.populate("author", "name avatar");
    res.status(201).json({ message: "Post created", post: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET FEED (paginated, infinite scroll) ─────────────────────
// Returns posts from people the user follows + own posts
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const me = await User.findById(req.user._id).select("following");
    const authorIds = [...(me.following || []), req.user._id];

    const [posts, total] = await Promise.all([
      Post.find({ author: { $in: authorIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar")
        .populate("comments.user", "name avatar")
        .lean(),
      Post.countDocuments({ author: { $in: authorIds } })
    ]);

    // attach whether current user liked each post
    const userId = req.user._id.toString();
    const enriched = posts.map(p => ({
      ...p,
      liked: p.likes.some(id => id.toString() === userId),
      likeCount: p.likes.length,
      commentCount: p.comments.length
    }));

    res.json({
      posts: enriched,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET ALL PUBLIC POSTS (explore / no auth required) ─────────
router.get("/explore", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar")
        .lean(),
      Post.countDocuments()
    ]);

    res.json({ posts, hasMore: page * limit < total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET SINGLE POST ────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name avatar bio")
      .populate("comments.user", "name avatar");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── USER'S OWN POSTS ───────────────────────────────────────────
router.get("/user/:userId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ author: req.params.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar")
        .lean(),
      Post.countDocuments({ author: req.params.userId })
    ]);

    res.json({ posts, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── LIKE / UNLIKE ──────────────────────────────────────────────
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const uid = req.user._id;
    const idx = post.likes.indexOf(uid);

    if (idx === -1) {
      post.likes.push(uid);
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();

    res.json({ liked: idx === -1, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADD COMMENT ────────────────────────────────────────────────
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();

    await post.populate("comments.user", "name avatar");
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({ comment: newComment, commentCount: post.comments.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE COMMENT ─────────────────────────────────────────────
router.delete("/:postId/comment/:commentId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await post.save();
    res.json({ message: "Comment deleted", commentCount: post.comments.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE POST (caption) ──────────────────────────────────────
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    post.caption = req.body.caption ?? post.caption;
    await post.save();
    res.json({ message: "Post updated", post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE POST ────────────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await deleteFromCloudinary(post.image.public_id);
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
