# Quick Start Guide - Visionary

## 1️⃣ Prerequisites
- Node.js v18+
- MongoDB running locally or cloud (MongoDB Atlas)
- Cloudinary account with API credentials

## 2️⃣ Setup in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure .env
Edit `.env` with your credentials:
```
JWT_SECRET=BOMBERDILLO_CROCODILLO

# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=SAMPLE_PROJECT

# Cloudinary (already filled with demo account)
CLOUDINARY_CLOUD_NAME=dt3vdnwgu
CLOUDINARY_API_KEY=523892368286483
CLOUDINARY_API_SECRET=4lZ5mrepb2QFAPzxEg4mobSwYQo
CLOUDINARY_URL=cloudinary://523892368286483:4lZ5mrepb2QFAPzxEg4mobSwYQo@dt3vdnwgu
```

### Step 3: Start MongoDB
```bash
# If installed locally
mongod
```

### Step 4: Run the Server
```bash
npm start
```
Server runs on **http://localhost:3000**

---

## 3️⃣ Test the App

### Create an Account
1. Go to http://localhost:3000/sign-up
2. Enter name, email, password
3. (Optional) Upload an avatar
4. Click "Create Account" → redirects to **Dashboard**

### Try Features
- ✅ **Create Post** - Click "+ New Post", select image, add caption
- ✅ **Like/Comment** - Hover over posts in feed
- ✅ **Follow Users** - Search users in top search bar
- ✅ **View Profile** - Click your avatar in nav
- ✅ **Edit Profile** - On your profile page
- ✅ **Infinite Scroll** - Scroll down to load more posts

---

## 4️⃣ Project Structure

```
app.js                 → Main server & routes
controllers/
  ├── user_controller.js       → User auth & profile
  └── post_controller.js       → Posts, likes, comments
models/
  ├── userSchema.js           → User database structure
  └── postSchema.js           → Post database structure
public/
  ├── dashboard.html          → Main feed
  ├── profile.html            → Your profile
  ├── user-profile.html       → Other users' profiles
  └── sign-*.html             → Auth pages
```

---

## 5️⃣ API Endpoints (for Reference)

### User Routes
```
POST   /api/users/register              (Sign up)
POST   /api/users/login                 (Sign in)
GET    /api/users/me                    (Get current user)
PATCH  /api/users/update-profile        (Edit profile)
POST   /api/users/follow/:id            (Follow user)
GET    /api/users/search?q=name         (Search users)
```

### Post Routes
```
POST   /api/posts/create                (Create post)
GET    /api/posts/feed                  (Get feed with pagination)
GET    /api/posts/user/:id              (Get user's posts)
POST   /api/posts/:id/like              (Like/unlike)
POST   /api/posts/:id/comment           (Add comment)
DELETE /api/posts/:id                   (Delete post)
```

---

## 6️⃣ Common Issues

### ❌ "Cannot connect to MongoDB"
```bash
# Make sure MongoDB is running
mongod
# Then start the server in another terminal
npm start
```

### ❌ "Cloudinary upload failed"
- Check `.env` has correct Cloudinary credentials
- Ensure `public/uploads/` directory exists
- Create it manually: `mkdir public/uploads`

### ❌ "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 7️⃣ What's Included

✅ **Authentication** - JWT + Refresh tokens  
✅ **Post CRUD** - Create, edit, delete posts  
✅ **Likes** - Like/unlike with real-time counts  
✅ **Comments** - Add/delete comments  
✅ **Follow System** - Follow/unfollow users  
✅ **Feed** - Personalized feed with pagination  
✅ **Search** - Real-time user search  
✅ **Responsive** - Works on mobile, tablet, desktop  

---

## 🎯 Next Steps

1. **Explore the Code**: Check `controllers/` for API logic
2. **Customize**: Modify colors in `.css` sections of HTML files
3. **Extend**: Add notifications, DMs, or story features
4. **Deploy**: Use Heroku, Railway, or Render

---

## 📞 Need Help?

- Check **README.md** for detailed documentation
- Review API endpoints in **README.md**
- Verify `.env` configuration
- Ensure MongoDB is running
- Check browser console for errors (F12)

---

**Happy coding! 🚀**
