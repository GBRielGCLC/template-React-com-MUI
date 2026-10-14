import { ReactNode } from "react";
import { Box, Typography, IconButton, Dialog, DialogTitle, DialogContent, Tooltip, CircularProgress } from "@mui/material";
import {
  CloudUpload,
  Close,
  Preview,
  PictureAsPdf,
  Image,
  TableChart,
  Article,
  TextSnippet,
  Code,
  DescriptionOutlined,
} from "@mui/icons-material";
import { useFileUpload, type AcceptMime, type FileIconKey } from "./useFileUpload";

const iconMap: Record<FileIconKey, (sx?: object) => ReactNode> = {
  pdf: (sx) => <PictureAsPdf sx={{ ...sx, color: "error.main" }} />,
  image: (sx) => <Image sx={{ ...sx, color: "success.main" }} />,
  spreadsheet: (sx) => <TableChart sx={{ ...sx, color: "success.main" }} />,
  document: (sx) => <Article sx={{ ...sx, color: "primary.main" }} />,
  text: (sx) => <TextSnippet sx={{ ...sx, color: "info.main" }} />,
  code: (sx) => <Code sx={{ ...sx, color: "warning.main" }} />,
  default: (sx) => <DescriptionOutlined sx={{ ...sx, color: "text.secondary" }} />,
};

interface FileUploadProps {
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

export function FileUpload({
  value,
  onChange,
  existingFileName,
  existingFileUrl,
  disabled = false,
  loading = false,
  accept,
  maxSize,
  error: externalError = false,
  helperText,
  openPreviewInModal = true,
}: FileUploadProps) {
  const {
    inputRef,
    dragOver,
    setDragOver,
    error,
    isDisabled,
    isLoading,
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
  } = useFileUpload({
    value,
    onChange,
    existingFileName,
    existingFileUrl,
    disabled,
    loading,
    accept,
    maxSize,
    openPreviewInModal,
  });

  return (
    <>
      <Box
        onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isDisabled && inputRef.current?.click()}
        sx={{
          position: "relative",
          border: "2px dashed",
          borderColor: dragOver ? "primary.main" : error || externalError ? "error.main" : "grey.400",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          cursor: isDisabled ? "default" : "pointer",
          bgcolor: isDisabled ? "action.disabledBackground" : dragOver ? "action.hover" : "background.paper",
          opacity: isDisabled && !isLoading ? 0.5 : 1,
          transition: "all 0.2s",
          "&:hover": isDisabled ? {} : { borderColor: "primary.main", bgcolor: "action.hover" },
          pointerEvents: isDisabled ? "none" : "auto",
        }}
      >
        {isLoading && (
          <CircularProgress
            size={24}
            sx={{ position: "absolute", top: 8, right: 8, color: "primary.main" }}
          />
        )}

        <input
          ref={inputRef}
          type="file"
          hidden
          accept={acceptStr}
          onChange={handleFileChange}
          disabled={isDisabled}
        />

        {currentFileName ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "center" }}>
            {isImage && previewUrl ? (
              <Box
                component="img"
                src={previewUrl}
                alt="preview"
                sx={{ maxHeight: 120, maxWidth: 120, borderRadius: 1, objectFit: "cover", opacity: isDisabled ? 0.5 : 1 }}
              />
            ) : (
              fileTypeInfo && iconMap[fileTypeInfo.iconKey]({ fontSize: 48 })
            )}

            <Typography
              variant="body2"
              color={isDisabled ? "text.disabled" : "text.primary"}
              sx={{ wordBreak: "break-all", flex: 1, textAlign: "left" }}
            >
              {currentFileName}
            </Typography>

            {canPreview && !isDisabled && (
              <Tooltip title="Visualizar">
                <IconButton size="small" onClick={handleOpenPreview} aria-label="Visualizar arquivo">
                  <Preview fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {!isDisabled && (
              <IconButton size="small" onClick={handleRemove} aria-label="Remover arquivo">
                <Close fontSize="small" />
              </IconButton>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <CloudUpload sx={{ fontSize: 40, color: isDisabled ? "text.disabled" : "text.secondary" }} />

            <Typography variant="body2" color={isDisabled ? "text.disabled" : "text.secondary"}>
              {isLoading ? "Enviando arquivo..." : "Arraste um arquivo ou clique para selecionar"}
            </Typography>

            <Typography variant="caption" color="text.disabled">
              Formatos aceitos: {acceptLabel}
            </Typography>
          </Box>
        )}

        {error && (
          <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
            {error}
          </Typography>
        )}

        {helperText && !error && (
          <Typography variant="caption" color={externalError ? "error" : "text.secondary"} sx={{ display: "block", mt: 1 }}>
            {helperText}
          </Typography>
        )}
      </Box>

      <Dialog open={previewModalOpen} onClose={handleClosePreviewModal} maxWidth="md" fullWidth>

        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {fileTypeInfo && iconMap[fileTypeInfo.iconKey]({})}
          {currentFileName}

          <IconButton onClick={handleClosePreviewModal} sx={{ ml: "auto" }} aria-label="Fechar preview">
            <Close />
          </IconButton>

        </DialogTitle>

        <DialogContent dividers sx={{ height: "70vh", p: 0 }}>
          {previewUrl && (
            isImage ? (
              <Box
                component="img"
                src={previewUrl}
                alt={currentFileName || ""}
                sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <iframe
                src={previewUrl}
                title={currentFileName || ""}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            )
          )}
        </DialogContent>

      </Dialog>
    </>
  );
}