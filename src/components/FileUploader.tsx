import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';

interface FileUploaderProps {
  /** 文件上传回调 */
  onFileSelected: (file: File) => void;
  /** 是否正在加载 */
  loading: boolean;
  /** 内联模式 - 仅显示上传按钮区域，不显示标题和描述 */
  inline?: boolean;
}

/** 文件上传组件 */
const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  loading,
  inline = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  // 内联模式 - 仅显示拖放区域和按钮
  if (inline) {
    return (
      <Box
        sx={{
          width: '100%',
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: dragOver ? 'primary.50' : 'grey.50',
          transition: 'all 0.2s ease',
          cursor: loading ? 'default' : 'pointer',
        }}
        onClick={loading ? undefined : handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={28} />
            <Typography>正在加载数据库...</Typography>
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              {dragOver ? '释放文件以上传' : '拖放 .db 文件到此处'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              或点击选择文件
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{ textTransform: 'none' }}
            >
              选择 .db 文件
            </Button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".db,.sqlite,.sqlite3"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </Box>
    );
  }

  // 完整模式 - 独立页面
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 520,
          width: '100%',
          borderRadius: 3,
        }}
      >
        <StorageIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          SQLite 数据库浏览器
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          选择或拖放 .db 文件以开始浏览数据库内容
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={28} />
            <Typography>正在加载数据库...</Typography>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={<CloudUploadIcon />}
            onClick={handleClick}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            选择 .db 文件
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".db,.sqlite,.sqlite3"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </Paper>
    </Box>
  );
};

export default FileUploader;
