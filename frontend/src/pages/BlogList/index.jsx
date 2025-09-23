import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBlogs } from '../../services/blogService';
import Pagination from '../../components/Pagination/Pagination';
import styles from './BlogList.module.css';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(2);
  const navigate = useNavigate();

  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getAllBlogs(page, limit);
      
      setBlogs(response.data);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(1);
  }, []);

  const handlePageChange = (newPage) => {
    fetchBlogs(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Function to handle blog click and navigate to details
  const handleBlogClick = (blogId) => {
    navigate(`/blog/${blogId}`);
  };

  if (loading) return <div className={styles.loading}>Loading blogs...</div>;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/createBlog')}>Create New Blog</button>
      <h1 className={styles.head}>Blog feed</h1>
      {blogs.map((blog) => (
        <div
          className={styles.blog}
          key={blog._id}
          onClick={() => navigate(`/blogs/${blog._id}`)} // ✅ navigate to details
        >
          <h3>{blog.title}</h3>
          <p>{blog.content.substring(0, 100)} </p> {/* show only preview */}
        </div>
      ))}

      <Pagination 
        pagination={pagination} 
        onPageChange={handlePageChange} 
      />

      {blogs.length === 0 && (
        <div className={styles.noBlogs}>
          No blogs found. Be the first to create one!
        </div>
      )}
    </div>
  );
};

export default BlogList;