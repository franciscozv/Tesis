"use client";
import React, { useState, useEffect } from "react";
import { Box, Tooltip, Typography, TextField } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

interface EditorClientProps {
  value: string;
  onChange: (value: string) => void;
}

const EditorClient: React.FC<EditorClientProps> = ({ value, onChange }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Descripción
          </Typography>
          <Tooltip 
            title="Describe los detalles del evento. Puedes usar formato de texto enriquecido como negrita, cursiva, listas, etc."
            placement="top"
            arrow
          >
            <InfoIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
          </Tooltip>
        </Box>
        <TextField
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          placeholder="Cargando editor..."
          disabled
          sx={{ minHeight: 120 }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Descripción
        </Typography>
        <Tooltip 
          title="Describe los detalles del evento. Puedes usar formato de texto enriquecido como negrita, cursiva, listas, etc."
          placement="top"
          arrow
        >
          <InfoIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
        </Tooltip>
      </Box>
      <TextField
        multiline
        rows={4}
        fullWidth
        variant="outlined"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe los detalles del evento..."
        sx={{ minHeight: 120 }}
      />
    </Box>
  );
};

export default EditorClient;
