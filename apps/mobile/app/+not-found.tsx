import { router } from 'expo-router';

import { EmptyState, Screen } from '@/ui';

export default function NotFoundScreen() {
  return (
    <Screen scroll={false}>
      <EmptyState
        actionLabel="回到首页"
        description="链接可能已失效，或页面已被移除。"
        onAction={() => router.replace('/')}
        title="找不到这个页面"
      />
    </Screen>
  );
}
