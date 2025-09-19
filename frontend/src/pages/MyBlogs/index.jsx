import { useState, useEffect } from 'react';
import { getBlogs } from '../../services/blogService';
import { useNavigate } from 'react-router-dom';
import styles from './MyBlogs.module.css';

export default function MyBlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await getBlogs();
      setBlogs(response.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
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
    </div>
  );
}
