import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import Icon from "../components/Icon.jsx";
import "./assistant.css";

const examples = [
  "List the patients I can access",
  "Show details of patient 1",
  "Summarize the latest document of patient 1",
];

// turns a tool call into a short readable label
function toolLabel(tool) {
  if (tool.name === "search_patients") return `Searched patients: ${tool.args.query}`;
  if (tool.name === "get_patient") return `Opened patient #${tool.args.patient_id}`;
  if (tool.name === "get_document_details") return `Read document #${tool.args.document_id}`;
  return tool.name;
}

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // always scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question) {
    if (!question.trim() || loading) return;

    // the last 10 messages are sent so the assistant remembers the conversation
    const history = messages
      .filter((m) => !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages([...messages, { role: "user", text: question }]);
    setText("");
    setLoading(true);

    try {
      const data = await api("/agent/chat/", {
        method: "POST",
        body: JSON.stringify({ message: question, history }),
      });
      setMessages((old) => [...old, { role: "assistant", text: data.answer, tools: data.tools_used }]);
    } catch (err) {
      setMessages((old) => [...old, { role: "assistant", text: err.message, error: true }]);
    }
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(text);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>AI Assistant</h2>
          <p>Ask questions about the patients and documents you are allowed to see.</p>
        </div>
      </div>

      <div className="card chat-card">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="big-icon"><Icon name="sparkle" size={28} /></div>
              <h3>How can I help?</h3>
              <p>I look up your patient records with secure tools and never see anything you cannot access.</p>
              <div className="examples">
                {examples.map((example) => (
                  <button key={example} className="example-chip" onClick={() => send(example)}>
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role} ${m.error ? "error" : ""}`}>
              <div className="bubble">{m.text}</div>
              {m.tools && m.tools.length > 0 && (
                <div className="tool-chips">
                  {m.tools.map((tool, j) => (
                    <span key={j} className="tool-chip"><Icon name="search" size={12} /> {toolLabel(tool)}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="msg assistant">
              <div className="bubble"><span className="typing"><span /><span /><span /></span></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <input value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Ask about a patient or a document..." maxLength={1000} />
          <button type="submit" disabled={loading || !text.trim()}>Send</button>
        </form>
      </div>
      <p className="chat-note">
        Answers are AI-generated from your records. Please verify them. This is not medical advice.
      </p>
    </div>
  );
}
