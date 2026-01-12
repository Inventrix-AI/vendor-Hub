import imageCompression from 'browser-image-compression';

/**
 * Size limits for different file types
 */
const SIZE_LIMITS = {
  photo: 2 * 1024 * 1024,      // 2MB for photos (passport photo, shop photo)
  document: 4 * 1024 * 1024,   // 4MB for documents (ID card, shop documents, PDFs)
};

/**
 * Compression options for different document types
 */
const COMPRESSION_OPTIONS = {
  // For photos (passport photo, shop photo) - higher quality
  photo: {
    maxSizeMB: 0.5,           // 500KB max
    maxWidthOrHeight: 1920,   // Max dimension
    useWebWorker: true,       // Non-blocking
    fileType: 'image/jpeg' as const,
  },
  // For documents (ID, shop documents) - preserve text readability
  document: {
    maxSizeMB: 0.5,           // 500KB max
    maxWidthOrHeight: 2048,   // Slightly higher for text documents
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
  }
};

/**
 * Result type for file processing
 */
export interface ProcessedFile {
  file: File;
  error?: string;
  originalSize: number;
  finalSize: number;
  compressed: boolean;
}

/**
 * Validates PDF file size
 * @param file - PDF file to validate
 * @param type - Document type for size limit
 * @returns Validation result with error if oversized
 */
function validatePdfSize(file: File, type: 'photo' | 'document'): { valid: boolean; error?: string } {
  const maxSize = SIZE_LIMITS[type];

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `PDF file is too large (${fileSizeMB}MB). Maximum allowed size is ${maxSizeMB}MB. Please compress or reduce the PDF file size.`
    };
  }

  return { valid: true };
}

/**
 * Process a single file - compresses images, validates PDFs
 *
 * @param file - The file to process
 * @param type - Type of document ('photo' or 'document')
 * @returns Processed file with metadata
 */
export async function processFile(
  file: File,
  type: 'photo' | 'document' = 'document'
): Promise<ProcessedFile> {
  const originalSize = file.size;

  // Handle PDFs - validate size only, no compression
  if (file.type === 'application/pdf') {
    const validation = validatePdfSize(file, type);

    if (!validation.valid) {
      console.log(`[PDF] Size validation failed: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);
      return {
        file,
        error: validation.error,
        originalSize,
        finalSize: originalSize,
        compressed: false,
      };
    }

    console.log(`[PDF] Size OK: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);
    return {
      file,
      originalSize,
      finalSize: originalSize,
      compressed: false,
    };
  }

  // Handle images - compress
  if (file.type.startsWith('image/')) {
    // Skip if already small enough (under 500KB)
    if (file.size <= 500 * 1024) {
      console.log(`[Image] Already small: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
      return {
        file,
        originalSize,
        finalSize: originalSize,
        compressed: false,
      };
    }

    const options = COMPRESSION_OPTIONS[type];

    try {
      console.log(`[Image] Compressing: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);

      const compressedFile = await imageCompression(file, options);

      const compressionRatio = ((1 - compressedFile.size / originalSize) * 100).toFixed(1);
      console.log(
        `[Image] Compressed: ${file.name} ` +
        `${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024).toFixed(0)}KB ` +
        `(${compressionRatio}% reduction)`
      );

      // Return compressed file with original name
      const resultFile = new File([compressedFile], file.name, {
        type: compressedFile.type,
        lastModified: Date.now(),
      });

      return {
        file: resultFile,
        originalSize,
        finalSize: resultFile.size,
        compressed: true,
      };
    } catch (error) {
      console.error(`[Image] Compression failed for ${file.name}:`, error);
      // Return original file if compression fails
      return {
        file,
        originalSize,
        finalSize: originalSize,
        compressed: false,
      };
    }
  }

  // Unknown file type - return as-is
  console.log(`[File] Unknown type, skipping: ${file.name} (${file.type})`);
  return {
    file,
    originalSize,
    finalSize: originalSize,
    compressed: false,
  };
}

/**
 * Result type for batch file processing
 */
export interface ProcessedFiles {
  id_document: File | null;
  photo: File | null;
  shop_document: File | null;
  shop_photo: File | null;
  errors: string[];
  stats: {
    originalTotal: number;
    finalTotal: number;
    savedBytes: number;
    savedPercent: string;
  };
}

/**
 * Process multiple files in parallel with proper type handling
 *
 * @param files - Object containing files to process
 * @returns Object with processed files and any errors
 */
export async function processFiles(files: {
  id_document?: File | null;
  photo?: File | null;
  shop_document?: File | null;
  shop_photo?: File | null;
}): Promise<ProcessedFiles> {
  const errors: string[] = [];

  // Process all files in parallel with their correct types
  const results = await Promise.all([
    files.id_document ? processFile(files.id_document, 'document') : null,
    files.photo ? processFile(files.photo, 'photo') : null,
    files.shop_document ? processFile(files.shop_document, 'document') : null,
    files.shop_photo ? processFile(files.shop_photo, 'photo') : null,
  ]);

  // Collect errors and processed files
  const fieldNames = ['ID Document', 'Photo', 'Shop Document', 'Shop Photo'];
  const processedFiles: (File | null)[] = [];
  let originalTotal = 0;
  let finalTotal = 0;

  results.forEach((result, index) => {
    if (result) {
      if (result.error) {
        errors.push(`${fieldNames[index]}: ${result.error}`);
      }
      processedFiles.push(result.file);
      originalTotal += result.originalSize;
      finalTotal += result.finalSize;
    } else {
      processedFiles.push(null);
    }
  });

  const savedBytes = originalTotal - finalTotal;
  const savedPercent = originalTotal > 0
    ? ((savedBytes / originalTotal) * 100).toFixed(1)
    : '0';

  return {
    id_document: processedFiles[0],
    photo: processedFiles[1],
    shop_document: processedFiles[2],
    shop_photo: processedFiles[3],
    errors,
    stats: {
      originalTotal,
      finalTotal,
      savedBytes,
      savedPercent,
    },
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use processFiles() instead
 */
export async function compressFiles(files: {
  id_document?: File | null;
  photo?: File | null;
  shop_document?: File | null;
  shop_photo?: File | null;
}): Promise<{
  id_document: File | null;
  photo: File | null;
  shop_document: File | null;
  shop_photo: File | null;
}> {
  const result = await processFiles(files);
  return {
    id_document: result.id_document,
    photo: result.photo,
    shop_document: result.shop_document,
    shop_photo: result.shop_photo,
  };
}

/**
 * Calculate total size of files
 */
export function calculateTotalSize(files: (File | null)[]): number {
  return files.reduce((total, file) => total + (file?.size || 0), 0);
}
