export type FileIconKey = 'pdf' | 'image' | 'spreadsheet' | 'document' | 'text' | 'code' | 'default';

export interface FileTypeInfo {
  iconKey: FileIconKey;
  canPreview: boolean;
  label: string;
}

const fileTypeRules: { test: (type: string, ext: string) => boolean; info: FileTypeInfo }[] = [
  {
    test: (type) => type === 'application/pdf',
    info: { iconKey: 'pdf', canPreview: true, label: 'PDF' }
  },
  {
    test: (type) => type.startsWith('image/'),
    info: { iconKey: 'image', canPreview: true, label: 'Imagem' }
  },
  {
    test: (type) => type.includes('spreadsheet') || type.includes('excel'),
    info: { iconKey: 'spreadsheet', canPreview: false, label: 'Planilha' }
  },
  {
    test: (_, ext) => ext === '.csv',
    info: { iconKey: 'spreadsheet', canPreview: false, label: 'CSV' }
  },
  {
    test: (type) => type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || type === 'application/msword',
    info: { iconKey: 'document', canPreview: false, label: 'Word' }
  },
  {
    test: (_, ext) => ext === '.doc' || ext === '.docx',
    info: { iconKey: 'document', canPreview: false, label: 'Word' }
  },
  {
    test: (type) => type.startsWith('text/'),
    info: { iconKey: 'text', canPreview: true, label: 'Texto' }
  },
  {
    test: (type) => type.includes('json') || type.includes('xml') || type.includes('html'),
    info: { iconKey: 'code', canPreview: false, label: 'Código' }
  },
];

export function getFileTypeInfo(type: string, fileName?: string): FileTypeInfo {
  const ext = fileName ? `.${fileName.split('.').pop()?.toLowerCase()}` : '';
  for (const rule of fileTypeRules) {
    if (rule.test(type, ext)) return rule.info;
  }
  return { iconKey: 'default', canPreview: false, label: 'Arquivo' };
}
