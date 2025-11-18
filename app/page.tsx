"use client";

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";

const makeId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

type TalkingPoint = {
  id: string;
  content: string;
  emphasis: "high" | "medium" | "low";
  delivered: boolean;
};

type CallPlan = {
  phoneNumber: string;
  purpose: string;
  openingDisclosure: string;
  talkingPoints: TalkingPoint[];
  clarifications: string[];
  handoffConditions: string[];
  additionalNotes: string;
};

type CallMessage = {
  id: string;
  sender: "NovaCall" | "Caller";
  content: string;
  timestamp: number;
};

const defaultPlan: CallPlan = {
  phoneNumber: "+1 (415) 555-0198",
  purpose: "Follow up on AI/ML job application status",
  openingDisclosure:
    "Hi, this is NovaCall supporting Manohar Kumar Sah. I'm calling regarding your recent AI/ML application with Manohar.",
  talkingPoints: [
    {
      id: makeId(),
      content:
        "Ask if they received Manohar's follow-up email summarizing the AI/ML role responsibilities.",
      emphasis: "high",
      delivered: false
    },
    {
      id: makeId(),
      content:
        "Confirm availability for a 20-minute technical alignment call later this week.",
      emphasis: "medium",
      delivered: false
    },
    {
      id: makeId(),
      content:
        "Offer to share additional project highlights if they need more context before meeting.",
      emphasis: "low",
      delivered: false
    }
  ],
  clarifications: [
    "I'm helping Manohar with scheduling so he can follow up promptly—could you clarify your question?",
    "I'm here to keep this brief for you. Could you share what specifically you'd like from Manohar?"
  ],
  handoffConditions: [
    "Caller requests to speak with Manohar directly.",
    "Caller is silent for more than 5 seconds after a follow-up.",
    "Caller asks for details beyond the provided briefing or legal commitments."
  ],
  additionalNotes:
    "Inform the caller if recording or summarizing and capture explicit approval before logging."
};

const emphasisBadge: Record<TalkingPoint["emphasis"], string> = {
  high: "text-red-700 bg-red-50 border-red-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  low: "text-emerald-700 bg-emerald-50 border-emerald-200"
};

export default function HomePage() {
  const [draftPlan, setDraftPlan] = useState<CallPlan>(defaultPlan);
  const [activePlan, setActivePlan] = useState<CallPlan>(defaultPlan);
  const [callStatus, setCallStatus] = useState<"idle" | "live" | "handoff">(
    "idle"
  );
  const [consentToSummarize, setConsentToSummarize] = useState(false);
  const [summaryNotes, setSummaryNotes] = useState("");
  const [callLog, setCallLog] = useState<CallMessage[]>([]);
  const [callerEntry, setCallerEntry] = useState("");
  const [clarificationsUsed, setClarificationsUsed] = useState(0);
  const [recordingDisclosureMade, setRecordingDisclosureMade] = useState(false);
  const [handoffReason, setHandoffReason] = useState<string | null>(null);

  const nextTalkingPoint = useMemo(
    () => activePlan.talkingPoints.find((point) => !point.delivered),
    [activePlan.talkingPoints]
  );

  const canUseClarification =
    clarificationsUsed < activePlan.clarifications.length;

  const sortedLog = useMemo(
    () =>
      [...callLog].sort((a, b) => {
        return a.timestamp - b.timestamp;
      }),
    [callLog]
  );

  const handlePlanFieldChange = <K extends keyof CallPlan>(
    key: K,
    value: CallPlan[K]
  ) => {
    setDraftPlan((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTalkingPointChange = (
    index: number,
    value: Partial<TalkingPoint>
  ) => {
    setDraftPlan((prev) => ({
      ...prev,
      talkingPoints: prev.talkingPoints.map((point, idx) =>
        idx === index ? { ...point, ...value } : point
      )
    }));
  };

  const addTalkingPoint = () => {
    setDraftPlan((prev) => ({
      ...prev,
      talkingPoints: [
        ...prev.talkingPoints,
        {
          id: makeId(),
          content: "",
          emphasis: "low",
          delivered: false
        }
      ]
    }));
  };

  const removeTalkingPoint = (id: string) => {
    setDraftPlan((prev) => ({
      ...prev,
      talkingPoints: prev.talkingPoints.filter((point) => point.id !== id)
    }));
  };

  const handleHandoffConditionChange = (index: number, value: string) => {
    setDraftPlan((prev) => ({
      ...prev,
      handoffConditions: prev.handoffConditions.map((condition, idx) =>
        idx === index ? value : condition
      )
    }));
  };

  const addHandoffCondition = () => {
    setDraftPlan((prev) => ({
      ...prev,
      handoffConditions: [...prev.handoffConditions, ""]
    }));
  };

  const removeHandoffCondition = (index: number) => {
    setDraftPlan((prev) => ({
      ...prev,
      handoffConditions: prev.handoffConditions.filter((_, idx) => idx !== index)
    }));
  };

  const loadDraftToActive = () => {
    setActivePlan({
      ...draftPlan,
      talkingPoints: draftPlan.talkingPoints.map((point) => ({
        ...point,
        delivered: false
      }))
    });
    setCallStatus("idle");
    setCallLog([]);
    setCallerEntry("");
    setClarificationsUsed(0);
    setConsentToSummarize(false);
    setSummaryNotes("");
    setRecordingDisclosureMade(false);
    setHandoffReason(null);
  };

  const toggleTalkingPointDelivered = (id: string) => {
    setActivePlan((prev) => ({
      ...prev,
      talkingPoints: prev.talkingPoints.map((point) =>
        point.id === id ? { ...point, delivered: !point.delivered } : point
      )
    }));
  };

  const pushLogEntry = (entry: Omit<CallMessage, "id" | "timestamp">) => {
    setCallLog((prev) => [
      ...prev,
      {
        id: makeId(),
        timestamp: Date.now(),
        ...entry
      }
    ]);
  };

  const startCall = () => {
    setCallStatus("live");
    pushLogEntry({
      sender: "NovaCall",
      content: activePlan.openingDisclosure
    });
  };

  const respondWithNextPoint = () => {
    const point = nextTalkingPoint;
    if (!point) return;
    toggleTalkingPointDelivered(point.id);
    pushLogEntry({
      sender: "NovaCall",
      content: point.content
    });
  };

  const addCallerEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!callerEntry.trim()) return;
    pushLogEntry({
      sender: "Caller",
      content: callerEntry.trim()
    });
    setCallerEntry("");
  };

  const useClarification = () => {
    if (!canUseClarification) return;
    const clarification =
      activePlan.clarifications[clarificationsUsed] ??
      "I'm assisting Manohar today—could you share a little more?";
    pushLogEntry({
      sender: "NovaCall",
      content: clarification
    });
    setClarificationsUsed((prev) => prev + 1);
  };

  const executeHandoff = (condition: string) => {
    setCallStatus("handoff");
    setHandoffReason(condition);
    pushLogEntry({
      sender: "NovaCall",
      content: "Let me connect you directly with Manohar."
    });
  };

  const completedTalkingPoints =
    activePlan.talkingPoints.filter((point) => point.delivered).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary-700">
              NovaCall Operations Console
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Outbound Call Preparation & Live Assist
            </h1>
          </div>
          <button
            onClick={loadDraftToActive}
            className="rounded-full border border-primary-400 bg-primary-500 px-5 py-2 text-sm font-medium text-white shadow hover:bg-primary-600 transition"
          >
            Load Call Plan
          </button>
        </div>
        <p className="max-w-3xl text-sm text-slate-600">
          Configure the call briefing, then switch to the live console to
          execute the outreach on behalf of Manohar Kumar Sah. Stay transparent,
          follow the approved talking points, and escalate immediately when the
          conversation requires Manohar&apos;s judgment.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <CallPlanEditor
          plan={draftPlan}
          onFieldChange={handlePlanFieldChange}
          onTalkingPointChange={handleTalkingPointChange}
          onAddTalkingPoint={addTalkingPoint}
          onRemoveTalkingPoint={removeTalkingPoint}
          onHandoffChange={handleHandoffConditionChange}
          onAddHandoff={addHandoffCondition}
          onRemoveHandoff={removeHandoffCondition}
        />

        <CallConsole
          plan={activePlan}
          callStatus={callStatus}
          onStartCall={startCall}
          onTalkingPointToggle={toggleTalkingPointDelivered}
          onRespondWithNext={respondWithNextPoint}
          nextTalkingPoint={nextTalkingPoint}
          callLog={sortedLog}
          onClarification={useClarification}
          clarificationsUsed={clarificationsUsed}
          canUseClarification={canUseClarification}
          callerEntry={callerEntry}
          onCallerEntryChange={setCallerEntry}
          onCallerSubmit={addCallerEntry}
          onExecuteHandoff={executeHandoff}
          onRecordingDisclosureChange={setRecordingDisclosureMade}
          recordingDisclosureMade={recordingDisclosureMade}
          consentToSummarize={consentToSummarize}
          onConsentChange={setConsentToSummarize}
          summaryNotes={summaryNotes}
          onSummaryChange={setSummaryNotes}
          handoffReason={handoffReason}
          completedTalkingPoints={completedTalkingPoints}
        />
      </section>
    </main>
  );
}

type CallPlanEditorProps = {
  plan: CallPlan;
  onFieldChange: <K extends keyof CallPlan>(key: K, value: CallPlan[K]) => void;
  onTalkingPointChange: (index: number, value: Partial<TalkingPoint>) => void;
  onAddTalkingPoint: () => void;
  onRemoveTalkingPoint: (id: string) => void;
  onHandoffChange: (index: number, value: string) => void;
  onAddHandoff: () => void;
  onRemoveHandoff: (index: number) => void;
};

function CallPlanEditor({
  plan,
  onFieldChange,
  onTalkingPointChange,
  onAddTalkingPoint,
  onRemoveTalkingPoint,
  onHandoffChange,
  onAddHandoff,
  onRemoveHandoff
}: CallPlanEditorProps) {
  return (
    <div className="flex h-fit flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl text-slate-900">Call Briefing</h2>
        <p className="text-sm text-slate-500">
          Define the approved context and script before the dialer connects.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          Phone number
        </label>
        <input
          value={plan.phoneNumber}
          onChange={(event) => onFieldChange("phoneNumber", event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="+1 ..."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Purpose</label>
        <input
          value={plan.purpose}
          onChange={(event) => onFieldChange("purpose", event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="Follow up on ..."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          Opening disclosure
        </label>
        <textarea
          value={plan.openingDisclosure}
          onChange={(event) =>
            onFieldChange("openingDisclosure", event.target.value)
          }
          rows={3}
          className="resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </fieldset>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Talking points
          </label>
          <button
            onClick={onAddTalkingPoint}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            + Add point
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {plan.talkingPoints.map((point, index) => (
            <div
              key={point.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <div className="flex flex-col gap-2">
                <textarea
                  value={point.content}
                  onChange={(event) =>
                    onTalkingPointChange(index, {
                      content: event.target.value
                    })
                  }
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="State the key message for this point."
                />

                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    Emphasis
                    <select
                      value={point.emphasis}
                      onChange={(event) =>
                        onTalkingPointChange(index, {
                          emphasis: event.target.value as TalkingPoint["emphasis"]
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </label>

                  <button
                    onClick={() => onRemoveTalkingPoint(point.id)}
                    className="text-xs font-medium text-slate-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Handoff conditions
          </label>
          <button
            onClick={onAddHandoff}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            + Add condition
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {plan.handoffConditions.map((condition, index) => (
            <div
              key={`${condition}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <textarea
                value={condition}
                onChange={(event) =>
                  onHandoffChange(index, event.target.value)
                }
                rows={2}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Describe the condition that requires escalation."
              />
              <button
                onClick={() => onRemoveHandoff(index)}
                className="text-xs font-medium text-slate-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          Additional guardrails
        </label>
        <textarea
          value={plan.additionalNotes}
          onChange={(event) =>
            onFieldChange("additionalNotes", event.target.value)
          }
          rows={4}
          className="resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="Document any compliance, transparency, or disclosure requirements."
        />
      </fieldset>
    </div>
  );
}

type CallConsoleProps = {
  plan: CallPlan;
  callStatus: "idle" | "live" | "handoff";
  onStartCall: () => void;
  onTalkingPointToggle: (id: string) => void;
  onRespondWithNext: () => void;
  nextTalkingPoint?: TalkingPoint;
  callLog: CallMessage[];
  onClarification: () => void;
  clarificationsUsed: number;
  canUseClarification: boolean;
  callerEntry: string;
  onCallerEntryChange: (value: string) => void;
  onCallerSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onExecuteHandoff: (condition: string) => void;
  recordingDisclosureMade: boolean;
  onRecordingDisclosureChange: (value: boolean) => void;
  consentToSummarize: boolean;
  onConsentChange: (value: boolean) => void;
  summaryNotes: string;
  onSummaryChange: (value: string) => void;
  handoffReason: string | null;
  completedTalkingPoints: number;
};

function CallConsole({
  plan,
  callStatus,
  onStartCall,
  onTalkingPointToggle,
  onRespondWithNext,
  nextTalkingPoint,
  callLog,
  onClarification,
  clarificationsUsed,
  canUseClarification,
  callerEntry,
  onCallerEntryChange,
  onCallerSubmit,
  onExecuteHandoff,
  recordingDisclosureMade,
  onRecordingDisclosureChange,
  consentToSummarize,
  onConsentChange,
  summaryNotes,
  onSummaryChange,
  handoffReason,
  completedTalkingPoints
}: CallConsoleProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl text-slate-900">Live Call Console</h2>
            <p className="text-sm text-slate-500">
              Signal consent, stay on-script, and escalate when human judgment is
              needed.
            </p>
          </div>

          <span
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold shadow-sm",
              callStatus === "live"
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : callStatus === "handoff"
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
            )}
          >
            <span
              className={clsx(
                "size-2 rounded-full",
                callStatus === "live"
                  ? "bg-emerald-500"
                  : callStatus === "handoff"
                    ? "bg-amber-500"
                    : "bg-slate-400"
              )}
            />
            {callStatus === "live"
              ? "Live call"
              : callStatus === "handoff"
                ? "Transferring to Manohar"
                : "Idle"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Call purpose
            </h3>
            <p className="mt-2 text-sm text-slate-700">{plan.purpose}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone number
            </h3>
            <p className="mt-2 text-sm text-slate-700">{plan.phoneNumber}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Talking points delivered
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              {completedTalkingPoints}/{plan.talkingPoints.length}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={onStartCall}
            disabled={callStatus !== "idle"}
            className={clsx(
              "rounded-full px-5 py-2 text-sm font-medium transition",
              callStatus === "idle"
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            Start call with scripted intro
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <input
              id="recordingConsent"
              type="checkbox"
              checked={recordingDisclosureMade}
              onChange={(event) =>
                onRecordingDisclosureChange(event.target.checked)
              }
              className="size-4 rounded border-slate-300 text-primary-500"
            />
            <label htmlFor="recordingConsent" className="cursor-pointer">
              I already informed the caller about recording/logging.
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg text-slate-900">Opening disclosure</h3>
            <p className="mt-2 text-sm text-slate-600">
              Deliver this introduction as soon as the call connects.
            </p>
            <p className="mt-4 rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-900">
              {plan.openingDisclosure}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-slate-900">Talking points tracker</h3>
              {nextTalkingPoint ? (
                <button
                  onClick={onRespondWithNext}
                  className="rounded-full bg-primary-500 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary-600"
                >
                  Respond with next point
                </button>
              ) : (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  All points delivered
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Speak naturally, but stay true to the scripted content. Mark each
              point as soon as the message is delivered.
            </p>

            <ul className="mt-4 flex flex-col gap-3">
              {plan.talkingPoints.map((point) => (
                <li
                  key={point.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <input
                    type="checkbox"
                    checked={point.delivered}
                    onChange={() => onTalkingPointToggle(point.id)}
                    className="mt-1 size-4 rounded border-slate-300 text-primary-500"
                  />
                  <div className="flex flex-1 flex-col gap-2">
                    <span className="text-sm text-slate-700">
                      {point.content || "Pending content"}
                    </span>
                    <span
                      className={clsx(
                        "inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                        emphasisBadge[point.emphasis]
                      )}
                    >
                      {point.emphasis} priority
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-slate-900">
                Clarifications (max twice)
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {clarificationsUsed}/{plan.clarifications.length} used
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Use only when the caller moves outside the prepared context.
            </p>

            <button
              onClick={onClarification}
              disabled={!canUseClarification}
              className={clsx(
                "mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold transition",
                canUseClarification
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              Send clarification prompt
            </button>

            <ul className="mt-4 flex flex-col gap-3">
              {plan.clarifications.map((clarification, index) => (
                <li
                  key={`${clarification}-${index}`}
                  className={clsx(
                    "rounded-2xl border px-4 py-3 text-sm",
                    index < clarificationsUsed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  )}
                >
                  {clarification}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg text-slate-900">Escalation guardrails</h3>
            <p className="mt-2 text-sm text-slate-600">
              Transfer to Manohar immediately if any of these conditions are
              triggered.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {plan.handoffConditions.map((condition, index) => (
                <li
                  key={`${condition}-${index}`}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <button
                    onClick={() => onExecuteHandoff(condition)}
                    className="mt-1 rounded-lg border border-amber-400 bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 hover:bg-amber-200"
                  >
                    Handoff
                  </button>
                  <span className="text-sm text-slate-700">{condition}</span>
                </li>
              ))}
            </ul>

            {handoffReason && (
              <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                Escalation reason logged: {handoffReason}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg text-slate-900">Live transcript log</h3>
            <p className="mt-2 text-sm text-slate-600">
              Capture live notes. Auto-sorted from oldest to newest.
            </p>
            <div className="mt-4 max-h-[320px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              {callLog.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Call log will appear here once the conversation starts.
                </p>
              ) : (
                <ul className="flex flex-col gap-3 text-sm">
                  {callLog.map((entry) => (
                    <li
                      key={entry.id}
                      className={clsx(
                        "flex flex-col gap-1 rounded-2xl border px-3 py-2",
                        entry.sender === "NovaCall"
                          ? "border-primary-200 bg-primary-50 text-primary-900"
                          : "border-slate-200 bg-white text-slate-700"
                      )}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {entry.sender} &middot;{" "}
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span>{entry.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={onCallerSubmit} className="mt-4 flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Caller says
              </label>
              <textarea
                value={callerEntry}
                onChange={(event) => onCallerEntryChange(event.target.value)}
                rows={3}
                className="resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Summarize the caller's response here..."
              />
              <button
                type="submit"
                className="self-end rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Log caller response
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-slate-900">Post-call summary</h3>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <input
                  type="checkbox"
                  checked={consentToSummarize}
                  onChange={(event) => onConsentChange(event.target.checked)}
                  className="size-4 rounded border-slate-300 text-primary-500"
                />
                Caller approved summary
              </label>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Only summarize once the caller explicitly consents. Highlight any
              follow-ups for Manohar.
            </p>
            <textarea
              value={summaryNotes}
              onChange={(event) => onSummaryChange(event.target.value)}
              rows={5}
              disabled={!consentToSummarize}
              className={clsx(
                "mt-4 w-full resize-none rounded-2xl border px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-2",
                consentToSummarize
                  ? "border-slate-200 focus:border-primary-400 focus:ring-primary-200"
                  : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
              placeholder={
                consentToSummarize
                  ? "Summarize key decisions, next steps, and commitments."
                  : "Consent required before logging a summary."
              }
            />

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              Transparency reminder: If you plan to send this summary to
              Manohar, let the caller know during the conversation so they are
              aware their responses will be shared.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-slate-200 shadow-sm">
            <h3 className="text-lg text-white">Operational reminders</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                • Never fabricate details—refer back to Manohar for anything
                uncertain.
              </li>
              <li>
                • State the call purpose immediately and stay courteous
                throughout.
              </li>
              <li>
                • Disclose any recording or summarization before proceeding.
              </li>
              <li>
                • Escalate swiftly if the caller asks for sensitive or new info.
              </li>
              <li>
                • Note any commitments requiring Manohar&apos;s follow-up.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
