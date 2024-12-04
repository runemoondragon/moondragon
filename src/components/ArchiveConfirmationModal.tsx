import { Dialog } from '@headlessui/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  questionText: string;
}

export function ArchiveConfirmationModal({ isOpen, onClose, onConfirm, questionText }: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Archive Voting Session
          </Dialog.Title>
          
          <Dialog.Description className="text-gray-400 mb-6">
            Are you sure you want to archive this voting session?
            <div className="mt-2 p-3 bg-gray-800 rounded-lg">
              &quot;{questionText}&quot;
            </div>
            <p className="mt-4">
              Archiving will remove it from the active dashboard and store it in the archives for future reference.
            </p>
          </Dialog.Description>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              Archive
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 