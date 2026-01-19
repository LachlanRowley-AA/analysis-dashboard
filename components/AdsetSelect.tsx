import { Combobox, Group, Input, InputBase, Text, useCombobox } from '@mantine/core';
import { ComparisonData } from '@/types/analytics';
import { useState } from 'react';

interface Item {
  label: string;
  value: ComparisonData;
}




function SelectOption({ label, value, }: Item) {
  return (
    <Group>
      <div>
        <Text fz="xs" opacity={0.6}>
          {label}
        </Text>
      </div>
    </Group>
  );
}

interface SelectProps {
  options: Item[];
  value?: string | null;
  onChange?: (value: ComparisonData | null) => void;
}


export function SelectOptionComponent({
  options,
  value: controlledValue,
  onChange,
}: SelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [internalValue, setInternalValue] = useState<string | null>(null);

  // Allow controlled OR uncontrolled usage
  const value = controlledValue ?? internalValue;

  const selectedOption =
    options.find((item) => item.value.current.metrics.metricName === value) ?? null;

  const optionList = options
    .filter((item) => item.value.current.metrics.metricName)
    .map((item) => (
      <Combobox.Option
        value={item.value.current.metrics.metricName!}
        key={item.value.current.metrics.metricName}
      >
        <SelectOption {...item} />
      </Combobox.Option>
    ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        const selected = options.find(
          (item) => item.value.current.metrics.metricName === val
        );

        setInternalValue(val);
        onChange?.(selected?.value ?? null);

        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={<Combobox.Chevron />}
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
          multiline
        >
          {selectedOption ? (
            <SelectOption {...selectedOption} />
          ) : (
            <Input.Placeholder>Pick value</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>{optionList}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
