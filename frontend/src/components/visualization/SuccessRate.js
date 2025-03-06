import React from 'react';
import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Text,
  VStack,
  Heading,
} from '@chakra-ui/react';

export const SuccessRate = ({ successRate }) => {
  return (
    <Box p={4} borderRadius="lg" borderWidth="1px">
      <VStack spacing={4}>
        <Heading size="md">Verification Success Rate</Heading>
        <CircularProgress
          value={successRate}
          size="120px"
          thickness="8px"
          color={successRate > 70 ? 'green.400' : 'orange.400'}
        >
          <CircularProgressLabel>{successRate}%</CircularProgressLabel>
        </CircularProgress>
        <Text fontSize="sm" color="gray.500">
          Based on your last 100 verifications
        </Text>
      </VStack>
    </Box>
  );
};