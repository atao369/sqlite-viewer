import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import { PagedData } from '../utils/database';

interface DataGridProps {
  /** 表名 */
  tableName: string;
  /** 分页数据 */
  data: PagedData;
  /** 页码变更回调 */
  onPageChange: (page: number) => void;
  /** 每页行数变更回调 */
  onPageSizeChange: (pageSize: number) => void;
  /** 是否加载中 */
  loading?: boolean;
}

/** 数据表格视图组件 */
const DataGrid: React.FC<DataGridProps> = ({
  tableName,
  data,
  onPageChange,
  onPageSizeChange,
  loading = false,
}) => {
  const { columns, rows, totalRows, page, pageSize } = data;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  if (loading && columns.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <CircularProgress size={32} />
        <Typography sx={{ ml: 2 }} color="text.secondary">加载中...</Typography>
      </Box>
    );
  }

  if (columns.length === 0 && rows.length === 0 && totalRows === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">该表没有数据</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 顶部信息栏 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">数据 - {tableName}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            共 {totalRows} 行，第 {page}/{totalPages} 页
          </Typography>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              sx={{ height: 32, fontSize: '0.875rem' }}
            >
              <MenuItem value={10}>10 行/页</MenuItem>
              <MenuItem value={25}>25 行/页</MenuItem>
              <MenuItem value={50}>50 行/页</MenuItem>
              <MenuItem value={100}>100 行/页</MenuItem>
              <MenuItem value={200}>200 行/页</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* 数据表格 */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ flex: 1, overflow: 'auto' }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell
                  key={col}
                  sx={{
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    backgroundColor: 'grey.100',
                    left: idx === 0 ? 0 : undefined,
                    zIndex: idx === 0 ? 2 : 1,
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIdx) => (
              <TableRow key={rowIdx} hover>
                {row.map((cell, cellIdx) => (
                  <TableCell
                    key={cellIdx}
                    sx={{
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: cell === 'NULL' ? 'monospace' : 'inherit',
                      color: cell === 'NULL' ? 'text.disabled' : 'text.primary',
                    }}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 底部分页控制 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          第 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalRows)} 行
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || loading}
            size="small"
            title="第一页"
          >
            <FirstPageIcon />
          </IconButton>
          <IconButton
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            size="small"
            title="上一页"
          >
            <KeyboardArrowLeft />
          </IconButton>

          {/* 页码按钮 */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                size="small"
                variant={pageNum === page ? 'contained' : 'outlined'}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                sx={{ minWidth: 32, px: 0.5, fontSize: '0.8rem' }}
              >
                {pageNum}
              </Button>
            );
          })}

          <IconButton
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            size="small"
            title="下一页"
          >
            <KeyboardArrowRight />
          </IconButton>
          <IconButton
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || loading}
            size="small"
            title="最后一页"
          >
            <LastPageIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default DataGrid;
