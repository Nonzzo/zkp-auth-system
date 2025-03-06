import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6}>
        <Heading>Welcome to ZKP Auth Dashboard</Heading>
        <Box p={6} borderWidth={1} borderRadius="lg" width="100%">
          <VStack spacing={4} align="start">
            <Text fontSize="lg">
              Logged in as: <strong>{user?.username}</strong>
            </Text>
            <Text>Your authentication is secured with Zero-Knowledge Proofs.</Text>
            <Button colorScheme="red" onClick={handleLogout}>
              Logout
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};