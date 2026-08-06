import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database, LogOut, Monitor, Moon, Palette, Sun, Trash2, User } from "lucide-react";

import Button from "../components/ui/Button.jsx";
import Card, { CardBody, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.jsx";
import Modal from "../components/ui/Modal.jsx";
import { Alert, Avatar } from "../components/ui/Feedback.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useTheme } from "../hooks/useTheme.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { formatBytes } from "../utils/format.js";

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

/**
 * Settings.
 *
 * Only exposes controls that do something in this build — appearance, the
 * local display profile, and stored data. Toggles for features with no
 * backing implementation would be worse than their absence.
 */
export default function Settings() {
  const { preference, setPreference } = useTheme();
  const { profile, library, clearNotifications } = useWorkspace();
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const storageBytes = new Blob([JSON.stringify(library.reports)]).size;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleClearData = () => {
    library.clearAll();
    clearNotifications();
    setConfirmOpen(false);
    toast.info("Local data cleared");
  };

  return (
    <div className="settings-layout">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-header__title">Settings</h2>
          <p className="page-header__subtitle">
            Appearance, display profile, and the data ResearchOS keeps in this browser.
          </p>
        </div>
      </div>

      {/* Appearance -------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="row" style={{ gap: "var(--space-3)" }}>
            <span className="icon-tile icon-tile--md" aria-hidden="true">
              <Palette size={19} />
            </span>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>How ResearchOS looks on this device.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="setting-row">
            <div>
              <p className="setting-row__label">Theme</p>
              <p className="setting-row__desc">
                System follows your operating system setting and switches live when it changes.
              </p>
            </div>
            <div className="setting-row__control">
              <div className="theme-choice" role="group" aria-label="Theme">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="theme-choice__option"
                    aria-pressed={preference === option.id}
                    onClick={() => setPreference(option.id)}
                  >
                    <option.icon size={17} aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Account ----------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="row" style={{ gap: "var(--space-3)" }}>
            <span className="icon-tile icon-tile--md" aria-hidden="true">
              <User size={19} />
            </span>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Your ResearchOS account, stored in MongoDB.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="row" style={{ gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
            <Avatar name={profile.name} size="lg" />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "var(--text-md)", fontWeight: 650 }}>{profile.name}</p>
              <p
                className="truncate"
                style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
              >
                {profile.email}
              </p>
            </div>
          </div>

          {/* Editing name/email and changing a password need PATCH endpoints
              that do not exist yet — showing disabled inputs would imply
              otherwise, so the values are presented as plain read-only rows. */}
          <div className="setting-row">
            <div>
              <p className="setting-row__label">Profile details</p>
              <p className="setting-row__desc">
                Changing your name, email, or password is not available yet — those endpoints
                have not been built.
              </p>
            </div>
          </div>

          <div className="setting-row">
            <div>
              <p className="setting-row__label">Session</p>
              <p className="setting-row__desc">
                Signing out clears the httpOnly session cookie on this device.
              </p>
            </div>
            <div className="setting-row__control">
              <Button variant="secondary" leadingIcon={LogOut} onClick={handleLogout} block>
                Sign out
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Data -------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="row" style={{ gap: "var(--space-3)" }}>
            <span className="icon-tile icon-tile--md" aria-hidden="true">
              <Database size={19} />
            </span>
            <div>
              <CardTitle>Stored data</CardTitle>
              <CardDescription>What ResearchOS keeps in this browser.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <Alert variant="info" title="Local storage only">
            Reports, history, and preferences live in this browser&apos;s local storage. They do not
            sync between devices, and clearing site data removes them. Uploaded PDFs are stored
            separately on the server running the backend.
          </Alert>

          <div className="setting-row" style={{ marginTop: "var(--space-5)" }}>
            <div>
              <p className="setting-row__label">Report library</p>
              <p className="setting-row__desc">
                {library.reports.length} report{library.reports.length === 1 ? "" : "s"} ·{" "}
                {formatBytes(storageBytes)} used
              </p>
            </div>
            <div className="setting-row__control">
              <Button
                variant="danger-ghost"
                leadingIcon={Trash2}
                onClick={() => setConfirmOpen(true)}
                disabled={library.reports.length === 0}
              >
                Clear local data
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear local data?"
        description="Removes all reports, history, and notifications from this browser. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" leadingIcon={Trash2} onClick={handleClearData}>
              Clear data
            </Button>
          </>
        }
      >
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          Download any report you want to keep first. Documents already uploaded to the backend are
          not affected.
        </p>
      </Modal>
    </div>
  );
}
