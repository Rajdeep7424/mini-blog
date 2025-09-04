import Blog from '../models/Blog.js';

// @desc    Get all blogs for logged-in user
// @route   GET /api/blogs
// @access  Private
const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .populate("author", "username email") // ✅ populate author
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server Error: Could not fetch blogs',
      error: error.message 
    });
  }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Private
const getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ 
      _id: req.params.id, 
      author: req.user.id 
    }).populate("author", "username email"); // ✅ populate author

    if (!blog) {
      return res.status(404).json({ 
        success: false,
        message: 'Blog not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server Error: Could not fetch blog',
      error: error.message 
    });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private
const createBlog = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide title and content' 
      });
    }

    const blog = await Blog.create({
      title,
      content,
      tags: tags || [],
      author: req.user.id
    });

    await blog.populate("author", "username email"); // ✅ populate author

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server Error: Could not create blog',
      error: error.message 
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
const updateBlog = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    let blog = await Blog.findOne({ 
      _id: req.params.id, 
      author: req.user.id 
    });

    if (!blog) {
      return res.status(404).json({ 
        success: false,
        message: 'Blog not found' 
      });
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.tags = tags || blog.tags;
    blog.updatedAt = Date.now();

    const updatedBlog = await blog.save();
    await updatedBlog.populate("author", "username email"); // ✅ populate author

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server Error: Could not update blog',
      error: error.message 
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ 
      _id: req.params.id, 
      author: req.user.id 
    });

    if (!blog) {
      return res.status(404).json({ 
        success: false,
        message: 'Blog not found' 
      });
    }

    await Blog.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server Error: Could not delete blog',
      error: error.message 
    });
  }
};

export { getBlogs, getBlog, createBlog, updateBlog, deleteBlog };
