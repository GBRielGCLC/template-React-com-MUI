import { useRef, useState, useCallback, useEffect } from "react";
import { getFileTypeInfo, type FileIconKey, type FileTypeInfo } from "./fileTypes";

export type AcceptMime =
  | "application/pdf"
  | "image/png"
  | "image/jpeg"
  | "image/jpg"
  | "image/gif"
  | "image/webp"
  | "image/svg+xml"
  | "image/bmp"
  | "text/plain"
  | "text/csv"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/msword"
  | "application/json"
  | "text/html"
  | "text/xml";
export type { FileIconKey, FileTypeInfo };

interface UseFileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingFileName?: string | null;
  existingFileUrl?: string | null;
  disabled?: boolean;
  loading?: boolean;
  accept?: AcceptMime | AcceptMime[];
  maxSize?: number;
  error?: boolean;
  helperText?: string;
  openPreviewInModal?: boolean;
}

const toAcceptString = (accept?: AcceptMime | AcceptMime[]): string => {
  if (!accept || (Array.isArray(accept) && accept.length === 0)) return "*";
  if (Array.isArray(accept)) return accept.join(",");
  return accept;
};

const toAcceptLabel = (accept?: AcceptMime | AcceptMime[]): string => {
  if (!accept || (Array.isArray(accept) && accept.length === 0)) return "Todos";
  const items = Array.isArray(accept) ? accept : [accept];
  return items.map((mime) => getFileTypeInfo(mime, "").label).join(", ");
};

export function useFileUpload({
  value,
  onChange,
  existingFileName,
  existingFileUrl,
  disabled = false,
  loading = false,
  accept,
  maxSize = 20 * 1024 * 1024,
  openPreviewInModal = true,
}: UseFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const isDisabled = disabled || loading;
  const acceptStr = toAcceptString(accept);
  const acceptLabel = toAcceptLabel(accept);
  const currentFileName = value?.name || existingFileName || null;
  const fileTypeInfo = value
    ? getFileTypeInfo(value.type, value.name)
    : existingFileName
      ? getFileTypeInfo("", existingFileName)
      : null;
  const isImage = value?.type.startsWith("image/");
  const previewUrl = value ? preview : existingFileUrl || null;
  const canPreview = fileTypeInfo?.canPreview ?? false;

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [value]);

  const validateAndSet = useCallback(
    (file: File | null) => {

      setError(null);

      if (!file) {
        onChange(null);
        return;
      }

      const parts = acceptStr.split(",").map((a) => a.trim());
      const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;

      const mimeOk = parts.some(
        (e) => e === file.type || fileExt === e.replace("application/", ".").replace("image/", ".")
      );

      if (!mimeOk && acceptStr !== "*") {
        setError(`Tipo de arquivo não aceito. Permitido: ${acceptStr}`);
        return;
      }

      if (file.size > maxSize) {
        setError(`Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }

      onChange(file);
    },
    [acceptStr, maxSize, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (isDisabled) return;
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files?.[0];

      validateAndSet(file || null);
    },
    [validateAndSet, isDisabled]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isDisabled) return;
      validateAndSet(e.target.files?.[0] || null);
      e.target.value = "";
    },
    [validateAndSet, isDisabled]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      if (isDisabled) return;
      e.stopPropagation();
      onChange(null);
      setError(null);

      if (inputRef.current) inputRef.current.value = "";
    },
    [onChange, isDisabled]
  );

  const handleOpenPreview = useCallback(
    (e: React.MouseEvent) => {
      if (isDisabled) return;
      e.stopPropagation();
      const url = previewUrl;

      if (!url) return;

      if (openPreviewInModal) {
        setPreviewModalOpen(true);
      } else {
        window.open(url, "_blank");
      }

    },
    [previewUrl, openPreviewInModal, isDisabled]
  );

  const handleClosePreviewModal = useCallback(() => {
    setPreviewModalOpen(false);
  }, []);

  return {
    inputRef,
    dragOver,
    setDragOver,
    error,
    isDisabled,
    isLoading: loading,
    acceptStr,
    acceptLabel,
    currentFileName,
    fileTypeInfo,
    isImage,
    previewUrl,
    canPreview,
    previewModalOpen,
    handleDrop,
    handleFileChange,
    handleRemove,
    handleOpenPreview,
    handleClosePreviewModal,
    setError,
  };
}