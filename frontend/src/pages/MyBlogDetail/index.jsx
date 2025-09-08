import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBlog, updateBlogStatus, deleteBlog } from "../../services/blogService";
import Message from "../../components/Message/Message";
import styles from "./MyBlogDetail.module.css";

export default function MyBlogDetails() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const response = await getBlog(id);
      setBlog(response.data);
    } catch (error) {
      console.error("Error fetching blog details:", error);
      setMessage("Failed to load blog");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const response = await updateBlogStatus(id, !blog.isPublished);
      setBlog(response.data);
      setMessage(response.message);
      setMessageType("success");
    } catch (error) {
      console.error("Failed to toggle status:", error);
      setMessage(error.message || "Failed to update blog status");
      setMessageType("error");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await deleteBlog(id);
        setMessage("Blog deleted successfully");
        setMessageType("success");
        setTimeout(() => navigate("/myblogs"), 1500); // Navigate after showing message
      } catch (error) {
        console.error("Error deleting blog:", error);
        setMessage("Failed to delete blog");
        setMessageType("error");
      }
    }
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!blog) return <div className={styles.error}>Blog not found.</div>;

  return (
    <div className={styles.blogcontainer}>
      <Message 
        message={message} 
        type={messageType} 
        onClose={clearMessage}
        duration={5000}
      />
      
      <button className={styles.backbtn} onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      <div className={styles.blogcard}>
        <h2>{blog.title}</h2>
        <p className={styles.blogmeta}>
          ✍️ Author: {blog.author?.username || "Unknown"} | 📅{" "}
          {new Date(blog.createdAt).toLocaleDateString()}
        </p>
        <p
          className={`${styles.blogstatus} ${
            blog.isPublished ? styles.published : styles.draft
          }`}
        >
          📌 Status: {blog.isPublished ? "Published" : "Draft"}
        </p>

        <div className={styles.blogcontent}>
          {blog.content}
        </div>

        <div className={styles.actions}>
          <button 
            onClick={handleToggleStatus}
            className={blog.isPublished ? styles.unpublishBtn : styles.publishBtn}
          >
            {blog.isPublished ? "Unpublish" : "Publish"}
          </button>
          <button onClick={handleDelete} className={styles.deletebtn}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}