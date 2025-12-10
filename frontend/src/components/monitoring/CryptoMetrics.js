import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import MonitoringService from '../../services/MonitoringService';

function CryptoMetrics() {
  const [cryptoMetrics, setCryptoMetrics] = useState(null);

  useEffect(() => {
    const fetchCryptoMetrics = async () => {
      try {
        const metrics = await MonitoringService.getMetrics();
        const cryptoOps = Object.entries(metrics)
          .filter(([key]) => key.startsWith('crypto_operations'))
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        setCryptoMetrics(cryptoOps);
      } catch (error) {
        console.error('Failed to fetch crypto metrics:', error);
      }
    };

    fetchCryptoMetrics();
    const interval = setInterval(fetchCryptoMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box p={5}>
      <Heading size="md" mb={4}>Crypto Operations Metrics</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Operation</Th>
            <Th>Count</Th>
            <Th>Success Rate</Th>
          </Tr>
        </Thead>
        <Tbody>
          {cryptoMetrics && Object.entries(cryptoMetrics).map(([key, value]) => (
            <Tr key={key}>
              <Td>{key}</Td>
              <Td>{value}</Td>
              <Td>{value > 0 ? ((value.success / value.total) * 100).toFixed(2) : 0}%</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default CryptoMetrics;