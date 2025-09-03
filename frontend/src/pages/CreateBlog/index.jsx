import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBlog } from "../../services/blogService";
import styles from './CreateBlog.module.css'

export default function CreateBlog() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBlog({ title, content });
      navigate("/bloglist"); // go back to BlogList after creation
    } catch (err) {
      console.error("Error creating blog:", err);
      alert("Failed to create blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div   className={styles.container} >
      <h2>Create a New Blog</h2>
      <form onSubmit={handleSubmit} >
        <input
          type="text"
          placeholder="Enter blog title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <textarea
          placeholder="Write your blog content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Blog"}
        </button>
      </form>
    </div>
  );
}
