export function ConversationPanel() {
  return (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Conversation</h2>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">
          AI conversation will appear here
        </p>
      </div>
    </div>
  );
}
