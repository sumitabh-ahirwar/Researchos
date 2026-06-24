import { BrainCircuit, Github } from "lucide-react";

function Navbar() {
  return (
    <header className="nav-shell">
      <div className="brand-mark">
        <BrainCircuit size={22} aria-hidden="true" />
      </div>
      <div>
        <p className="brand-kicker">ResearchOS</p>
        <h1>AI Research Report Generator</h1>
      </div>
      <a className="nav-link" href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
        <Github size={18} aria-hidden="true" />
        API Docs
      </a>
    </header>
  );
}

export default Navbar;
