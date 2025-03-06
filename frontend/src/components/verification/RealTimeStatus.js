import React, { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  Text,
  HStack,
  VStack,
  Heading,
} from '@chakra-ui/react';

export const RealTimeStatus = ({ userId }) => {
  const [status, setStatus] = useState('idle');
  const [lastVerification, setLastVerification] = useState(null);

  useEffect(() => {
    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(`ws://localhost:5000/ws/verification/${userId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
      setLastVerification(data.timestamp);
    };

    return () => ws.close();
  }, [userId]);

  return (
    <Box p={4} borderRadius="lg" borderWidth="1px">
      <VStack align="stretch" spacing={3}>
        <Heading size="md">Real-time Status</Heading>
        <HStack>
          <Badge colorScheme={status === 'verifying' ? 'yellow' : 'green'}>
            {status.toUpperCase()}
          </Badge>
          {lastVerification && (
            <Text fontSize="sm" color="gray.500">
              Last updated: {new Date(lastVerification).toLocaleTimeString()}
            </Text>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};