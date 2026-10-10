package com.warangal360.cityfix.verification;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.security.MessageDigest;

@Service
public class ImageVerificationService {

    public String computeSha256(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = file.getBytes();
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Computes a 64-bit difference hash (dHash) for perceptual image comparison.
     * Scales image to 9x8, converts to grayscale, and compares pixel intensities.
     */
    public String computeDHash(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            BufferedImage original = ImageIO.read(is);
            if (original == null) {
                return null;
            }

            // Resize to 9 width x 8 height
            BufferedImage resized = new BufferedImage(9, 8, BufferedImage.TYPE_BYTE_GRAY);
            Graphics2D g = resized.createGraphics();
            g.drawImage(original.getScaledInstance(9, 8, Image.SCALE_SMOOTH), 0, 0, 9, 8, null);
            g.dispose();

            long hash = 0;
            int bitIndex = 0;
            for (int y = 0; y < 8; y++) {
                for (int x = 0; x < 8; x++) {
                    int leftPixel = resized.getRaster().getSample(x, y, 0);
                    int rightPixel = resized.getRaster().getSample(x + 1, y, 0);
                    if (leftPixel > rightPixel) {
                        hash |= (1L << bitIndex);
                    }
                    bitIndex++;
                }
            }
            return String.format("%016x", hash);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Calculates Hamming Distance between two 16-character hex hash strings.
     */
    public int calculateHammingDistance(String hash1, String hash2) {
        if (hash1 == null || hash2 == null || hash1.length() != hash2.length()) {
            return Integer.MAX_VALUE;
        }
        try {
            long h1 = Long.parseUnsignedLong(hash1, 16);
            long h2 = Long.parseUnsignedLong(hash2, 16);
            return Long.bitCount(h1 ^ h2);
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }

    /**
     * Evaluates whether the uploaded photo is usable or if it's too dark / pitch black / blank.
     * NOTE: The camera overlay burns a bright watermark strip at the bottom ~15% of the photo.
     * We MUST skip those rows to accurately assess the actual scene content above the strip.
     */
    public ImageQualityResult evaluateImageQuality(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            BufferedImage image = ImageIO.read(is);
            if (image == null) {
                return new ImageQualityResult(false, "Invalid image format. Please capture a valid photo.");
            }

            int width = image.getWidth();
            int height = image.getHeight();
            if (width < 30 || height < 30) {
                return new ImageQualityResult(false, "Image resolution is too low to analyze.");
            }

            // Skip bottom 15% of the image (the WARANGAL 360 watermark strip)
            int analyzeHeight = (int) (height * 0.85);

            int stepX = Math.max(1, width / 64);
            int stepY = Math.max(1, analyzeHeight / 64);

            double totalLuminance = 0;
            int sampledPixels = 0;
            int darkPixels = 0;      // luminance < 35
            int veryDarkPixels = 0;  // luminance < 20

            for (int y = 0; y < analyzeHeight; y += stepY) {
                for (int x = 0; x < width; x += stepX) {
                    int rgb = image.getRGB(x, y);
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;

                    double lum = 0.299 * r + 0.587 * g + 0.114 * b;
                    totalLuminance += lum;
                    sampledPixels++;

                    if (lum < 35.0) {
                        darkPixels++;
                    }
                    if (lum < 20.0) {
                        veryDarkPixels++;
                    }
                }
            }

            if (sampledPixels == 0) {
                return new ImageQualityResult(false, "Could not process image pixels.");
            }

            double meanLuminance = totalLuminance / sampledPixels;
            double darkRatio = (double) darkPixels / sampledPixels;
            double veryDarkRatio = (double) veryDarkPixels / sampledPixels;

            // Compute standard deviation for variance check
            double varianceSum = 0;
            // Re-scan for stddev (we didn't store individual values to save memory)
            int idx = 0;
            for (int y = 0; y < analyzeHeight; y += stepY) {
                for (int x = 0; x < width; x += stepX) {
                    int rgb = image.getRGB(x, y);
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;
                    double lum = 0.299 * r + 0.587 * g + 0.114 * b;
                    varianceSum += (lum - meanLuminance) * (lum - meanLuminance);
                    idx++;
                }
            }
            double stdDev = Math.sqrt(varianceSum / Math.max(1, idx));

            // 1. Pitch black / covered lens / dark room
            //    Real phone "black" photos have sensor noise giving mean luminance ~15-45
            if (meanLuminance < 50.0 && darkRatio > 0.70) {
                return new ImageQualityResult(false,
                        "The captured photo is too dark or completely black. Please capture a clear, well-lit photo showing the actual civic issue.");
            }

            // 2. Almost entirely pitch dark (>60% under luminance 20)
            if (veryDarkRatio > 0.60) {
                return new ImageQualityResult(false,
                        "The photo is nearly entirely black. Please turn on your flashlight or capture the photo in daylight.");
            }

            // 3. Dark and featureless (low mean + low variance = uniform dark)
            if (meanLuminance < 55.0 && stdDev < 12.0) {
                return new ImageQualityResult(false,
                        "The photo appears too dark and featureless to identify any civic issue. Please capture a clearer photo.");
            }

            // 4. Solid color / blank screen (any brightness but zero texture)
            if (stdDev < 4.0) {
                return new ImageQualityResult(false,
                        "The captured photo appears blank or uniform with no recognizable objects. Please capture a clear photo of the civic problem.");
            }

            return new ImageQualityResult(true, null);
        } catch (Exception e) {
            return new ImageQualityResult(true, null); // If inspection fails unexpectedly, allow AI to process
        }
    }

    public static class ImageQualityResult {
        private final boolean valid;
        private final String rejectionReason;

        public ImageQualityResult(boolean valid, String rejectionReason) {
            this.valid = valid;
            this.rejectionReason = rejectionReason;
        }

        public boolean isValid() {
            return valid;
        }

        public String getRejectionReason() {
            return rejectionReason;
        }
    }
}

