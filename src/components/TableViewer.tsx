import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SchemaIcon from '@mui/icons-material/Schema';
import TableViewIcon from '@mui/icons-material/TableView';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SchemaView from './SchemaView';
import DataGrid from './DataGrid';
import {
  SQLiteDatabase,
  ServerDatabase,
  ColumnInfo,
  PagedData,
} from '../utils/database';
import {
  generateSchemaMarkdown,
  generateDataMarkdown,
  copyToClipboard,
  downloadAsFile,
} from '../utils/export';

interface TableViewerProps {
  database: SQLiteDatabase;
  tableName: string;
  serverMode?: boolean;
}

/** Tab 面板组件 */
const TabPanel: React.FC<{
  children: React.ReactNode;
  value: number;
  index: number;
}> = ({ children, value, index }) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ flex: 1, overflow: 'auto', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
    >
      {children}
    </Box>
  );
};

/** 表查看器主组件 */
const TableViewer: React.FC<TableViewerProps> = ({
  database,
  tableName,
  serverMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [pagedData, setPagedData] = useState<PagedData>({
    columns: [],
    rows: [],
    totalRows: 0,
    page: 1,
    pageSize: 50,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  // 加载表结构
  useEffect(() => {
    let cancelled = false;
    const loadSchema = async () => {
      setLoading(true);
      try {
        if (database instanceof ServerDatabase) {
          const info = await database.getTableInfo(tableName);
          if (!cancelled) setColumns(info);
        } else {
          // WebDatabase 是同步的
          const info = database.getTableInfo(tableName);
          if (!cancelled) setColumns(info as ColumnInfo[]);
        }
      } catch (err) {
        console.error('Failed to load schema:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (tableName) loadSchema();
    return () => { cancelled = true; };
  }, [tableName, database]);

  // 加载表数据
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (activeTab !== 1) return;
      setLoading(true);
      try {
        if (database instanceof ServerDatabase) {
          const data = await database.getTableData(tableName, 1, pagedData.pageSize);
          if (!cancelled) setPagedData(data);
        } else {
          const data = database.getTableData(tableName, 1, pagedData.pageSize);
          if (!cancelled) setPagedData(data as PagedData);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (tableName) loadData();
    return () => { cancelled = true; };
  }, [tableName, activeTab, database]);

  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      if (database instanceof ServerDatabase) {
        const data = await database.getTableData(tableName, page, pagedData.pageSize);
        setPagedData(data);
      } else {
        const data = database.getTableData(tableName, page, pagedData.pageSize);
        setPagedData(data as PagedData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = async (pageSize: number) => {
    setLoading(true);
    try {
      if (database instanceof ServerDatabase) {
        const data = await database.getTableData(tableName, 1, pageSize);
        setPagedData(data);
      } else {
        const data = database.getTableData(tableName, 1, pageSize);
        setPagedData(data as PagedData);
      }
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  /** 导出表结构为 Markdown 并复制到剪贴板 */
  const handleExportSchemaCopy = async () => {
    const md = generateSchemaMarkdown(tableName, columns);
    const success = await copyToClipboard(md);
    if (success) {
      showSnackbar('表结构已复制到剪贴板');
    } else {
      showSnackbar('复制失败，请重试', 'error');
    }
    setExportAnchorEl(null);
  };

  /** 导出表结构为 Markdown 文件 */
  const handleExportSchemaDownload = async () => {
    const md = generateSchemaMarkdown(tableName, columns);
    downloadAsFile(md, `${tableName}_schema.md`);
    showSnackbar('表结构文件已下载');
    setExportAnchorEl(null);
  };

  /** 导出表数据为 Markdown 并复制到剪贴板 */
  const handleExportDataCopy = async () => {
    let allData: { columns: string[]; rows: string[][] };
    if (database instanceof ServerDatabase) {
      allData = await database.getAllTableData(tableName);
    } else {
      allData = database.getAllTableData(tableName) as { columns: string[]; rows: string[][] };
    }
    const md = generateDataMarkdown(tableName, allData.columns, allData.rows);
    const success = await copyToClipboard(md);
    if (success) {
      showSnackbar('表数据已复制到剪贴板');
    } else {
      showSnackbar('复制失败，请重试', 'error');
    }
    setExportAnchorEl(null);
  };

  /** 导出表数据为 Markdown 文件 */
  const handleExportDataDownload = async () => {
    let allData: { columns: string[]; rows: string[][] };
    if (database instanceof ServerDatabase) {
      allData = await database.getAllTableData(tableName);
    } else {
      allData = database.getAllTableData(tableName) as { columns: string[]; rows: string[][] };
    }
    const md = generateDataMarkdown(tableName, allData.columns, allData.rows);
    downloadAsFile(md, `${tableName}_data.md`);
    showSnackbar('表数据文件已下载');
    setExportAnchorEl(null);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 顶部工具栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'grey.50',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {tableName}
          </Typography>
          {loading && <CircularProgress size={16} />}
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DescriptionIcon />}
          endIcon={<MoreVertIcon />}
          onClick={(e) => setExportAnchorEl(e.currentTarget)}
          sx={{ textTransform: 'none' }}
        >
          导出 Markdown
        </Button>
        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={() => setExportAnchorEl(null)}
          PaperProps={{ sx: { minWidth: 220 } }}
        >
          <MenuItem onClick={handleExportSchemaCopy}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>复制表结构</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportSchemaDownload}>
            <ListItemIcon>
              <FileDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{serverMode ? '保存表结构' : '下载表结构'}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleExportDataCopy}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>复制表数据</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportDataDownload}>
            <ListItemIcon>
              <FileDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{serverMode ? '保存表数据' : '下载表数据'}</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {/* Tab 切换 */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 2,
          minHeight: 40,
          '& .MuiTab-root': {
            minHeight: 40,
            py: 0.5,
          },
        }}
      >
        <Tab
          icon={<SchemaIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          label="表结构"
          sx={{ textTransform: 'none', minHeight: 40 }}
        />
        <Tab
          icon={<TableViewIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          label="表数据"
          sx={{ textTransform: 'none', minHeight: 40 }}
        />
      </Tabs>

      {/* 内容区域 */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <TabPanel value={activeTab} index={0}>
          <SchemaView tableName={tableName} columns={columns} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <DataGrid
            tableName={tableName}
            data={pagedData}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </TabPanel>
      </Box>

      {/* Snackbar 提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TableViewer;
