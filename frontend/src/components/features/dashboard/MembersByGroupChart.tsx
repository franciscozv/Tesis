'use client';

import { getMemberCountByGroup } from "~/services/groupService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { Card, CardContent, Typography } from "@mui/material";

interface MemberCount {
  name: string;
  miembros: number;
}

export default function MembersByGroupChart() {
  const [data, setData] = useState<MemberCount[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const memberCount = await getMemberCountByGroup();
      const formattedData = memberCount.map((item: { name: string; members: number; }) => ({ name: item.name, miembros: item.members }));
      setData(formattedData);
    };

    fetchData();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' component='div'>
          Miembros por Grupo
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="miembros" fill="#42A5F5" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}