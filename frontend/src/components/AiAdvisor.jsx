import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { AI_SERVICE_URL } from "../constants";

const SUGGESTIONS = [
  "What jobs suit someone with Python and React skills?",
  "How do I prepare for a system design interview?",
  "Tips for negotiating a higher salary?",
  "How should I write a cover letter?",
];

export default function AiAdvisor() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your career advisor. Ask me anything about job applications, interviews, or career growth." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const sendMessage = async (question) => {
    const text = question ?? input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch(`${AI_SERVICE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "AI service unavailable.");
      }
      const { answer } = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      const msg = err?.message?.includes("429") || err?.message?.includes("quota")
        ? "I'm getting too many requests right now. Please wait a moment and try again."
        : "Sorry, I couldn't reach the AI service. Please try again in a moment.";
      setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <div className="ai-advisor">
      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ai-message-${msg.role}`}>
            <div className="ai-bubble">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai-message-assistant">
            <div className="ai-bubble ai-bubble-loading">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="ai-suggestion-chip" type="button" onClick={() => sendMessage(s)}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="ai-input-row"
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
      >
        <input
          className="field-input ai-input"
          type="text"
          placeholder="Ask anything about your career…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="primary-button ai-send" type="submit" disabled={loading || !input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
