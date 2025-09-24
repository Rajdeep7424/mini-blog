import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBlog } from "../../services/blogService";
import Message from "../../components/Message/Message";
import styles from './CreateBlog.module.css'

export default function CreateBlog() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState(""); // <-- new state for tags
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (content.length < 10) {
      setMessage("Content must be at least 10 characters long");
      setMessageType("error");
      return;
    }
    
    if (title.length < 3) {
      setMessage("Title must be at least 3 characters long");
      setMessageType("error");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setMessageType("");

    // Convert comma-separated tags into an array and trim whitespace
    const tagsArray = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      const response = await createBlog({ title, content, tags: tagsArray });
      
      if (response) {
        console.log("Blog created successfully:", response);
        setMessage("Blog created successfully! Redirecting...");
        setMessageType("success");
        setTimeout(() => {
          navigate(`/myblogs/${response.data._id}`);
        }, 1500);
      } else {
        throw new Error(response.message || "Blog creation failed unexpectedly");
      }
      
    } catch (err) {
      console.error("Error creating blog:", err);
      setMessage(err.message || "Failed to create blog. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  return (
    <div className={styles.container}>
      <Message 
        message={message} 
        type={messageType} 
        onClose={clearMessage}
        duration={3000}
      />
      <h2>Create a New Blog</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter blog title (min. 3 characters)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <textarea
          placeholder="Write your blog content here... (min. 10 characters)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
        />
        <input
          type="text"
          placeholder="Enter tags separated by commas (e.g., tech, coding)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Blog"}
        </button>
      </form>
    </div>
  );
}

