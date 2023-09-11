import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import cloudinary from "cloudinary"

export const createPost = async (req, res) => {
  try {

    const myCloud=await cloudinary.v2.uploader.upload(req.body.image,{
      folder:"posts"
    })


    const postData = {
      caption: req.body.caption,
      image: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      owner: req.user._id,
    };

    const post = await Post.create(postData);

    const user = await User.findById(req.user._id);
    user.posts.unshift(post._id);

    await user.save();

    res.status(200).json({
      success: true,
      message:"Post Created",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const removePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Post Not Found",
      });
    }

    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Unauthorised User",
      });
    }

    await cloudinary.v2.uploader.destroy(post.image.public_id)

    await post.deleteOne();

    let user = await User.findById(req.user._id);
    const index = user.posts.indexOf(req.params.id);
    user.posts.splice(index, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Post Deleted",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const likeandunlikepost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Post Not Found",
      });
    }

    if (post.likes.includes(req.user._id)) {
      const index = post.likes.indexOf(req.user._id);
      post.likes.splice(index, 1);
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Post Unliked",
      });
    } else {
      post.likes.push(req.user._id);
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Post Liked",
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPostOfFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const posts = await Post.find({
      owner: {
        $in: user.following,
      },
    }).populate("owner likes comments.user");

    res.status(200).json({
      success: true,
      posts:posts.reverse(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCaption = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);
    const { caption } = req.body;

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    post.caption = caption;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const commentOnPost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);
    const { comment } = req.body;

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    let commentIndex = -1;

    //If Comment already exists
    post.comments.forEach((item, index) => {
      if (item.user.toString() === req.user._id.toString()) {
        commentIndex = index;
      }
    });

    if (commentIndex !== -1) {
      post.comments[commentIndex].comment = comment;
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Comment Updated",
      });
    } else {
      post.comments.push({
        user: req.user._id,
        comment: comment,
      });

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Comment added",
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteComment=async(req,res,next)=>{
  try {
    let post=await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if(post.owner.toString()===req.user._id.toString())
    {

      if(req.body.commentId===undefined)
      {
        return res.status(400).json({
          success:false,
          message:"Comment Id is required"
        })
      }

      post.comments.forEach((item,index)=>{
        if(item._id.toString()===req.body.commentId.toString())
        {
          return post.comments.splice(index,1)
        }
      })

      await post.save()

      return res.status(200).json({
        success:true,
        message:"Selected Comment has deleted"
      })

    }
    else
    {
      post.comments.forEach((item,index)=>{
        if(item.user.toString()===req.user._id.toString())
        {
          return post.comments.splice(index,1)
        }
      })

      await post.save()

      return res.status(200).json({
        success:true,
        message:"Your Comment has deleted"
      })
    }


  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export const getmyPosts=async(req,res,next)=>{
  try {
    const user=await User.findById(req.user._id)

    const posts=[]

    for(let i=0;i<user.posts.length;i++)
    {
      let post=await Post.findById(user.posts[i]).populate("likes comments.user owner")
      posts.push(post)
    }

    res.status(200).json({
      success:true,
      posts
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export const getUserPost=async(req,res,next)=>{
  try {
    const user=await User.findById(req.params.id)

    const posts=[]

    for(let i=0;i<user.posts.length;i++)
    {
      let post=await Post.findById(user.posts[i]).populate("likes comments.user owner")
      posts.push(post)
    }

    res.status(200).json({
      success:true,
      posts
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}
