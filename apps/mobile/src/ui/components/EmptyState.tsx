import { CloudOff, Inbox, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon, Text } from '../primitives';
import { spacing } from '../tokens';
import { Button } from './Button';

export interface StateViewProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

function StateView({ title, description, icon, actionLabel, onAction, testID }: StateViewProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['4xl'],
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
      }}
      testID={testID}
    >
      {icon ? <Icon icon={icon} size={40} tone="tertiary" /> : null}
      <Text variant="title-3">{title}</Text>
      {description ? (
        <Text style={{ textAlign: 'center' }} tone="secondary" variant="body-sm">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="md" style={{ marginTop: spacing.xs }} variant="secondary" />
      ) : null}
    </View>
  );
}

/** 空态（§4.7）：线性插画 + 一句话 + 操作按钮。 */
export function EmptyState(props: StateViewProps) {
  return <StateView icon={Inbox} {...props} />;
}

/** 错误态。 */
export function ErrorState(props: StateViewProps) {
  return <StateView actionLabel="重试" icon={TriangleAlert} {...props} />;
}

/** 断网态 —— 与一般错误区分，文案指向网络而非重试失败。 */
export function OfflineState(props: Partial<StateViewProps> & { onAction?: () => void }) {
  return (
    <StateView
      actionLabel="重试"
      description="请检查网络连接后重试。已完成的测量数据已在本地保存，恢复网络后会自动上传。"
      icon={CloudOff}
      title="网络连接不可用"
      {...props}
    />
  );
}
