// import React from 'react';
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
  useToast, Grid, GridItem,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';


import { VerificationHistory } from './verification/VerificationHistory';
import { SuccessRate } from './visualization/SuccessRate';
import { RealTimeStatus } from './verification/RealTimeStatus';
import { ProfileSettings } from './profile/ProfileSettings';

export const Profile = () => {
  const { user } = useAuth();
  const [verificationStats, setVerificationStats] = useState({
    totalVerifications: 0,
    successfulVerifications: 0,
    lastVerified: null
  });
  const toast = useToast();

  useEffect(() => {
    // Fetch user's verification history
    const fetchVerificationStats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/verification-stats/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        const data = await response.json();
        setVerificationStats(data);
      } catch (error) {
        toast({
          title: 'Error fetching verification stats',
          status: 'error',
          duration: 3000,
        });
      }
    };

    fetchVerificationStats();
  }, [user.userId, user.token, toast]);

  return (
    <Grid
      templateColumns="repeat(2, 1fr)"
      gap={6}
      maxW="container.xl"
      mx="auto"
      p={6}
    >
      <GridItem colSpan={2}>
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
          <VStack align="start" spacing={4}>
            <Heading size="lg">User Profile</Heading>
            <Text fontSize="xl">
              Username: <strong>{user.username}</strong>
            </Text>
            <Badge colorScheme="green">Verified Account</Badge>
          </VStack>
        </Box>
      </GridItem>

      <GridItem colSpan={2}>
        <RealTimeStatus userId={user.userId} />
      </GridItem>

      <GridItem>
        <SuccessRate successRate={85} />
      </GridItem>

      <GridItem>
        <ProfileSettings userId={user.userId} />
      </GridItem>

      <GridItem colSpan={2}>
        <StatGroup>
          <Stat>
            <StatLabel>Total Verifications</StatLabel>
            <StatNumber>{verificationStats.totalVerifications}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Successful Verifications</StatLabel>
            <StatNumber>{verificationStats.successfulVerifications}</StatNumber>
          </Stat>
        </StatGroup>
      </GridItem>

      <GridItem colSpan={2}>
        <VerificationHistory history={[]} />
      </GridItem>

      {verificationStats.lastVerified && (
        <GridItem colSpan={2}>
          <Text color="gray.600">
            Last verified: {new Date(verificationStats.lastVerified).toLocaleString()}
          </Text>
        </GridItem>
      )}
    </Grid>
  );
};