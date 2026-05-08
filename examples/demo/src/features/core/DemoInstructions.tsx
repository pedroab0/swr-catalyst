export function DemoInstructions() {
  return (
    <section className="panel note">
      <h2>How to use this demo</h2>
      <ol>
        <li>Apply a scenario preset that matches what you want to verify.</li>
        <li>Run create/update/delete in Hooks Demo and watch optimistic UI.</li>
        <li>
          Use <code>Validation errors</code> for failure handling or set failure
          mode to <code>network</code> manually.
        </li>
        <li>
          Run Utilities actions and inspect Cache Viewer + Cache Diff Viewer.
        </li>
        <li>
          Replay timeline entries to confirm reproducibility of operations.
        </li>
      </ol>
    </section>
  );
}
