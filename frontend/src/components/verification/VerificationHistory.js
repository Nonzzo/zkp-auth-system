import React from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  List,
  ListItem,
  Divider,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

export const VerificationHistory = ({ history }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      <VStack align="stretch" spacing={4}>
        <Heading size="md">Verification History</Heading>
        <List spacing={3}>
          {history.map((item, index) => (
            <ListItem key={index} p={3} borderRadius="md" borderWidth="1px">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <TimeIcon mr={2} />
                  <Text>{new Date(item.timestamp).toLocaleString()}</Text>
                </Box>
                <Badge colorScheme={item.success ? 'green' : 'red'}>
                  {item.success ? 'Success' : 'Failed'}
                </Badge>
              </Box>
            </ListItem>
          ))}
        </List>
      </VStack>
    </Box>
  );
};