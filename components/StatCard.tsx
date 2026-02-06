import { Paper, Text, Group, Badge, rgba, Stack } from '@mantine/core';
import { useState } from 'react';
import { StatCardProps } from '@/types/analytics';
import {
  IconArrowBigUpFilled,
  IconArrowBigDownFilled,
  IconChartAreaLineFilled,
  IconEqual
} from '@tabler/icons-react';
import { formatValue } from '@/lib/formatter';

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
  active,
  sameDayChange,
  format
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isPositive = change?.startsWith('+');
  const changeValue = change?.replace(/[+-]/, '');

  const formatProp = format ?? 'number';

  const formattedSameDay =
    sameDayChange?.absolute !== undefined
      ? formatValue(sameDayChange.absolute, formatProp)
      : undefined;


  if (!!onClick) {
    console.log(`${title} has onclick`)
  }

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
        borderColor: isHovered || active ? color : '#4A4A4A',
      }}
      bg={active ? rgba(color, 0.18) : '#1C262D'} //3d3b3b
    > 
      <Group justify="space-between" mb="md" wrap="nowrap">
        {/* <div
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            padding: '12px',
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // boxShadow: `0 4px 12px ${color}30`,
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {icon}
        </div> */}
          {change && (
            <div>
              <Badge
                color={neutral ? 'blue' : ((isPositive && !lowerBetter) || (!isPositive && lowerBetter) ? 'teal' : 'red')}
                leftSection={isPositive ? <IconArrowBigUpFilled size={16} /> : <IconArrowBigDownFilled size={16} />}
                variant="light"
                size="lg"
              >
                {changeValue}{' '}(M)
              </Badge>
            </div>
          )}
          {sameDayChange?.absolute !== undefined && (
            <Badge
              color={neutral || sameDayChange.absolute === 0
                ? 'blue'
                : ((sameDayChange.absolute > 0 && !lowerBetter) ||
                  (sameDayChange.absolute < 0 && lowerBetter))
                  ? 'teal'
                  : 'red'}
              leftSection={
                sameDayChange.absolute > 0 ?
                  <IconArrowBigUpFilled size={16} /> :
                  sameDayChange.absolute == 0
                    ? <IconEqual size={16} />
                    : <IconArrowBigDownFilled size={16} />

              }
              variant="light"
              size="lg"
            >
              {formattedSameDay} (D)
            </Badge>
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
        c='#a1a1a1'
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
          c='white'
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
          c='#bbbbbb'
        >
          from {priorValue ? priorValue : ''}
        </Text>
      )}

      <Group justify='right'>
        {!!onClick && <IconChartAreaLineFilled size={28} color='#01E194'/>}

      </Group>
    </Paper>
  );
};