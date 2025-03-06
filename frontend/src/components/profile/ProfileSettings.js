import React, { useState } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Button,
  useToast,
  Heading,
  Divider,
} from '@chakra-ui/react';

export const ProfileSettings = ({ userId }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    twoFactorAuth: false,
    realTimeUpdates: true
  });
  const toast = useToast();

  const handleSettingChange = async (setting) => {
    try {
      const newValue = !settings[setting];
      // Update in backend
      await fetch(`/api/user/settings/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [setting]: newValue })
      });
      
      setSettings(prev => ({ ...prev, [setting]: newValue }));
      toast({
        title: 'Settings updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to update settings',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box p={4} borderRadius="lg" borderWidth="1px">
      <VStack align="stretch" spacing={4}>
        <Heading size="md">Profile Settings</Heading>
        <Divider />
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="email-alerts" mb="0">
            Email Notifications
          </FormLabel>
          <Switch
            id="email-alerts"
            isChecked={settings.emailNotifications}
            onChange={() => handleSettingChange('emailNotifications')}
          />
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="2fa" mb="0">
            Two-Factor Authentication
          </FormLabel>
          <Switch
            id="2fa"
            isChecked={settings.twoFactorAuth}
            onChange={() => handleSettingChange('twoFactorAuth')}
          />
        </FormControl>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="real-time" mb="0">
            Real-time Updates
          </FormLabel>
          <Switch
            id="real-time"
            isChecked={settings.realTimeUpdates}
            onChange={() => handleSettingChange('realTimeUpdates')}
          />
        </FormControl>
      </VStack>
    </Box>
  );
};