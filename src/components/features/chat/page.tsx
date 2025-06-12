/**
 * This file was moved to /demo route for development-only access.
 * 
 * The artifacts demo is now available at /demo in development environments only.
 * This ensures the demo is not included in production builds while still being
 * available for testing and development purposes.
 */

export default function ChatPage() {
  return (
    <div className="flex items-center justify-center h-screen text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-muted-foreground">
          Artifacts Demo Moved
        </h1>
        <p className="text-muted-foreground">
          The artifacts demo is now available at{" "}
          <a href="/demo" className="text-primary hover:underline">
            /demo
          </a>{" "}
          (development only)
        </p>
      </div>
    </div>
  )
}
