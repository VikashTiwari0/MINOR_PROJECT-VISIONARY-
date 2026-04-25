// import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import authMiddleware from '../middleware/auth.js';
import monngoDB from '../db/index.js';
import User from '../models/userSchema.js';
import upload from '../middleware/multer.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';


await monngoDB;
const router = express.Router();

async function generateAccessandRefreshToken(userId) {
    
    const user = await User.findById(userId);
    if (user) {
        
        const A_token = user.AccessToken();
        const R_token = user.RefreshToken();
        user.refreshtoken = R_token;
        await user.save({
            validateBeforeSave: false
            
        })
        return { A_token, R_token };
    } else {
        throw new Error("Problem while generating token: User not found");
    }
    
}

router.post("/register", upload.single('avatar'), async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const exist = await User.findOne({ email });
        if (exist) {
            return res.status(400).json({ message: "User already exists" });
        }

        let avatarData = {};

        if (req.file) {
            const cloudRes = await uploadOnCloudinary(req.file.path);

            avatarData = {
                url: cloudRes.secure_url,
                public_id: cloudRes.public_id
            };
        }

        const user = await User.create({
            name,
            email,
            password,
            ...(req.file && { avatar: avatarData }) // clean conditional add
        });


        const { A_token, R_token } = await generateAccessandRefreshToken(user._id);

        res.cookie("accessToken", A_token, {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });

        res.cookie("refreshToken", R_token, {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });

        res.status(201).json({ message: "User registered successfully" });
        
        
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: error.message || "Error registering user" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    
    const { A_token, R_token } = await generateAccessandRefreshToken(user._id);
    res.cookie("accessToken", A_token, { httpOnly: true, secure: true, sameSite: 'None' });
    res.cookie("refreshToken", R_token, { httpOnly: true, secure: true, sameSite: 'None' });
    res.json({ message: "Login successful" });
    
});

router.post("/logout", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.refreshtoken = "";
        await user.save({
            validateBeforeSave: false
            
        });
        res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: 'None' });
        res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: 'None' });
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: error.message || "Error logging out" });
    }
});

router.post("/refresh-token", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        if (!user || user.refreshtoken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        const { A_token, R_token } = await generateAccessandRefreshToken(user._id);
        res.cookie("accessToken", A_token, { httpOnly: true, secure: true, sameSite: 'None' });
        res.cookie("refreshToken", R_token, { httpOnly: true, secure: true, sameSite: 'None' });
        res.json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
});

// ─── GET OWN PROFILE ───────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -refreshtoken -otp -otp_expiry")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET ANY USER PROFILE ───────────────────────────────────────
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password -refreshtoken -otp -otp_expiry -email")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE PROFILE ─────────────────────────────────────────────
router.patch("/update-profile", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.website !== undefined) user.website = req.body.website;

    if (req.file) {
      if (user.avatar?.public_id) {
        await deleteFromCloudinary(user.avatar.public_id);
      }
      const cloudRes = await uploadOnCloudinary(req.file.path);
      if (cloudRes) {
        user.avatar = { url: cloudRes.secure_url, public_id: cloudRes.public_id };
      }
    }

    await user.save({ validateBeforeSave: false });
    const updated = await User.findById(user._id).select("-password -refreshtoken -otp -otp_expiry");
    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── FOLLOW / UNFOLLOW ──────────────────────────────────────────
router.post("/follow/:targetId", authMiddleware, async (req, res) => {
  try {
    if (req.params.targetId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const [me, target] = await Promise.all([
      User.findById(req.user._id),
      User.findById(req.params.targetId)
    ]);

    if (!target) return res.status(404).json({ message: "User not found" });

    const alreadyFollowing = me.following.includes(target._id);

    if (alreadyFollowing) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
    }

    await Promise.all([
      me.save({ validateBeforeSave: false }),
      target.save({ validateBeforeSave: false })
    ]);

    res.json({
      following: !alreadyFollowing,
      followersCount: target.followers.length,
      followingCount: me.following.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── SEARCH USERS ───────────────────────────────────────────────
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q.trim()) return res.json([]);
    const users = await User.find({
      name: { $regex: q, $options: "i" }
    }).select("name avatar bio").limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// router.post("/forgot-password", async (req, res) => {
//     const { email } = req.body;
//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//             const otp=User.generateOtp();
            
//         }
//     } catch (error) {
//         console.error("Forgot password error:", error);
//         res.status(500).json({ message: error.message || "Error processing forgot password" });
//     }
// });





export default router;
