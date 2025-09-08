import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBlog, updateBlog } from "../../services/blogService";

export default function EditBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPublished: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const blog = await getBlog(id);
      setFormData({
        title: blog.title,
        content: blog.content,
        isPublished: blog.isPublished,
      });
    } catch (error) {
      console.error("Error fetching blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBlog(id, formData);
      navigate(`/blogs/${id}`); // redirect back to blog details
    } catch (error) {
      console.error("Error updating blog:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit}>
      <h2>Edit Blog</h2>
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Title"
        required
      />
      <textarea
        name="content"
        value={formData.content}
        onChange={handleChange}
        placeholder="Content"
        required
      />
      <label>
        <input
          type="checkbox"
          name="isPublished"
          checked={formData.isPublished}
          onChange={handleChange}
        />
        Published
      </label>
      <button type="submit">Update Blog</button>
    </form>
  );
}
