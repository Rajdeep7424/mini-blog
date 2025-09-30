const API_URL = "http://localhost:5000/api/blogs";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Get all blogs for current user
// export const getBlogs = async () => {
//   try {
//     const res = await fetch(API_URL, {
//       method: 'GET',
//       headers: getAuthHeaders(),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(data.message || 'Failed to fetch blogs');
//     }

//     return data;
//   } catch (error) {
//     console.error('Get blogs error:', error);
//     throw error;
//   }
// };
export const getBlogs = async (page = 1, limit = 10, filters = {}) => {
  try {
    // Build query string with pagination and filters
    const queryParams = new URLSearchParams({
      page: page,
      limit: limit,
      ...filters
    });

    const res = await fetch(API_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch all blogs');
    }

    return data;
  } catch (error) {
    console.error('Get all blogs error:', error);
    throw error;
  }
};

// Get all blogs (public, from all users) with pagination
export const getAllBlogs = async (page = 1, limit = 10, filters = {}) => {
  try {
    // Build query string with pagination and filters
    const queryParams = new URLSearchParams({
      page: page,
      limit: limit,
      ...filters
    });

    const res = await fetch(`${API_URL}/public?${queryParams}`, {
      method: 'GET',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch all blogs');
    }

    return data;
  } catch (error) {
    console.error('Get all blogs error:', error);
    throw error;
  }
};
// Get single blog (public)
export const getPublicBlog = async (blogId) => {
  try {
    const res = await fetch(`${API_URL}/public/${blogId}`, {
      method: 'GET',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch blog');
    }

    return data;
  } catch (error) {
    console.error('Get public blog error:', error);
    throw error;
  }
};

export const updateBlogStatus = async (id, isPublished) => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isPublished }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update blog status");
    }

    return data;
  } catch (error) {
    console.error("Update blog status error:", error);
    throw error;
  }
};

// Get single blog by ID
export const getBlog = async (blogId) => {
  try {
    const res = await fetch(`${API_URL}/${blogId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch blog');
    }

    return data;
  } catch (error) {
    console.error('Get blog error:', error);
    throw error;
  }
};

// Create a new blog
export const createBlog = async (blogData) => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(blogData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create blog');
    }

    return data;
  } catch (error) {
    console.error('Create blog error:', error);
    throw error;
  }
};

// Update a blog
export const updateBlog = async (blogId, blogData) => {
  try {
    const res = await fetch(`${API_URL}/${blogId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(blogData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update blog');
    }

    return data;
  } catch (error) {
    console.error('Update blog error:', error);
    throw error;
  }
};

// Delete a blog
export const deleteBlog = async (blogId) => {
  try {
    const res = await fetch(`${API_URL}/${blogId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete blog');
    }

    return data;
  } catch (error) {
    console.error('Delete blog error:', error);
    throw error;
  }
};

// Optional: Get blogs by tags
export const getBlogsByTag = async (tag) => {
  try {
    const res = await fetch(`${API_URL}?tag=${tag}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch blogs by tag');
    }

    return data;
  } catch (error) {
    console.error('Get blogs by tag error:', error);
    throw error;
  }
};