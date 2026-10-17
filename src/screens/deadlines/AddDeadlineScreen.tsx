import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colours } from '../../constants/colours';

export default function AddDeadlineScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Deadline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.background },
  text: { fontSize: 18, fontWeight: '700', color: colours.primary },
});