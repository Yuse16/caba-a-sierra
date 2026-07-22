import { Suspense } from "react"
import { DemoProvider } from "@/components/demo/demo-context"
import { DemoShell } from "@/components/demo/demo-shell"

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DemoProvider>
        <DemoShell />
      </DemoProvider>
    </Suspense>
  )
}
