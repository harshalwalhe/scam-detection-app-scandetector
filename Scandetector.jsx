import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are SachCheck AI, an expert cybersecurity and fact-checking assistant specializing in threats targeting Indians. You analyze:

1. FAKE NEWS / MISINFORMATION — WhatsApp forwards, viral messages, political rumors, health misinformation
2. PHISHING LINKS — URLs designed to steal banking credentials, OTPs, UPI details, Aadhaar/PAN data
3. SCAM CALLS/MESSAGES — Fake KYC updates, lottery scams, courier fraud, income tax threats, fake job offers, "your number will be blocked" messages, etc.

When given content to analyze, respond with a JSON object ONLY (no markdown, no explanation outside JSON):
{
  "verdict": "SAFE" | "SUSPICIOUS" | "DANGEROUS",
  "type": "Fake News" | "Phishing Link" | "Scam Message" | "Scam Call Script" | "Legitimate" | "Unknown",
  "confidence": 0-100,
  "risk_score": 0-100,
  "summary": "2-3 sentence plain-language explanation in simple English",
  "red_flags": ["flag1", "flag2"],
  "india_context": "Why this is specifically relevant or dangerous in the Indian context",
  "action": "What the user should do right now",
  "category_tags": ["tag1", "tag2"]
}

Be specific to Indian context: mention UPI, TRAI, UIDAI, Income Tax Dept, SBI/HDFC/ICICI, WhatsApp forwards, etc. where relevant.`;

const EXAMPLES = [
  { label: "WhatsApp Forward", text: "BREAKING: Government is giving FREE 5G SIM cards to all Indians! Click here to claim yours before March 10: bit.ly/free5g-india2024. Forward to 10 friends to activate!" },
  { label: "Bank KYC Scam", text: "Dear Customer, Your SBI account will be blocked in 24 hours. Complete your KYC immediately: http://sbi-kyc-update.xyz/verify. Enter your account number, password and OTP to continue." },
  { label: "Lottery Scam", text: "Congratulations! You have won ₹25,00,000 in the KBC Lucky Draw 2024. Your number was selected from 10 crore entries. Call 9876543210 or pay ₹2500 processing fee to claim your prize." },
  { label: "Fake News", text: "URGENT: WHO has confirmed that drinking hot water with lemon every 3 hours kills coronavirus 100%. Hospitals are hiding this truth. Share with everyone before this gets deleted!" },
];

const verdictConfig = {
  SAFE: { color: "#00C896", bg: "rgba(0,200,150,0.12)", icon: "✓", label: "SAFE" },
  SUSPICIOUS: { color: "#FFB800", bg: "rgba(255,184,0,0.12)", icon: "⚠", label: "SUSPICIOUS" },
  DANGEROUS: { color: "#FF3B5C", bg: "rgba(255,59,92,0.12)", icon: "✕", label: "DANGEROUS" },
};

function RiskMeter({ score }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const color = score < 30 ? "#00C896" : score < 65 ? "#FFB800" : "#FF3B5C";
  const r = 54, cx = 64, cy = 64;
  const circumference = 2 * Math.PI * r;
  const dash = (animated / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1), stroke 0.5s" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="26" fontFamily="'Rajdhani', sans-serif" fontWeight="700">{score}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="'Rajdhani', sans-serif">RISK SCORE</text>
      </svg>
    </div>
  );
}

function ConfidenceBar({ value }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 200); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", minWidth: 80 }}>AI CONFIDENCE</span>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: "linear-gradient(90deg, #7B5EA7, #FF6B9D)", borderRadius: 3, transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
      <span style={{ color: "#fff", fontSize: 12, fontFamily: "'Rajdhani', sans-serif", minWidth: 36 }}>{value}%</span>
    </div>
  );
}

function Tag({ label }) {
  return (
    <span style={{
      background: "rgba(123,94,167,0.18)", border: "1px solid rgba(123,94,167,0.35)",
      color: "#C4A8FF", borderRadius: 4, padding: "2px 8px", fontSize: 11,
      fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em", fontWeight: 600
    }}>{label}</span>
  );
}

function ResultCard({ result }) {
  const cfg = verdictConfig[result.verdict] || verdictConfig.SUSPICIOUS;
  return (
    <div style={{
      background: "rgba(18,14,30,0.9)", border: `1px solid ${cfg.color}40`,
      borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 20,
      animation: "fadeSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      boxShadow: `0 0 40px ${cfg.color}15`
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: cfg.bg,
            border: `2px solid ${cfg.color}60`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24, color: cfg.color, fontWeight: 900
          }}>{cfg.icon}</div>
          <div>
            <div style={{ color: cfg.color, fontSize: 22, fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, letterSpacing: "0.08em" }}>{cfg.label}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "'Rajdhani', sans-serif" }}>{result.type}</div>
          </div>
        </div>
        <RiskMeter score={result.risk_score} />
      </div>

      <ConfidenceBar value={result.confidence} />

      {/* Summary */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${cfg.color}` }}>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.7, margin: 0, fontFamily: "'Sora', sans-serif" }}>{result.summary}</p>
      </div>

      {/* Red Flags */}
      {result.red_flags?.length > 0 && (
        <div>
          <div style={{ color: "#FF3B5C", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 10 }}>🚩 RED FLAGS DETECTED</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {result.red_flags.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#FF3B5C", marginTop: 2, flexShrink: 0 }}>▸</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "'Sora', sans-serif", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* India Context */}
      {result.india_context && (
        <div style={{ background: "rgba(255,136,0,0.07)", border: "1px solid rgba(255,136,0,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🇮🇳</span>
          <div>
            <div style={{ color: "#FFB060", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>INDIA CONTEXT</div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0, fontFamily: "'Sora', sans-serif", lineHeight: 1.6 }}>{result.india_context}</p>
          </div>
        </div>
      )}

      {/* Action */}
      {result.action && (
        <div style={{ background: "rgba(0,200,150,0.07)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div>
            <div style={{ color: "#00C896", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>WHAT TO DO</div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0, fontFamily: "'Sora', sans-serif", lineHeight: 1.6 }}>{result.action}</p>
          </div>
        </div>
      )}

      {/* Tags */}
      {result.category_tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {result.category_tags.map((t, i) => <Tag key={i} label={t} />)}
        </div>
      )}
    </div>
  );
}

export default function SachCheck() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("check");
  const textareaRef = useRef(null);

  const analyze = async (text) => {
    const content = text || input;
    if (!content.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Analyze this content for threats:\n\n${content}` }]
        })
      });
      const data = await res.json();
      const rawText = data.content?.map(b => b.text || "").join("") || "";
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
      setHistory(h => [{ text: content.slice(0, 60) + (content.length > 60 ? "…" : ""), verdict: parsed.verdict, time: new Date() }, ...h.slice(0, 9)]);
    } catch (e) {
      setError("Analysis failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (ex) => {
    setInput(ex.text);
    setActiveTab("check");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Sora:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #0A0712; }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes scanline { 0%{transform:translateY(-100%);} 100%{transform:translateY(100vh);} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(123,94,167,0.3);} 50%{box-shadow:0 0 40px rgba(123,94,167,0.6);} }
        .analyze-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(123,94,167,0.5) !important; }
        .analyze-btn:active { transform: translateY(0); }
        .tab:hover { background: rgba(255,255,255,0.06) !important; }
        .example-card:hover { border-color: rgba(123,94,167,0.5) !important; background: rgba(123,94,167,0.08) !important; cursor: pointer; }
        textarea:focus { outline: none; border-color: rgba(123,94,167,0.6) !important; box-shadow: 0 0 0 3px rgba(123,94,167,0.1) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(123,94,167,0.4); border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0A0712", fontFamily: "'Sora', sans-serif", color: "#fff", padding: "0 0 60px" }}>
        {/* Scanline effect */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", opacity: 0.03 }}>
          <div style={{ position: "absolute", width: "100%", height: 2, background: "linear-gradient(transparent, rgba(123,94,167,1), transparent)", animation: "scanline 8s linear infinite" }} />
        </div>

        {/* Background mesh */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 50% at 20% 20%, rgba(123,94,167,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(255,59,92,0.07) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", padding: "48px 0 32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7B5EA7, #FF3B5C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, animation: "glow 3s ease-in-out infinite" }}>🛡</div>
              <h1 style={{ margin: 0, fontFamily: "'Rajdhani', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: "0.06em", background: "linear-gradient(135deg, #C4A8FF 0%, #FF6B9D 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SACHCHECK AI</h1>
            </div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 13, letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 500 }}>REAL-TIME SCAM · PHISHING · FAKE NEWS DETECTOR FOR INDIA</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              {["🇮🇳 India-Specific", "⚡ Real-Time AI", "🔒 Privacy Safe"].map(b => (
                <span key={b} style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em" }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {[["check", "🔍 Analyze"], ["examples", "📋 Examples"], ["history", "🕐 History"]].map(([id, label]) => (
              <button key={id} className="tab" onClick={() => setActiveTab(id)} style={{
                flex: 1, padding: "10px 8px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.05em", transition: "all 0.2s",
                background: activeTab === id ? "rgba(123,94,167,0.35)" : "transparent",
                color: activeTab === id ? "#C4A8FF" : "rgba(255,255,255,0.4)"
              }}>{label}</button>
            ))}
          </div>

          {/* CHECK TAB */}
          {activeTab === "check" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  {["Fake News", "Phishing Link", "Scam Message", "Scam Call"].map(t => (
                    <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(123,94,167,0.12)", border: "1px solid rgba(123,94,167,0.25)", color: "rgba(196,168,255,0.7)", fontFamily: "'Rajdhani', sans-serif" }}>{t}</span>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Paste a WhatsApp message, suspicious URL, SMS, email, or describe a scam call you received..."
                  style={{
                    width: "100%", minHeight: 140, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: 14, color: "#fff", fontSize: 14, lineHeight: 1.7, resize: "vertical",
                    fontFamily: "'Sora', sans-serif", transition: "all 0.2s"
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'Rajdhani', sans-serif" }}>{input.length} characters · Hindi/English supported</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {input && <button onClick={() => { setInput(""); setResult(null); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'Rajdhani', sans-serif" }}>Clear</button>}
                    <button className="analyze-btn" onClick={() => analyze()} disabled={loading || !input.trim()} style={{
                      background: "linear-gradient(135deg, #7B5EA7, #FF3B5C)", border: "none", color: "#fff",
                      borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.06em", transition: "all 0.2s",
                      opacity: loading || !input.trim() ? 0.5 : 1
                    }}>{loading ? "ANALYZING..." : "ANALYZE →"}</button>
                  </div>
                </div>
              </div>

              {loading && (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 13, color: "rgba(196,168,255,0.7)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", animation: "pulse 1.5s ease-in-out infinite" }}>
                    🤖 AI ANALYZING FOR INDIAN SCAM PATTERNS...
                  </div>
                  <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 6 }}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#7B5EA7", animation: `pulse 1s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ background: "rgba(255,59,92,0.1)", border: "1px solid rgba(255,59,92,0.3)", borderRadius: 12, padding: 16, color: "#FF6B8A", textAlign: "center", fontSize: 14 }}>
                  {error}
                </div>
              )}

              {result && <ResultCard result={result} />}
            </div>
          )}

          {/* EXAMPLES TAB */}
          {activeTab === "examples" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 8px", fontFamily: "'Rajdhani', sans-serif" }}>CLICK AN EXAMPLE TO ANALYZE IT →</p>
              {EXAMPLES.map((ex, i) => (
                <div key={i} className="example-card" onClick={() => handleExample(ex)} style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: 16, transition: "all 0.2s"
                }}>
                  <div style={{ color: "#C4A8FF", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>{ex.label}</div>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0, lineHeight: 1.6, fontFamily: "'Sora', sans-serif" }}>{ex.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.25)", fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>
                  No analyses yet. Start by checking a suspicious message.
                </div>
              ) : history.map((h, i) => {
                const cfg = verdictConfig[h.verdict] || verdictConfig.SUSPICIOUS;
                return (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: cfg.color, fontSize: 16, width: 20 }}>{cfg.icon}</span>
                    <span style={{ flex: 1, color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "'Sora', sans-serif" }}>{h.text}</span>
                    <span style={{ color: cfg.color, fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{h.verdict}</span>
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>{h.time.toLocaleTimeString()}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 48, textAlign: "center", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em", lineHeight: 1.8 }}>
              Report cyber crimes at <span style={{ color: "rgba(196,168,255,0.5)" }}>cybercrime.gov.in</span> · Helpline: <span style={{ color: "rgba(196,168,255,0.5)" }}>1930</span><br />
              SachCheck AI is a decision-support tool. Always verify with official sources.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}