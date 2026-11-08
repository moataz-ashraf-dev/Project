import { createPortal } from 'react-dom';
import type { LanguageCode } from '@/lib/i18n';
import type { StudyPlanTask } from '@/lib/planner';
import { taskDialogI18n } from '@/lib/taskDialogI18n';

type TaskDialogCopy = (typeof taskDialogI18n)[LanguageCode];
type Props = {
  language: LanguageCode;
  copy: TaskDialogCopy;
  deleteTask: StudyPlanTask | null;
  switchTask: StudyPlanTask | null;
  runningTitle: string;
  onDismissDelete: () => void;
  onConfirmDelete: (task: StudyPlanTask) => void | Promise<void>;
  onDismissSwitch: () => void;
  onConfirmSwitch: (task: StudyPlanTask) => void | Promise<void>;
};

export default function StudyTaskDialogs({ language, copy, deleteTask, switchTask, runningTitle, onDismissDelete, onConfirmDelete, onDismissSwitch, onConfirmSwitch }: Props) {
  if (typeof document === 'undefined') return null;
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  return (
    <>
      {deleteTask && createPortal(
        <div dir={direction} className="sq-task-dialog-v2__backdrop fixed inset-0 z-[90] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4">
          <section className="sq-task-dialog-v2 sq-task-dialog-v2--delete" role="dialog" aria-modal="true" aria-labelledby="delete-task-title">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-300/20 bg-red-400/10 text-2xl" aria-hidden="true">🗑️</div>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-300">{copy.deleteEyebrow}</p>
                <h2 id="delete-task-title" className="text-lg font-black text-white">{copy.deleteTitle}</h2>
                <p className="mt-2 text-sm text-gray-400">{copy.deleteBody}</p>
                <p className="mt-2 truncate text-sm font-bold text-cyan-300">{deleteTask.title}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={onDismissDelete} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white/10">{copy.cancel}</button>
              <button type="button" onClick={() => void onConfirmDelete(deleteTask)} className="rounded-xl px-4 py-2.5 text-sm font-black transition">{copy.deleteConfirm}</button>
            </div>
          </section>
        </div>, document.body,
      )}
      {switchTask && createPortal(
        <div dir={direction} className="sq-task-dialog-v2__backdrop fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <section className="sq-task-dialog-v2 sq-task-dialog-v2--switch" role="dialog" aria-modal="true" aria-labelledby="switch-task-title">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-2xl" aria-hidden="true">⚡</div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300 font-black">{copy.switchEyebrow}</p>
                <h2 id="switch-task-title" className="mt-1 text-lg font-black text-white">{copy.switchTitle}</h2>
                <p className="mt-2 text-sm text-gray-400">{copy.switchBody}</p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">{copy.currentTask}</p>
                  <p className="mt-1 truncate text-sm font-bold text-cyan-300">{runningTitle}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-gray-500">{copy.nextTask}</p>
                  <p className="mt-1 truncate text-sm font-bold text-violet-300">{switchTask.title}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={onDismissSwitch} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white/10">{copy.cancel}</button>
              <button type="button" onClick={() => void onConfirmSwitch(switchTask)} className="rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 py-2.5 text-sm font-black text-violet-200 transition hover:bg-violet-400/20">{copy.switchConfirm}</button>
            </div>
          </section>
        </div>, document.body,
      )}
    </>
  );
}
