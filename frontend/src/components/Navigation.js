import React from 'react';
import {
  Box,
  Flex,
  Spacer,
  Button,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navigation = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box bg={colorMode === 'light' ? 'gray.100' : 'gray.900'} px={4} py={3}>
      <Flex maxW="container.lg" mx="auto" alignItems="center">
        <Text fontSize="xl" fontWeight="bold">
          ZKP Auth System
        </Text>
        <Spacer />
        {user && (
          <>
            <Button
              variant="ghost"
              mr={2}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              mr={2}
              onClick={() => navigate('/profile')}
            >
              Profile
            </Button>
            <Button colorScheme="blue" mr={2} onClick={toggleColorMode}>
              {colorMode === 'light' ? '🌙' : '☀️'}
            </Button>
            <Button colorScheme="red" onClick={handleLogout}>
              Logout
            </Button>
          </>
        )}
      </Flex>
    </Box>
  );
};