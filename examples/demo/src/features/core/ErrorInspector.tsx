type MutationErrorLike = {
  name?: string;
  message?: string;
  getUserMessage?: () => string;
  isNetworkError?: () => boolean;
  isValidationError?: () => boolean;
  toJSON?: () => unknown;
};

type ErrorInspectorProps = {
  error: unknown | null;
  onClear: () => void;
};

function isMutationErrorLike(error: unknown): error is MutationErrorLike {
  return Boolean(error && typeof error === "object" && "message" in error);
}

function getMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isMutationErrorLike(error) && typeof error.message === "string") {
    return error.message;
  }

  return String(error);
}

function getUserMessage(error: unknown): string {
  if (
    isMutationErrorLike(error) &&
    typeof error.getUserMessage === "function"
  ) {
    return error.getUserMessage();
  }

  return getMessage(error);
}

function detectNetworkError(error: unknown): boolean {
  if (
    isMutationErrorLike(error) &&
    typeof error.isNetworkError === "function"
  ) {
    return error.isNetworkError();
  }

  return getMessage(error).toLowerCase().includes("network");
}

function detectValidationError(error: unknown): boolean {
  if (
    isMutationErrorLike(error) &&
    typeof error.isValidationError === "function"
  ) {
    return error.isValidationError();
  }

  const message = getMessage(error).toLowerCase();
  return message.includes("validation") || message.includes("invalid");
}

function serializeError(error: unknown): string {
  if (isMutationErrorLike(error) && typeof error.toJSON === "function") {
    return JSON.stringify(error.toJSON(), null, 2);
  }

  if (error instanceof Error) {
    return JSON.stringify(
      {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      null,
      2
    );
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function ErrorInspector({ error, onClear }: ErrorInspectorProps) {
  if (!error) {
    return (
      <section className="panel">
        <h2>MutationError Inspector</h2>
        <p className="muted">
          In-screen guide: switch failure mode to <code>validation</code> or{" "}
          <code>network</code>, then run a mutation to populate this panel.
        </p>
        <p className="muted">No captured mutation error yet.</p>
      </section>
    );
  }

  const errorName =
    isMutationErrorLike(error) && typeof error.name === "string"
      ? error.name
      : "UnknownError";

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>MutationError Inspector</h2>
        <button onClick={onClear} type="button">
          Clear
        </button>
      </div>
      <p className="muted">
        This panel accepts strict MutationError instances and
        mutation-error-like objects with equivalent shape.
      </p>

      <dl className="detailsList">
        <div>
          <dt>Name</dt>
          <dd>{errorName}</dd>
        </div>
        <div>
          <dt>Message</dt>
          <dd>{getMessage(error)}</dd>
        </div>
        <div>
          <dt>User message</dt>
          <dd>{getUserMessage(error)}</dd>
        </div>
        <div>
          <dt>Network error?</dt>
          <dd>{detectNetworkError(error) ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt>Validation error?</dt>
          <dd>{detectValidationError(error) ? "yes" : "no"}</dd>
        </div>
      </dl>

      <h3>Serialized error payload</h3>
      <pre>{serializeError(error)}</pre>
    </section>
  );
}
