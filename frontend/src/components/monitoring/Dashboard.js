import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import MonitoringService from '../../services/MonitoringService';

function MonitoringDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metricsData = await MonitoringService.getMetrics();
        const healthStatus = await MonitoringService.getHealthStatus();
        setMetrics(metricsData);
        setHealth(healthStatus);
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Box p={5}>
      <Heading size="lg" mb={4}>System Monitoring</Heading>
      <SimpleGrid columns={[1, 2, 3]} spacing={10}>
        <Stat>
          <StatLabel>System Status</StatLabel>
          <StatNumber>{health ? '✅ Healthy' : '❌ Unhealthy'}</StatNumber>
          <StatHelpText>Real-time system health</StatHelpText>
        </Stat>
        
        {metrics && Object.entries(metrics).map(([key, value]) => (
          <Stat key={key}>
            <StatLabel>{key}</StatLabel>
            <StatNumber>{value}</StatNumber>
          </Stat>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default MonitoringDashboard;