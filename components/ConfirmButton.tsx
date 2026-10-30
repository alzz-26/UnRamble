"use client";

import { useState } from "react";

// A delete button that asks inside the page. Browser confirm() popups are
// suppressed in embedded browsers, which made deletes silently do nothing.
export default function ConfirmButton({
  label = "Delete",
  question = "Delete?",
  className = "btn-ghost btn-danger",
  onConfirm,
}: {
  label?: string;
  question?: string;
  className?: string;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  return (
    <span className="confirm-inline" role="group" aria-label={question}>
      <span className="small">{question}</span>
      <button
        type="button"
        className="btn-danger-solid"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Yes, delete
      </button>
      <button type="button" className="link-btn" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  );
}
