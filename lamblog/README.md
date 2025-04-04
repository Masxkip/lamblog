# Blog App


const express = require("express");
const Post = require("../models/Post");
const verifyToken = require("../middleware/authMiddleware");
const uploadMusic = require("../middleware/uploadMiddleware");
const multer = require("multer");

const router = express.Router();

// ✅ Configure Storage for Post Images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Save files in uploads/
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

const upload = multer({ storage });

// ✅ Create a new post (Authenticated users only, Supports Image Upload)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
    const { title, content, categories } = req.body;

    try {
        const newPost = new Post({
            title,
            content,
            categories,
            author: req.user.id, // User ID from JWT
            image: req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null
        });

        await newPost.save();
        res.status(201).json({ message: "Post created successfully!", post: newPost });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Get all posts
router.get("/", async (req, res) => {
    try {
        const posts = await Post.find().populate("author", "username email");
        if (!posts.length) {
            return res.status(404).json({ message: "No posts found" });
        }
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Get a single post by ID
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("author", "username");
        if (!post) return res.status(404).json({ message: "Post not found" });

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Update a post (Only the post owner can update)
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized: You can only edit your own posts" });
        }

        post.title = req.body.title || post.title;
        post.content = req.body.content || post.content;
        await post.save();

        res.status(200).json({ message: "Post updated successfully!", post });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// ✅ Delete a post (Only the post owner can delete)
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized: You can only delete your own posts" });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Post deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// ✅ Add a Comment to a Post
router.post("/:id/comments", verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = { user: req.user.id, username: req.user.username, text };
        post.comments.push(comment);
        await post.save();

        res.status(201).json({ message: "Comment added successfully!", comments: post.comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Add a Reply to a Comment
router.post("/:postId/comments/:commentId/reply", verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const reply = { user: req.user.id, username: req.user.username, text };
        comment.replies.push(reply);
        await post.save();

        res.status(201).json({ message: "Reply added successfully!", comments: post.comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Add a Comment to a Post (Ensure token is verified)
router.post("/:id/comments", verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text.trim()) return res.status(400).json({ message: "Comment text is required." });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = { user: req.user.id, username: req.user.username, text };
        post.comments.push(comment);
        await post.save();

        res.status(201).json({ message: "Comment added successfully!", comments: post.comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Edit a Comment
router.put("/:postId/comments/:commentId", verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text.trim()) return res.status(400).json({ message: "Comment text is required." });

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized: You can only edit your own comments." });
        }

        comment.text = text; // ✅ Update comment text
        await post.save();

        res.status(200).json({ message: "Comment updated successfully!", comments: post.comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// ✅ Delete a Comment
router.delete("/:postId/comments/:commentId", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const commentIndex = post.comments.findIndex(comment => comment._id.toString() === req.params.commentId);
        if (commentIndex === -1) return res.status(404).json({ message: "Comment not found" });

        if (post.comments[commentIndex].user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized: You can only delete your own comments" });
        }

        post.comments.splice(commentIndex, 1);
        await post.save();

        res.status(200).json({ message: "Comment deleted successfully!", comments: post.comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Delete a Reply
router.delete("/:postId/comments/:commentId/replies/:replyId", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const replyIndex = comment.replies.findIndex(reply => reply._id.toString() === req.params.replyId);
        if (replyIndex === -1) return res.status(404).json({ message: "Reply not found" });

        if (comment.replies[replyIndex].user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized: You can only delete your own replies" });
        }

        comment.replies.splice(replyIndex, 1);
        await post.save();

        res.status(200).json({ message: "Reply deleted successfully!", comments: post.comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




module.exports = router; // ✅ Ensure we export a Router, not an object

