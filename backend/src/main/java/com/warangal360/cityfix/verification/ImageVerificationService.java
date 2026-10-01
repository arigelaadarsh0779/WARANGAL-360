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

    public boolean isPerceptualMatch(String hash1, String hash2, int threshold) {
        return calculateHammingDistance(hash1, hash2) <= threshold;
    }
}
