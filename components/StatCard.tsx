import { Paper, Text, Group, Badge } from '@mantine/core';
import { useState } from 'react';
import { StatCardProps } from '@/types/analytics';
import {
  IconArrowBigUpFilled,
  IconArrowBigDownFilled
} from '@tabler/icons-react';

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  priorValue,
  change,
  color,
  lowerBetter,
  neutral,
  onClick,
  active
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isPositive = change?.startsWith('+');
  const changeValue = change?.replace(/[+-]/, '');


  return (
    <Paper
      shadow={isHovered ? "md" : "sm"}
      p="xl"
      radius="lg"
      withBorder
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'pointer',
        borderColor: isHovered || active ? color : undefined,
      }}
      // bg={neutral ? 'white' : (isPositive || lowerBetter ? '#bbffdd44' : '#ff9a9a44')}
    >
      <Group justify="space-between" mb="md" wrap="nowrap">
        <div
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            padding: '12px',
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${color}40`,
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {icon}
        </div>
        {change && (
          <div>
            {/* {isPositive ? (
              <IconArrowBigUpFilled size={24} color="teal" />
            ) : (
              <IconArrowBigDownFilled size={24} color="red" />
            )} */}
            <Badge
              color={neutral ? 'blue' : ((isPositive && !lowerBetter) || (!isPositive && lowerBetter) ? 'teal' : 'red')}
              leftSection={isPositive ? <IconArrowBigUpFilled size={16} /> : <IconArrowBigDownFilled size={16} />}
              variant="light"
              size="lg"
              style={{
                fontWeight: 600,
                padding: '8px 12px',
              }}
            >
              {change}
            </Badge>
          </div>
        )}
      </Group>

      <Text
        size="sm"
        tt="uppercase"
        fw={600}
        style={{
          letterSpacing: '0.5px',
          marginBottom: '8px',
        }}
      >
        {title}
      </Text>

      <Group align="baseline" gap="xs" mt="xs">
        <Text
          fw={700}
          size="32px"
          style={{
            lineHeight: 1.2,
            background: isHovered ? `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)` : 'inherit',
            WebkitBackgroundClip: isHovered ? 'text' : 'unset',
            WebkitTextFillColor: isHovered ? 'transparent' : 'inherit',
            transition: 'all 0.3s ease',
          }}
        >
          {value}
        </Text>
      </Group>
      {priorValue && (
        <Text
          fw={600}
          size="24px"
          style={{
            lineHeight: 1.2,
            background: isHovered ? `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)` : 'transparent',
            WebkitBackgroundClip: isHovered ? 'text' : 'unset',
            WebkitTextFillColor: isHovered ? 'transparent' : 'inherit',
            transition: 'all 0.3s ease',
          }}
        >
          from {priorValue ? priorValue : ''}
        </Text>
      )}

      {change && (
        <Group gap={4} mt="xs">
          <Text
            size="xs"
            style={{ opacity: 0.8 }}
          >
            {isPositive ? '↑' : '↓'} {changeValue} change
          </Text>
        </Group>
      )}
    </Paper>
  );
};