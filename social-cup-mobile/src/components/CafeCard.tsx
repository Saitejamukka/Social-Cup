import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Cafe } from '../types';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';

interface CafeCardProps {
  cafe: Cafe;
  onPress: () => void;
  showSaveButton?: boolean;
}

export const CafeCard: React.FC<CafeCardProps> = ({
  cafe,
  onPress,
  showSaveButton = false,
}) => {
  const { savedCafeIds, toggleSaveCafe } = useAppStore();
  const isSaved = savedCafeIds.includes(cafe.id);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Thumbnail */}
      {cafe.image ? (
        <Image
          source={{ uri: cafe.image }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailText}>☕</Text>
        </View>
      )}

      {/* Details */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {cafe.name}
          </Text>
          {showSaveButton && (
            <TouchableOpacity
              onPress={() => toggleSaveCafe(cafe.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[
                  styles.heartIcon,
                  { color: isSaved ? Colors.gold : Colors.pale },
                ]}
              >
                {isSaved ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.neighborhood}>
          {cafe.neighborhood} · {cafe.distance}
        </Text>

        {cafe.tags && cafe.tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {cafe.tags.join(' · ')}
          </Text>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.price}>{cafe.price}</Text>
          <Text style={styles.rating}>★ {cafe.rating.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
    flex: 1,
  },
  heartIcon: {
    fontSize: 18,
    paddingHorizontal: 4,
  },
  neighborhood: {
    fontSize: 12,
    color: Colors.mute,
  },
  tags: {
    fontSize: 11,
    color: Colors.gold,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 12,
    color: Colors.ink,
    fontWeight: '500',
  },
  rating: {
    fontSize: 12,
    color: Colors.ink,
    fontWeight: '600',
  },
});
