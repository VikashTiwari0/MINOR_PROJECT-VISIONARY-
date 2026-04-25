# Visionary - Social Media Platform

A full-stack social media application built with **Express.js**, **MongoDB**, and **Cloudinary** for image hosting.

## 🚀 Features

### Core Features
- **User Authentication**: Sign up, login, logout with JWT tokens
- **Profile Management**: Edit profile (name, bio, website, avatar)
- **Posts**: Create, view, edit, and delete posts with images
- **Likes**: Like/unlike posts (with real-time count)
- **Comments**: Add and delete comments on posts
- **Follow System**: Follow/unfollow users, view followers & following lists
- **Feed**: Personalized feed from followed users + infinite scroll pagination
- **Search**: Real-time user search
- **Image Hosting**: All images uploaded to Cloudinary

### Pages
1. **Dashboard** (`/dashboard`) - Personalized feed with posts from followed users
2. **Profile** (`/profile`) - User's own profile with edit capabilities
3. **User Profile** (`/user-profile?id=userId`) - View other users' profiles (read-only)
4. **Sign Up** (`/sign-up`) - Registration with optional avatar upload
5. **Sign In** (`/sign-in`) - Login page
6. **Home** (`/`) - Landing page

---

## 📋 Database Schemas

### User Schema (`models/userSchema.js`)
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (hashed with bcrypt),
  avatar: { url, public_id },
  bio: String (max 160 chars),
  website: String,
  followers: [ObjectId],
  following: [ObjectId],
  refreshtoken: String,
  timestamps: true
}
```

### Post Schema (`models/postSchema.js`)
```javascript
{
  author: ObjectId (ref: User),
  caption: String (max 2200 chars),
  image: { url, public_id },
  likes: [ObjectId],
  comments: [{
    user: ObjectId (ref: User),
    text: String,
    timestamps: true
  }],
  tags: [String],
  timestamps: true
}
```

---

## 🔌 API Endpoints

### User Routes (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user with optional avatar |
| POST | `/login` | ❌ | Login user (sets cookies) |
| POST | `/logout` | ✅ | Logout user |
| GET | `/refresh-token` | ❌ | Refresh access token |
| GET | `/me` | ✅ | Get current user's profile |
| GET | `/profile/:userId` | ❌ | Get any user's profile |
| PATCH | `/update-profile` | ✅ | Update own profile (name, bio, website, avatar) |
| POST | `/follow/:targetId` | ✅ | Follow/unfollow a user |
| GET | `/search?q=query` | ✅ | Search users by name |

### Post Routes (`/api/posts`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create` | ✅ | Create new post (requires image) |
| GET | `/feed?page=1&limit=8` | ✅ | Get personalized feed (posts from followed users) |
| GET | `/explore?page=1&limit=12` | ❌ | Get all public posts |
| GET | `/:id` | ❌ | Get single post with all comments |
| GET | `/user/:userId?page=1&limit=9` | ❌ | Get user's posts |
| POST | `/:id/like` | ✅ | Like/unlike a post |
| POST | `/:id/comment` | ✅ | Add comment to post |
| DELETE | `/:postId/comment/:commentId` | ✅ | Delete own comment |
| PATCH | `/:id` | ✅ | Update post caption (author only) |
| DELETE | `/:id` | ✅ | Delete post (author only) |

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or cloud via MongoDB Atlas)
- Cloudinary account (for image hosting)

### Installation

1. **Clone/Extract the project**
   ```bash
   cd CA2-PROJECT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create `.env` file in root directory:
   ```
   JWT_SECRET=your_jwt_secret_here
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=social_media_db
   
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Start the server**
   ```bash
   npm start
   # Server will run on http://localhost:3000
   ```

---

## 📱 Frontend Features

### Dashboard
- View personalized feed from followed users
- Infinite scroll with automatic "load more" on scroll down
- Like/unlike posts with real-time count
- Add comments with live updates
- Search users in real-time
- Navigate to other users' profiles
- Quick access to profile

### Profile Page
- Display user's posts in grid layout (3 columns)
- View profile stats (posts, followers, following)
- Click to view followers/following lists
- Edit profile (name, bio, website, avatar)
- Create new posts
- View individual posts in modal
- Edit or delete own posts
- Edit captions

### User Profile (View-only)
- Display user's public profile
- View user's posts
- Follow/unfollow button
- View followers/following lists
- Cannot edit (read-only)

### Authentication
- Sign-up with optional avatar
- Sign-in with email/password
- Auto-logout on expired token
- Persistent login via refresh tokens

---

## 🎨 Design System

**Color Palette:**
- Ink: `#1a1612` (dark text)
- Cream: `#f5f0e8` (background)
- Gold: `#c9a84c` (accents)
- Muted: `#8a7f72` (secondary text)

**Typography:**
- Serif: Cormorant Garamond (headings, logo)
- Sans: DM Sans (body, UI)

---

## 📦 Project Structure

```
CA2-PROJECT/
├── app.js                    # Express server & routes
├── .env                      # Environment variables
├── package.json
├── controllers/
│   ├── user_controller.js   # User routes (auth, profile, follow)
│   └── post_controller.js   # Post routes (CRUD, like, comment)
├── models/
│   ├── userSchema.js        # User MongoDB schema
│   └── postSchema.js        # Post MongoDB schema
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── multer.js            # File upload configuration
├── utils/
│   └── cloudinary.js        # Cloudinary upload/delete functions
├── db/
│   └── index.js             # MongoDB connection
└── public/
    ├── index.html           # Landing page
    ├── dashboard.html       # Main feed
    ├── profile.html         # User's own profile
    ├── user-profile.html    # Other users' profiles
    ├── sign-up.html         # Registration
    ├── sign-in.html         # Login
    └── uploads/             # Local temp image storage
```

---

## 🔐 Security Features

- **Password Hashing**: bcrypt (10 rounds)
- **JWT Tokens**: Access (1h) + Refresh (7d)
- **HttpOnly Cookies**: Secure token storage
- **CSRF Protection**: SameSite=Strict
- **Input Validation**: Basic validation on form inputs
- **Authorization Checks**: User can only edit/delete own posts and comments

---

## 🚀 Performance Optimizations

- **Pagination**: Feed and profile posts paginated (8-12 per page)
- **Infinite Scroll**: Load more posts automatically on scroll
- **Lean Queries**: Used `.lean()` for read-only queries
- **Image Optimization**: Cloudinary handles compression
- **Lazy Loading**: Images load on demand

---

## 🐛 Common Issues & Fixes

### Cloudinary Upload Fails
- Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env`
- Ensure `public/uploads/` directory exists for temp storage

### MongoDB Connection Error
- Check MongoDB is running: `mongod`
- Verify `MONGODB_URI` is correct
- If using Atlas, whitelist your IP address

### CORS Issues
- Ensure cookies are sent: `credentials: 'include'` in fetch requests
- Check `app.use(cookieParser())` is called before routes

### Token Expiration
- Refresh token endpoint handles auto-refresh
- Users will be redirected to login if token is invalid

---

## 📝 Notes

- **Image Upload**: Images are temporarily saved in `public/uploads/` then uploaded to Cloudinary, then deleted locally
- **Real-time Updates**: Frontend manually updates counts on like/comment (no WebSocket yet)
- **Responsive Design**: Mobile-first approach, works on all screen sizes
- **Future Enhancements**: 
  - WebSocket for real-time notifications
  - Direct messaging
  - Post hashtag search
  - User recommendations
  - Story feature

---

## 🤝 Contributing

Feel free to fork and submit pull requests for improvements!

---

## 📄 License

ISC

---

**Built with ❤️ using Express.js, MongoDB, and Cloudinary**
