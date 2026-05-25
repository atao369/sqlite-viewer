import React, { useState, useCallback, Component, ReactNode } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Snackbar,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  TextField,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import SchemaIcon from '@mui/icons-material/Schema';
import DownloadIcon from '@mui/icons-material/Download';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FileUploader from './components/FileUploader';
import TableList from './components/TableList';
import TableViewer from './components/TableViewer';
import {
  ServerDatabase,
  WebDatabase,
  SQLiteDatabase,
  isServerMode,
} from './utils/database';

/** 主题配置 */
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: [
      '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
      '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif',
    ].join(','),
  },
});

/** 错误边界组件 - 防止白屏 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f7fa', p: 3 }}>
          <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%', borderRadius: 3, textAlign: 'center' }}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>应用加载出错</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace', wordBreak: 'break-all', p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
              {this.state.error?.message || '未知错误'}
            </Typography>
            <Button variant="contained" onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>重新加载</Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}

/** 主应用组件 */
const App: React.FC = () => {
  const [database, setDatabase] = useState<SQLiteDatabase | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const serverMode = isServerMode();

  /** 处理服务器模式 - 输入文件路径 */
  const handleServerOpen = useCallback(async (inputPath: string) => {
    if (!inputPath.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const db = new ServerDatabase(inputPath.trim());
      await db.init();
      const tableNames = db.getTableNames();
      setDatabase(db);
      setFilePath(inputPath.trim());
      setTables(tableNames);
      setSelectedTable(tableNames.length > 0 ? tableNames[0] : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据库失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /** 处理 Web 模式 - 上传文件 */
  const handleWebFileSelected = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const db = new WebDatabase();
      await db.loadFile(file);
      const tableNames = db.getTableNames();
      setDatabase(db);
      setFilePath(file.name);
      setTables(tableNames);
      setSelectedTable(tableNames.length > 0 ? tableNames[0] : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据库失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReselect = useCallback(() => {
    if (database) database.close();
    setDatabase(null);
    setFilePath('');
    setTables([]);
    setSelectedTable(null);
  }, [database]);

  const handleTableSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName);
  }, []);

  const handleCloseError = useCallback(() => setError(null), []);

  // 未加载数据库 - 显示欢迎页
  if (!database) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f7fa', p: 3 }}>
          <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 640, width: '100%', borderRadius: 3 }}>
            <StorageIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1.5 }} />
            <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 700 }}>SQLite 数据库浏览器</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              {serverMode
                ? '输入 .db 文件路径，即可浏览表结构、查看数据、导出 Markdown'
                : '上传 .db 文件，即可浏览表结构、查看数据、导出 Markdown'}
            </Typography>

            {serverMode ? (
              <ServerFileInput onOpen={handleServerOpen} loading={loading} />
            ) : (
              <FileUploader onFileSelected={handleWebFileSelected} loading={loading} inline />
            )}

            <Divider sx={{ width: '100%', my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, alignSelf: 'flex-start' }}>功能介绍</Typography>
            <List dense sx={{ width: '100%' }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}><TableChartIcon color="primary" fontSize="small" /></ListItemIcon>
                <ListItemText primary="浏览表结构" secondary="查看字段名、类型、主键、约束、默认值" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}><SchemaIcon color="primary" fontSize="small" /></ListItemIcon>
                <ListItemText primary="查看表数据" secondary="分页浏览，支持 10/25/50/100/200 行每页" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}><DownloadIcon color="primary" fontSize="small" /></ListItemIcon>
                <ListItemText primary="导出 Markdown" secondary="复制到剪贴板或下载 .md 文件" />
              </ListItem>
            </List>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip label="支持 .db" size="small" variant="outlined" />
              <Chip label="支持 .sqlite" size="small" variant="outlined" />
              <Chip label="支持 .sqlite3" size="small" variant="outlined" />
              <Chip icon={<CheckCircleIcon />} label={serverMode ? '本地模式' : '浏览器模式'} size="small" color="success" variant="outlined" />
            </Box>
          </Paper>
        </Box>
        <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={handleCloseError} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>{error}</Alert>
        </Snackbar>
      </ThemeProvider>
    );
  }

  // 已加载数据库 - 显示浏览界面
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppBar position="static" elevation={1} sx={{ zIndex: 2 }}>
          <Toolbar variant="dense">
            <StorageIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>SQLite 数据库浏览器</Typography>
            <Typography variant="body2" sx={{ mr: 2, color: 'rgba(255,255,255,0.7)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={filePath}>{filePath}</Typography>
            <Button color="inherit" size="small" startIcon={<CloudUploadIcon />} onClick={handleReselect} sx={{ textTransform: 'none' }}>选择其他文件</Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Box sx={{ width: 240, minWidth: 240, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TableList tables={tables} selectedTable={selectedTable} onTableSelect={handleTableSelect} />
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {selectedTable ? (
              <TableViewer database={database} tableName={selectedTable} serverMode={serverMode} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">请从左侧选择一个表</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

/** 服务器模式下的文件路径输入组件 */
const ServerFileInput: React.FC<{ onOpen: (path: string) => void; loading: boolean }> = ({ onOpen, loading }) => {
  const [inputPath, setInputPath] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const handleOpen = () => onOpen(inputPath);

  /** 点击"浏览"按钮 - 调用后端弹出系统文件选择对话框 */
  const handleBrowse = async () => {
    setBrowsing(true);
    try {
      const response = await fetch('/api/open-file-dialog');
      const result = await response.json();
      if (result.success && result.filePath) {
        setInputPath(result.filePath);
        onOpen(result.filePath);
      }
      // 用户取消则什么都不做
    } catch (err) {
      console.error('文件选择对话框出错:', err);
    } finally {
      setBrowsing(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="输入 .db 文件路径，如 C:\data\test.db"
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
          disabled={loading || browsing}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<FolderOpenIcon />}
          onClick={handleBrowse}
          disabled={loading || browsing}
          sx={{ minWidth: 100, textTransform: 'none', whiteSpace: 'nowrap' }}
        >
          {browsing ? '选择中...' : '浏览'}
        </Button>
      </Box>
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<StorageIcon />}
        onClick={handleOpen}
        disabled={loading || !inputPath.trim()}
        sx={{ py: 1.5, fontSize: '1rem', textTransform: 'none', borderRadius: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : '打开数据库'}
      </Button>
    </Box>
  );
};

const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary><App /></ErrorBoundary>
);

export default AppWithErrorBoundary;
