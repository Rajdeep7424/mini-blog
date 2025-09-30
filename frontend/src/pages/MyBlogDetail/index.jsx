import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBlog, updateBlogStatus, deleteBlog, updateBlog } from "../../services/blogService";
import Message from "../../components/Message/Message";
import styles from "./MyBlogDetail.module.css";

export default function MyBlogDetails() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", tags: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const response = await getBlog(id);
      setBlog(response.data);
      setEditForm({
        title: response.data.title,
        content: response.data.content,
        tags: (response.data.tags || []).join(", "),
      });
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
        setTimeout(() => navigate("/myblogs"), 1500);
      } catch (error) {
        console.error("Error deleting blog:", error);
        setMessage("Failed to delete blog");
        setMessageType("error");
      }
    }
  };

  const handleEdit = () => {
    setEditForm({
      title: blog.title,
      content: blog.content,
      tags: (blog.tags || []).join(", "), // convert array -> string
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      title: blog.title,
      content: blog.content,
      tags: (blog.tags || []).join(", "),
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const updatedData = {
        ...editForm,
        tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean), // convert string -> array
      };
      const response = await updateBlog(id, updatedData);
      setBlog(response.data);
      setMessage("Blog updated successfully");
      setMessageType("success");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating blog:", error);
      setMessage(error.message || "Failed to update blog");
      setMessageType("error");
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
      <Message message={message} type={messageType} onClose={clearMessage} duration={5000} />

      <button className={styles.backbtn} onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      <div className={styles.blogcard}>
        {isEditing ? (
          <>
            <div className={styles.editForm}>
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleInputChange}
                className={styles.titleInput}
                
              />
              <input
                type="text"
                name="tags"
                value={editForm.tags}
                onChange={handleInputChange}
                className={styles.tagsInput}
                placeholder="Enter tags, separated by commas"
              />
              <textarea
                name="content"
                value={editForm.content}
                onChange={handleInputChange}
                className={styles.contentTextarea}
                rows="15"
              />
            </div>
            <div className={styles.editActions}>
              <button onClick={handleSaveEdit} className={styles.saveBtn}>Save Changes</button>
              <button onClick={handleCancelEdit} className={styles.cancelBtn}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.blogtitle}>{blog.title}</h2>
            <p className={styles.blogmeta}>
              ✍️ Author: {blog.author?.username || "Unknown"} | 📅 {new Date(blog.createdAt).toLocaleDateString()}
            </p>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className={styles.tags}>
                {blog.tags.map((tag, idx) => (
                  <span key={idx} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}

            <p className={`${styles.blogstatus} ${blog.isPublished ? styles.published : styles.draft}`}>
              📌 Status: {blog.isPublished ? "Published" : "Draft"}
            </p>
            <div className={styles.blogcontent}>{blog.content}</div>

            <div className={styles.actions}>
              <button
                onClick={handleToggleStatus}
                className={blog.isPublished ? styles.unpublishBtn : styles.publishBtn}
              >
                {blog.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button onClick={handleEdit} className={styles.editBtn}>Edit</button>
              <button onClick={handleDelete} className={styles.deleteBtn}>Delete</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
