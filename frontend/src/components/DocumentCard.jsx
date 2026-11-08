import Icon from "./Icon.jsx";

// Three small steps that show how far the document is
function Steps({ status }) {
  const uploaded = "done";
  const reading = status === "pending" ? "" : status === "processing" ? "active" : "done";
  const finished = status === "completed" ? "done" : status === "failed" ? "bad" : "";
  const lastText = status === "failed" ? "Failed" : "Completed";

  return (
    <div className="steps">
      <div className={`step ${uploaded}`}>
        <span className="circle"><Icon name="check" size={12} /></span><span className="text">Uploaded</span>
      </div>
      <span className={`step-line ${reading ? "done" : ""}`} />
      <div className={`step ${reading}`}>
        <span className="circle">{reading === "done" ? <Icon name="check" size={12} /> : "2"}</span>
        <span className="text">AI reading</span>
      </div>
      <span className={`step-line ${finished === "done" ? "done" : ""}`} />
      <div className={`step ${finished}`}>
        <span className="circle">{finished === "done" ? <Icon name="check" size={12} /> : "3"}</span>
        <span className="text">{lastText}</span>
      </div>
    </div>
  );
}

export default function DocumentCard({ doc }) {
  const result = doc.ai_result;
  const busy = doc.status === "pending" || doc.status === "processing";

  return (
    <div className="card">
      <div className="doc-top">
        <span className="doc-icon"><Icon name="file" size={22} /></span>
        <div className="doc-info">
          <div className="doc-title">{doc.name}</div>
          <p className="doc-meta">
            {doc.document_type && <>{doc.document_type} - </>}
            <span className="when">uploaded {new Date(doc.uploaded_at).toLocaleString()}</span>
          </p>
        </div>
        <span className={`badge ${doc.status}`}>
          {busy && <span className="spinner" />}
          {doc.status}
        </span>
      </div>

      <Steps status={doc.status} />

      {doc.status === "failed" && (
        <p className="error" style={{ marginTop: 14 }}><Icon name="alert" /> {doc.error_message}</p>
      )}

      {result && (
        <div className="ai-box">
          <div className="ai-head"><Icon name="sparkle" /> AI extracted information</div>

          <p className="warning">
            <Icon name="alert" />
            <span>
              AI-generated. Please check it against the original document.
              It is not a diagnosis or treatment advice.
            </span>
          </p>

          <div className="summary">
            <span className="k">Summary</span>
            {result.summary}
          </div>

          {result.test_results.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Test</th><th>Value</th><th>Unit</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {result.test_results.map((t, i) => (
                    <tr key={i}>
                      <td>{t.name}</td>
                      <td className="value">{t.value ?? <span className="not-found">not found</span>}</td>
                      <td>{t.unit ?? "-"}</td>
                      <td>{t.date ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No test results found in this document.</p>
          )}
        </div>
      )}
    </div>
  );
}
