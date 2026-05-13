import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import "./App.css";
import {
  FileText,
  Brain,
  Sparkles,
  GraduationCap,
  Upload,
  MessageSquare,
  SendHorizontal
} from "lucide-react";
function App() {
  const [files, setFiles] =
    useState([]);
  const [summary, setSummary] =
    useState("");
  const [question, setQuestion] =
  useState("");

const [messages, setMessages] =
  useState([]);
const chatEndRef = useRef(null);
  const [loading, setLoading] =
    useState(false);
  const [asking, setAsking] =
    useState(false);
  const [selectedWorkflow,
    setSelectedWorkflow] =
    useState("Document Summary");
  const [history, setHistory] =
    useState([]);
useEffect(() => {
  chatEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);
  const handleUpload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setSummary("");
    try {
      let combinedResult = "";
      for (const file of files) {
        const formData =
          new FormData();
        formData.append("file", file);
        formData.append(
          "workflow",
          selectedWorkflow
        );
        const response = await fetch(
          "https://caretaker-playmaker-obsessed.ngrok-free.dev/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Upload failed: ${response.status}`
          );
        }

        console.log("Upload response received");

        if (!response.body) {
          throw new Error("No response body received");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let streamFinished = false;

        while (!streamFinished) {

          const { done, value } =
            await reader.read();

          streamFinished = done;

          if (value) {

            const chunk = decoder.decode(value, {
              stream: true,
            });

            console.log("STREAM CHUNK:", chunk);

            combinedResult += chunk;

            setSummary(
              combinedResult
            );
          }
        }
        combinedResult += "\n\n---\n\n";
        const newHistory = {
          fileName: file.name,
          workflow:
            selectedWorkflow,
          time: new Date()
            .toLocaleTimeString(),
        };
        setHistory((prev) => [
          newHistory,
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      alert(`Upload Error: ${error.message}`);
      setSummary(
        "Error processing documents."
      );
    }
    setLoading(false);
  };
  const askQuestion = async () => {

  if (!question) return;

  setAsking(true);

  const userMessage = {
    role: "user",
    content: question,
  };

  setMessages((prev) => [
    ...prev,
    userMessage,
  ]);

  const formData = new FormData();

  formData.append(
    "question",
    question
  );

  let aiResponse = "";

  try {

    const response = await fetch(
      "https://caretaker-playmaker-obsessed.ngrok-free.dev/ask",
      {
        method: "POST",
        body: formData,
      }
    );

    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder();

    while (true) {

      const { done, value } =
        await reader.read();

      if (done) break;

      const chunk =
        decoder.decode(value);

      aiResponse += chunk;

      setMessages((prev) => {

        const updated = [...prev];

        const lastMessage =
          updated[
            updated.length - 1
          ];

        if (
          lastMessage?.role === "assistant"
        ) {

          lastMessage.content =
            aiResponse;

        } else {

          updated.push({
            role: "assistant",
            content: aiResponse,
          });
        }

        return [...updated];
      });
    }

  } catch (error) {

    console.error(error);

  }

  setQuestion("");

  setAsking(false);
};
  return (
    <div className="layout">
      <div className="sidebar">
        <h2>Forge</h2>
        <p className="sidebar-subtitle">
          Workflow History
        </p>
        <div className="history-list">
          {history.length === 0 ? (
            <p className="empty-history">
              No workflows yet.
            </p>
          ) : (
            history.map((item, index) => (
              <div
                className="history-card"
                key={index}
              >
                <h4>{item.workflow}</h4>
                <p>{item.fileName}</p>
                <span>{item.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="main-content">
        <motion.div
          className="orb"
          animate={{
            scale: loading || asking
              ? [1, 1.15, 1]
              : 1,
          }}
          transition={{
            repeat:
              loading || asking
                ? Infinity
                : 0,
            duration: 1.4,
          }}
        />
        <h1>Forge</h1>
        <p className="subtitle">
          AI Workflow Automation Platform
        </p>
        <div className="workflow-grid">
  {[
    {
      title: "Document Summary",
      icon: <FileText size={34} />,
    },
    {
      title: "Key Points",
      icon: <Sparkles size={34} />,
    },
    {
      title: "Study Notes",
      icon: <GraduationCap size={34} />,
    },
    {
      title: "Interview Questions",
      icon: <Brain size={34} />,
    },
  ].map((workflow) => (
    <div
      key={workflow.title}
      className={`workflow-card ${
        selectedWorkflow ===
        workflow.title
          ? "active-workflow"
          : ""
      }`}
      onClick={() =>
        setSelectedWorkflow(
          workflow.title
        )
      }
    >

      <div className="workflow-icon">
        {workflow.icon}
      </div>

      <h3>{workflow.title}</h3>

      <p>
        AI-powered workflow
        automation for smarter
        document processing.
      </p>

    </div>
  ))}
</div>

        <div className="upload-card">
          <div className="selected-workflow">
            Active Workflow:
            {" "}
            {selectedWorkflow}
          </div>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={(e) =>
              setFiles(
                Array.from(
                  e.target.files
                )
              )
            }
          />
          <button
            onClick={handleUpload}
            className="primary-btn"
          >
            <div className="btn-content">
              <Upload size={18} />

              {loading
                ? "Processing Documents..."
                : "Run Workflow"}
            </div>
          </button>
        </div>
        <div className="summary-box">
          <div className="summary-header">
            AI Output
          </div>
          <div className="markdown-output">
            {summary ? (
              <ReactMarkdown>
                {summary}
              </ReactMarkdown>
            ) : (
              "Upload PDFs to generate AI workflow output."
            )}
          </div>
        </div>
        <div className="summary-box">
          <div className="summary-header">
            AI Document Chat
          </div>
          <div className="chat-container">

  {messages.length === 0 && (

    <div className="empty-chat">
      Ask questions across all uploaded documents.
    </div>

  )}

  {messages.map((message, index) => (

    <div
      key={index}
      className={
        message.role === "user"
          ? "user-message"
          : "ai-message"
      }
    >

      <div className="message-label">

        {message.role === "user"
          ? "You"
          : "Forge AI"}

      </div>

      <div
        className={`message-bubble ${
          message.role === "user"
            ? "user-bubble"
            : "ai-bubble"
        }`}
      >

        <ReactMarkdown>
          {message.content}
        </ReactMarkdown>

      </div>

    </div>

  ))}

  <div ref={chatEndRef} />
</div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask anything about uploaded documents..."
              value={question}
              onChange={(e) =>
                setQuestion(
                  e.target.value
                )
              }
            />
            <button
              onClick={askQuestion}
              className="primary-btn"
            >
              <div className="btn-content">
                <SendHorizontal size={18} />

                {asking
                  ? "Thinking..."
                  : "Ask AI"}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;