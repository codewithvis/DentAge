import * as ImagePicker from 'expo-image-picker';

/**
 * Service to handle image picking using the OS-native photo picker.
 * 
 * Compliant with Google Play policies:
 * Removes the need for READ_MEDIA_IMAGES and other storage permissions
 * on Android 13+ and leverages the isolated Photo Picker.
 */
export const openImagePicker = async (): Promise<string | null> => {
  try {
    // Requesting media library permissions is NOT required when using
    // launchImageLibraryAsync on modern Android because it uses the system Photo Picker securely.
    
    let result = await ImagePicker.launchImageLibraryAsync({
      // ImagePicker.MediaTypeOptions is deprecated; use MediaType instead by passing an array.
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.warn("Error picking image:", error);
    return null;
  }
};
