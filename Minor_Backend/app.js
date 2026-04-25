import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import userController from './controllers/user_controller.js';
import postController from './controllers/post_controller.js';
import cors from "cors";


const app = express();
const __dirname = path.resolve();

app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500", "https://visionarys.netlify.app"], // your frontend URLs
  credentials: true
}));


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userController);
app.use("/api/posts", postController);

// const pages = ["", "about", "contact", "sign-up", "sign-in", "dashboard", "profile", "user-profile"];
// pages.forEach(p => {
//   const route = p === "" ? "/" : `/${p}`;
//   const file = p === "" ? "index" : p;
//   app.get(route, (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', `${file}.html`));
//   });
// });

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
