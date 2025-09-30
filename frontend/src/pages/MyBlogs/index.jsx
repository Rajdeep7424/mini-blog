import { useState, useEffect } from 'react';
import { getBlogs } from '../../services/blogService';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Pagination/Pagination';
import styles from './MyBlogs.module.css';

const MyBlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(2);
  const navigate = useNavigate();

  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getBlogs(page, limit);
      
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/createBlog')}>Create New Blog</button>
      <h1 className={styles.head}>My Blogs</h1>
      {blogs.map((blog) => (
        <div
          className={styles.blog}
          key={blog._id}
          onClick={() => navigate(`/myblogs/${blog._id}`)} // ✅ navigate to details
        >
          <h3>{blog.title}</h3>
          <p>{blog.content.substring(0, 100)}...</p> {/* show only preview */}
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
}

export default MyBlogList;