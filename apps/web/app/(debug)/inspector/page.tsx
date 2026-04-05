'use client';

import { GoalInspector } from '@/components/debug/GoalInspector';
import { RelationshipHeatmap } from '@/components/debug/RelationshipHeatmap';
import { AILogViewer } from '@/components/debug/AILogViewer';
import { EventReplay } from '@/components/debug/EventReplay';
import { AdminPanel } from '@/components/ui/AdminPanel';
import { SaveLoadPanel } from '@/components/ui/SaveLoadPanel';

export default function InspectorPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4">
      <h1 className="text-xl font-bold mb-4">
        <span className="text-[var(--color-accent)]">AI</span> Crossing — Inspector
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--color-bg-panel)] rounded-lg border border-[var(--color-border)]">
          <GoalInspector />
        </div>
        <div className="bg-[var(--color-bg-panel)] rounded-lg border border-[var(--color-border)]">
          <RelationshipHeatmap />
        </div>
        <div className="bg-[var(--color-bg-panel)] rounded-lg border border-[var(--color-border)]">
          <AdminPanel />
        </div>
        <div className="bg-[var(--color-bg-panel)] rounded-lg border border-[var(--color-border)]">
          <SaveLoadPanel />
        </div>
        <div className="bg-[var(--color-bg-panel)] rounded-lg border border-[var(--color-border)] lg:col-span-2">
          <EventReplay />
        </div>
        <div className="bg-[var(--color-bg-panel)] rounded-lg border border-[var(--color-border)] lg:col-span-3">
          <AILogViewer />
        </div>
      </div>
    </div>
  );
}
