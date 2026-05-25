import React from 'react';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';

interface TableListProps {
  /** 表名列表 */
  tables: string[];
  /** 当前选中的表名 */
  selectedTable: string | null;
  /** 选中表变更回调 */
  onTableSelect: (tableName: string) => void;
}

/** 左侧表列表组件 */
const TableList: React.FC<TableListProps> = ({
  tables,
  selectedTable,
  onTableSelect,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'grey.50',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          数据表 ({tables.length})
        </Typography>
      </Box>
      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          pt: 0,
          '& .MuiListItemButton-root': {
            py: 0.5,
            px: 1.5,
          },
        }}
      >
        {tables.map((tableName) => (
          <ListItemButton
            key={tableName}
            selected={selectedTable === tableName}
            onClick={() => onTableSelect(tableName)}
            sx={{
              borderRadius: 1,
              mx: 0.5,
              mb: 0.25,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.main',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <TableChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={tableName}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: selectedTable === tableName ? 600 : 400,
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
};

export default TableList;
