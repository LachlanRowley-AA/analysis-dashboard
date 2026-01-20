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
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isPositive = change?.startsWith('+');
  const changeValue = change?.replace(/[+-]/, '');

  // console.log("StatCard Render:", { title, value, priorValue, change, isPositive, lowerBetter, neutral });

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
        borderColor: isHovered ? color : undefined,
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

// Demo component to showcase the StatCard
const Demo = () => {
  return (
    <div style={{
      padding: '40px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <Text size="32px" fw={700} c="white" mb="xl">
          Analytics Dashboard
        </Text>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          <StatCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>}
            title="Total Users"
            value="12,584"
            priorValue="11,234"
            change="+12.5%"
            color="#6366f1"
          />

          <StatCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>}
            title="Revenue"
            value="$54,320"
            priorValue="$48,200"
            change="+8.3%"
            color="#10b981"
          />

          <StatCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>}
            title="Engagement"
            value="68.4%"
            priorValue="72.1%"
            change="-3.7%"
            color="#f59e0b"
          />

          <StatCard
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>}
            title="Downloads"
            value="8,456"
            priorValue="7,823"
            change="+15.2%"
            color="#ec4899"
          />
        </div>
      </div>
    </div>
  );
};

export default Demo;