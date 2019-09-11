import React from 'react';
import {View, StyleSheet} from 'react-native';

function moveToBottom(component) {
  return (
    <View style={styles.container}>
      {component}
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 0,
    right: 0,
  }
})
export default moveToBottom