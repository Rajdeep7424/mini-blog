import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicBlog } from "../../services/blogService"; // ✅ correct import
import styles from "./BlogDetails.module.css";

export default function BlogDetails() {
  const { id } = useParams(); // blog id from URL
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const response = await getPublicBlog(id);
      setBlog(response.data);
    } catch (error) {
      console.error("Error fetching blog details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!blog) return <p className={styles.loading}>Blog not found.</p>;

  return (
    <div className={styles.blogcontainer}>
      <button className={styles.backbtn} onClick={() => navigate(-1)}>
        ⬅ Back
      </button>
      <div className={styles.blogcard}>
        <h2 className={styles.blogtitle}>{blog.title}</h2>
        <p className={styles.blogmeta}>
          ✍️ Author: {blog.author?.username || "Unknown"} | 📅{" "}
          {new Date(blog.createdAt).toLocaleDateString()}
        </p>
                {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className={styles.tags}>
            {blog.tags.map((tag, idx) => (
              <span key={idx} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className={styles.blogcontent}>
          {blog.content}
        </p>
      </div>
    </div>
  );
}
