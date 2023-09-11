import { sendEmail } from "../middlewares/sendEmail.js";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import crypto from "crypto";
import cloudinary from "cloudinary"

export const register = async (req, res) => {
  try {
    const { name, email, password ,avatar} = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const myCloud=await cloudinary.v2.uploader.upload(avatar)

    user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });

    const token = await user.generateToken();

    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res.status(200).cookie("token", token, options).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesnt exists",
      });
    }

    const isMatch =await user.MatchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const token = await user.generateToken();

    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res.status(200).cookie("token", token, options).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res, next) => {
  try {
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
      .json({
        success: true,
        message: "Logged Out",
      });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const followandUnfollowUser = async (req, res, next) => {
  try {
    let usertoFollow = await User.findById(req.params.id);
    let loggedInUser = await User.findById(req.user._id);

    if (!usertoFollow) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    if (loggedInUser.following.includes(usertoFollow._id)) {
      const indexFollowing = loggedInUser.following.indexOf(usertoFollow._id);
      const indexFollower = usertoFollow.followers.indexOf(loggedInUser._id);

      loggedInUser.following.splice(indexFollowing, 1);
      usertoFollow.followers.splice(indexFollower, 1);

      await usertoFollow.save();
      await loggedInUser.save();

      return res.status(200).json({
        success: true,
        message: "User Unfollowed",
      });
    } else {
      loggedInUser.following.push(usertoFollow._id);
      usertoFollow.followers.push(loggedInUser._id);

      await usertoFollow.save();
      await loggedInUser.save();

      return res.status(200).json({
        success: true,
        message: "User Followed",
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    let user = await User.findById(req.user._id).select("+password");
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide old and new password",
      });
    }

    const isMatch = await user.MatchPassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Old password",
      });
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Updated",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    let user = await User.findById(req.user._id);

    const { name, email,avatar } = req.body;

    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }

    //Cloudinary avatar

    if(avatar)
    {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id)

      const myCloud=await cloudinary.v2.uploader.upload(avatar)
      user.avatar.public_id=myCloud.public_id
      user.avatar.url=myCloud.url

    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile Updated",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProfile = async (req, res, next) => {
  try {
    let user = await User.findById(req.user._id);

    const posts = user.posts;
    const followers = user.followers;
    const following = user.following;
    const userId = req.user._id;

    await cloudinary.v2.uploader.destroy(user.avatar.public_id)

    await user.deleteOne();

    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    //Delete Post of User
    for (let i = 0; i < posts.length; i++) {
      let post = await Post.findById(posts[i]);
      await cloudinary.v2.uploader.destroy(post.image.public_id)
      await post.deleteOne();
    }

    //Delete Follower's following
    for (let i = 0; i < followers.length; i++) {
      let follower = await User.findById(followers[i]);
      const index = follower.following.indexOf(userId);
      follower.following.splice(index, 1);
      await follower.save();
    }

    //Delete Following's followers
    for (let i = 0; i < following.length; i++) {
      let follows = await User.findById(following[i]);
      const index = follows.followers.indexOf(userId);
      follows.followers.splice(index, 1);
      await follows.save();
    }

    const allPosts=await Post.find()
    
    for (let i = 0; i < allPosts.length; i++) {
        let post=await Post.findById(allPosts[i]._id)
        for (let j = 0; j < post.comments.length; j++) {
          if(post.comments[j].user===userId)
          {
            post.comments.splice(j,1)
          }

        }
        await post.save()
    }

    for (let i = 0; i < allPosts.length; i++) {
      let post=await Post.findById(allPosts[i]._id)
      for (let j = 0; j < post.likes.length; j++) {
        if(post.likes[j]===userId)
        {
          post.likes.splice(j,1)
        }

      }
      await post.save()
  }

    res.status(200).json({
      success: true,
      message: "Profile Deleted",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const myProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("posts followers following");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("posts followers following");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({name:{$regex:req.query.name,$options:"i"}});

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetPasswordToken = user.getResetPasswordToken();

    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/password/reset/${resetPasswordToken}`;

    const message = `Reset Your Password by clicking on the link below: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or has expired",
      });
    }

    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    res.status(200).json({
      success: true,
      message: "Password Updated",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
