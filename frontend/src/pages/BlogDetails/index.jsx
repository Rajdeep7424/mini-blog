import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBlog } from "../../services/blogService";
import styles from "./BlogDetails.module.css"

export default function BlogDetails() {
  const { id } = useParams(); // get blog id from URL
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlog();
  }, []);

  const fetchBlog = async () => {
    try {
      const response = await getBlog(id);
      setBlog(response.data);
    } catch (error) {
      console.error("Error fetching blog details:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <p>Loading...</p>;
  if (!blog) return <p>Blog not found.</p>;

  return (
    <div className={styles.blogcontainer}>
      <button className={styles.backbtn} onClick={() => navigate(-1)}>⬅ Back</button>
      <div className={styles.blogcard}>
        <h2>{blog.title}</h2>
        <p className={styles.blogmeta}>
          ✍️ Author: {blog.author?.username || "Unknown"} | 📅 {new Date(blog.createdAt).toLocaleDateString()}
        </p>
        <p className={styles.blogcontent}>{blog.content}</p>
      </div>
    </div>
  );
}
