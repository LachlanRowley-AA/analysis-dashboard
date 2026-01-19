import { Card, Title, Stack, PasswordInput, Button, Text } from '@mantine/core';

interface ConfigurationCardProps {
  fbToken: string;
  ghlToken: string;
  onFbTokenChange: (value: string) => void;
  onGhlTokenChange: (value: string) => void;
  onSubmit: () => void;
}

export const ConfigurationCard: React.FC<ConfigurationCardProps> = ({
  fbToken,
  ghlToken,
  onFbTokenChange,
  onGhlTokenChange,
  onSubmit,
}) => {
  return (
    <Card shadow="xl" padding="xl" radius="md">
      <Title order={2} mb="xl">
        API Configuration
      </Title>
      <Stack gap="md">
        <PasswordInput
          label="Facebook Access Token"
          placeholder="Enter Facebook token"
          value={fbToken}
          onChange={(e) => onFbTokenChange(e.currentTarget.value)}
        />
        <PasswordInput
          label="GoHighLevel API Key"
          placeholder="Enter GHL API key"
          value={ghlToken}
          onChange={(e) => onGhlTokenChange(e.currentTarget.value)}
        />
        <Button fullWidth onClick={onSubmit} disabled={!fbToken || !ghlToken}>
          Connect & Load Data
        </Button>
        <Text size="sm" c="dimmed" ta="center">
          Demo mode: Click connect to view sample data
        </Text>
      </Stack>
    </Card>
  );
};