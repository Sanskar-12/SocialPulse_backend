import app from "./app.js";
import connectDb from "./config/database.js";
import cloudinary from "cloudinary"

connectDb()

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})

app.listen(process.env.PORT,()=>{
    console.log(`Server is Listening on port ${process.env.PORT}`)
})