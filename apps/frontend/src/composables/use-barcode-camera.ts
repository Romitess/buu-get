import { ref, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const SCANNER_ELEMENT_ID = 'check-in-assist-camera';
const SCAN_FPS = 10;

export function useBarcodeCamera() {
  const { t } = useI18n();
  const isCameraActive = ref(false);
  const cameraError = ref<string | null>(null);
  let scanner: Html5Qrcode | null = null;
  let lastScannedAt = 0;
  const SCAN_COOLDOWN_MS = 1200;

  const stopCamera = async (): Promise<void> => {
    if (!scanner) {
      isCameraActive.value = false;
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch (error) {
      console.error('Failed to stop camera scanner:', error);
    } finally {
      scanner = null;
      isCameraActive.value = false;
    }
  };

  const startCamera = async (onScan: (code: string) => void): Promise<void> => {
    cameraError.value = null;
    await stopCamera();

    scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    });

    const scanBoxSize = Math.min(280, Math.floor(window.innerWidth * 0.82));

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: SCAN_FPS,
          qrbox: { width: scanBoxSize, height: scanBoxSize },
        },
        (decodedText) => {
          const now = Date.now();
          if (now - lastScannedAt < SCAN_COOLDOWN_MS) return;
          lastScannedAt = now;
          onScan(decodedText);
        },
        () => {
          // ignore per-frame scan misses
        },
      );
      isCameraActive.value = true;
    } catch (error) {
      cameraError.value =
        error instanceof Error
          ? error.message
          : t('admin.checkIn.errors.cameraFailed');
      await stopCamera();
    }
  };

  onBeforeUnmount(() => {
    void stopCamera();
  });

  return {
    scannerElementId: SCANNER_ELEMENT_ID,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
  };
}
