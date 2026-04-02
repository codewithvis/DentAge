import { moveAsync } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';

/**
 * Handles PDF Generation and Local Saving.
 */
export const generatePDFReport = async (htmlContent: string): Promise<string> => {
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    const fileName = `OPG_Age_Report_${Date.now()}.pdf`;
    const FS = FileSystem as typeof FileSystem & { documentDirectory?: string; cacheDirectory?: string };
    const destDir = FS.documentDirectory || FS.cacheDirectory || '';
    if (!destDir) {
      throw new Error('Unable to resolve FileSystem documentDirectory or cacheDirectory.');
    }

    const newPath = destDir + fileName;

    await moveAsync({
      from: uri,
      to: newPath
    });

    return newPath;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

