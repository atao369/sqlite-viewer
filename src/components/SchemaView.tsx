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
  Chip,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { ColumnInfo } from '../utils/database';

interface SchemaViewProps {
  /** 表名 */
  tableName: string;
  /** 列信息 */
  columns: ColumnInfo[];
}

/** 表结构视图组件 */
const SchemaView: React.FC<SchemaViewProps> = ({ tableName, columns }) => {
  if (columns.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">该表没有字段信息</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        表结构 - {tableName}
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600, width: 60 }}>序号</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>字段名</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>类型</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'center' }}>
                主键
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, textAlign: 'center' }}>
                允许NULL
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>默认值</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {columns.map((col) => (
              <TableRow key={col.cid} hover>
                <TableCell>{col.cid}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {col.pk && (
                      <KeyIcon
                        sx={{ fontSize: 16, color: 'warning.main' }}
                      />
                    )}
                    <Typography
                      component="span"
                      sx={{ fontWeight: col.pk ? 600 : 400 }}
                    >
                      {col.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={col.type || 'ANY'}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell align="center">
                  {col.pk ? (
                    <Chip
                      label="✓"
                      size="small"
                      color="warning"
                      sx={{ minWidth: 32, height: 24 }}
                    />
                  ) : (
                    <Typography color="text.disabled">-</Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={col.notnull ? 'NO' : 'YES'}
                    size="small"
                    color={col.notnull ? 'default' : 'success'}
                    variant={col.notnull ? 'outlined' : 'filled'}
                    sx={{ minWidth: 40, height: 24, fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    color={col.dflt_value === null ? 'text.disabled' : 'text.primary'}
                    sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                  >
                    {col.dflt_value === null ? '-' : col.dflt_value}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SchemaView;
