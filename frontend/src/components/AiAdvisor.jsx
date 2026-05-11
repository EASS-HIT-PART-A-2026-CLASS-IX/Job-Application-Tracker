import { useRef, useState } from "react";
import { ArrowUp, Briefcase, MessageCircle, Sparkles, TrendingUp, FileText } from "lucide-react";
import { AI_SERVICE_URL } from "../constants";

const SUGGESTIONS = [
  { icon: <Briefcase size={16} />, text: "What jobs suit someone with Python and React skills?" },
  { icon: <MessageCircle size={16} />, text: "How do I prepare for a system design interview?" },
  { icon: <TrendingUp size={16} />, text: "Tips for negotiating a higher salary?" },
  { icon: <FileText size={16} />, text: "How should I write a cover letter?" },
];

function TypingDots() {
  return (
    <div className="ai-typing-dots">
      <span /><span /><span />
    </div>
  );
}

export default function AiAdvisor() {
  const [messages, setMessages] = useState([]);
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
        ? "I'm getting too many requests right now — please wait a moment and try again."
        : "I couldn't reach the AI service right now. Please try again in a moment.";
      setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const showEmptyState = messages.length === 0 && !loading;

  return (
    <div className="ai-advisor-v2">
      <div className="ai-chat-area">
        {showEmptyState ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon">
              <Sparkles size={28} />
            </div>
            <h3>Your AI Career Advisor</h3>
            <p>Ask me anything about interviews, resumes, job search strategies, or salary negotiation.</p>
            <div className="ai-suggestion-grid">
              {SUGGESTIONS.map((s) => (
                <button key={s.text} className="ai-suggestion-card" type="button" onClick={() => sendMessage(s.text)}>
                  <span className="ai-suggestion-card-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-messages-v2">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ai-msg-${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="ai-avatar-sm">
                    <Sparkles size={13} />
                  </div>
                )}
                <div className="ai-bubble-v2">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-avatar-sm"><Sparkles size={13} /></div>
                <div className="ai-bubble-v2"><TypingDots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form className="ai-input-bar" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
        <input
          className="ai-input-v2"
          type="text"
          placeholder="Ask anything about your career…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="ai-send-btn" type="submit" disabled={loading || !input.trim()}>
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  );
}
