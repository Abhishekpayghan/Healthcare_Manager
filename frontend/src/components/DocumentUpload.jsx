import { useState } from "react";
import { api } from "../api";
import Icon from "./Icon.jsx";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB, same limit as the backend

export default function DocumentUpload({ patientId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");

    // quick checks here, the backend checks again
    if (!file) return setError("Please choose a PDF file.");
    if (!file.name.toLowerCase().endsWith(".pdf")) return setError("Only PDF files are allowed.");
    if (file.size > MAX_SIZE) return setError("File is too large (max 5 MB).");

    const formData = new FormData();
    formData.append("patient", patientId);
    formData.append("file", file);

    setUploading(true);
    try {
      await api("/documents/", { method: "POST", body: formData });
      setFile(null);
      form.reset();
      onUploaded();
    } catch (err) {
      setError(err.message);
    }
    setUploading(false);
  }

  return (
    <form className="card upload-box" onSubmit={handleSubmit}>
      <label className={file ? "file-picker has-file" : "file-picker"}>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
        <Icon name={file ? "file" : "upload"} size={22} />
        {file ? file.name : "Click to choose a PDF file (max 5 MB)"}
      </label>
      <button type="submit" disabled={uploading}>
        <Icon name="upload" /> {uploading ? "Uploading..." : "Upload PDF"}
      </button>
      {error && <p className="error"><Icon name="alert" /> {error}</p>}
    </form>
  );
}
