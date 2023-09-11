import express from "express"
import {  deleteProfile, followandUnfollowUser, forgotPassword, getAllUsers, getUserProfile, login, logout, myProfile, register, resetPassword, updatePassword, updateProfile } from "../controllers/user.js"
import isAuthentication from "../middlewares/auth.js"

const router=express.Router()

router.post("/register",register)
router.post("/login",login)
router.get("/logout",logout)
router.get("/me",isAuthentication,myProfile)
router.get("/follow/:id",isAuthentication,followandUnfollowUser)
router.put("/updatePassword",isAuthentication,updatePassword)
router.put("/updateProfile",isAuthentication,updateProfile)
router.delete("/deleteProfile",isAuthentication,deleteProfile)
router.get("/getUserProfile/:id",isAuthentication,getUserProfile)
router.get("/getAllUsers",isAuthentication,getAllUsers)
router.post("/forgot/password",forgotPassword)
router.put("/password/reset/:token",resetPassword)



export default router