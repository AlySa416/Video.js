import {
  CaptionsRadioGroup,
  Menu,
  PlaybackRateRadioGroup,
  QualityRadioGroup,
} from '@videojs/react';
import { CaptionsOffIcon, ChevronIcon, CheckIcon, GearIcon, SpeedIcon, SwitchesIcon } from '@videojs/react/icons/scaffold';
import type { ComponentType, ReactNode, SVGProps } from 'react';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

function SubMenu({
  label,
  icon: IconComp,
  group: Group,
  children,
}: {
  label: string;
  icon: Icon;
  group: typeof QualityRadioGroup | typeof PlaybackRateRadioGroup | typeof CaptionsRadioGroup;
  children: ReactNode;
}) {
  return (
    <Menu.Root>
      <Group.Root>
        <Menu.Trigger className="media-menu-item">
          <IconComp className="media-menu-trigger-icon" />
          {label}
          <span className="media-menu-hint">
            <Group.Value className="media-menu-hint-label" />
            <ChevronIcon className="media-menu-forward-chevron" />
          </span>
        </Menu.Trigger>
        <Menu.Content className="media-menu-content">
          <Menu.Item className="media-menu-back-item">
            <ChevronIcon className="media-menu-back-chevron" />
            {label}
          </Menu.Item>
          <Menu.Separator className="media-menu-separator" />
          {children}
        </Menu.Content>
      </Group.Root>
    </Menu.Root>
  );
}

function radioItem(props: Parameters<typeof Menu.RadioItem>[0], item: { label: string }) {
  return (
    <Menu.RadioItem className="media-menu-radio-item" {...props}>
      <span>{item.label}</span>
      <Menu.ItemIndicator forceMount className="media-menu-indicator">
        <CheckIcon className="media-menu-radio-icon" />
      </Menu.ItemIndicator>
    </Menu.RadioItem>
  );
}

/** One gear button; quality, speed and captions live behind it so the control bar stays calm. */
export function SettingsMenu() {
  return (
    <Menu.Root side="top" align="end">
      <Menu.Trigger render={<button type="button" className="g-btn g-settings-btn" aria-label="Settings (S)" />}>
        <GearIcon className="g-icon" />
      </Menu.Trigger>
      <Menu.Popup keepMounted className="media-popup media-popup-safe-area media-menu-popup g-menu-popup">
        <Menu.Content className="media-menu-content">
          <SubMenu label="Quality" icon={SwitchesIcon} group={QualityRadioGroup}>
            <QualityRadioGroup.Options className="media-menu-radio-group" renderItem={radioItem as never} />
          </SubMenu>
          <SubMenu label="Speed" icon={SpeedIcon} group={PlaybackRateRadioGroup}>
            <PlaybackRateRadioGroup.Options className="media-menu-radio-group" renderItem={radioItem as never} />
          </SubMenu>
          <SubMenu label="Captions" icon={CaptionsOffIcon} group={CaptionsRadioGroup}>
            <CaptionsRadioGroup.Options className="media-menu-radio-group" renderItem={radioItem as never} />
          </SubMenu>
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}
