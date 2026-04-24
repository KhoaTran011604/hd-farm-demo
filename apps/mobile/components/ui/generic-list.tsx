import { FlatList, ActivityIndicator, Text, View, StyleSheet, RefreshControl, type ListRenderItem, type StyleProp, type ViewStyle } from 'react-native';

interface GenericListProps<TItem> {
  data: TItem[];
  renderItem: ListRenderItem<TItem>;
  keyExtractor: (item: TItem, index: number) => string;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function GenericList<TItem>({
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  onRefresh,
  isRefreshing = false,
  emptyMessage = 'No data',
  ListHeaderComponent,
  contentContainerStyle,
}: GenericListProps<TItem>): React.JSX.Element {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1A3009" size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={[data.length === 0 && styles.emptyContainer, contentContainerStyle]}
      ListEmptyComponent={<Text style={styles.emptyText}>{emptyMessage}</Text>}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator color="#1A3009" style={styles.footer} />
        ) : null
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage?.();
      }}
      onEndReachedThreshold={0.3}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#1A3009" />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  footer: { paddingVertical: 16 },
});
