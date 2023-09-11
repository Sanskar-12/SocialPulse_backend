import express from "express"
import { commentOnPost, createPost, deleteComment, getPostOfFollowing, getUserPost, getmyPosts, likeandunlikepost, removePost, updateCaption } from "../controllers/post.js"
import isAuthentication from "../middlewares/auth.js"

const router=express.Router()

router.post("/post/upload",isAuthentication,createPost)
router.get("/postlikeorunlike/:id",isAuthentication,likeandunlikepost)
router.delete("/postremove/:id",isAuthentication,removePost)
router.get("/followingpost",isAuthentication,getPostOfFollowing)
router.get("/mypost",isAuthentication,getmyPosts)
router.get("/userpost/:id",isAuthentication,getUserPost)
router.put("/updatePost/:id",isAuthentication,updateCaption)
router.put("/addorUpdateComment/:id",isAuthentication,commentOnPost)
router.delete("/deletecomment/:id",isAuthentication,deleteComment)

export default router