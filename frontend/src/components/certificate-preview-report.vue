<template>
  <div class="q-pa-md page-container-test">
    <!-- Action Bar (Hidden when printing) -->
    <div class="row justify-end q-mb-md no-print">
      <q-btn
        color="primary"
        icon="print"
        :label="$t('exam.voucher.print')"
        class="print-btn shadow-2 text-weight-bold"
        @click="windowPrint"
      />
    </div>

    <!-- Preview / Printable Area -->
    <div ref="reportRef" class="report-wrapper">
      <div class="report-card">
        <!-- ===== Header Section ===== -->
        <div class="report-header row items-center no-wrap">
          <!-- Logo container -->
          <div class="col-auto">
            <img src="icons/logo-vocher.png" class="header-logo" alt="BUULI Logo" />
          </div>

          <!-- Titles -->
          <div class="col text-center">
            <h1 class="header-title">BUU-GET: Burapha University's Graduate English Test</h1>
            <h2 class="header-subtitle">Test Taker Score Report</h2>
          </div>
        </div>

        <!-- ===== Body Section ===== -->
        <div class="report-body relative-position">
          <!-- Subtle Watermark Background -->
          <div class="watermark-bg no-pointer-events">GET</div>

          <div class="row q-col-gutter-lg items-stretch content-container">
            <!-- Left: Profile Photo Column -->
            <div class="col-12 col-sm-4 flex flex-center column">
              <div class="profile-photo-wrapper shadow-1">
                <q-icon name="image" size="48px" color="grey-5" />
              </div>
              <div class="photo-name text-weight-bold text-primary q-mt-sm">XX. XXXXX XXXXXX</div>
            </div>

            <!-- Right: Details Grid -->
            <div class="col-12 col-sm-8 detail-grid-column">
              <div class="row q-col-gutter-y-sm full-height items-center">
                <!-- Column 1 (Left details) -->
                <div class="col-12 col-sm-6 detail-group">
                  <div class="info-group">
                    <label class="info-label">Test Taker ID:</label>
                    <div class="info-value">XXXXXXXXX</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">Citizen ID:</label>
                    <div class="info-value">X-XXXX-XXXXX-XX-X</div>
                  </div>
                </div>

                <!-- Column 2 (Right details) -->
                <div class="col-12 col-sm-6 detail-group">
                  <div class="info-group">
                    <label class="info-label">Test Session:</label>
                    <div class="info-value">X/XXXX</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">Test Date:</label>
                    <div class="info-value">XX XXX XXXX</div>
                  </div>
                </div>

                <!-- Score Section (no box) -->
                <div class="col-12 q-mt-md">
                  <div class="score-section">
                    <div class="score-header q-mb-xs">Score</div>
                    <div class="row justify-between items-center q-py-xs score-row">
                      <div class="score-label">1. Vocabulary & Grammar</div>
                      <div class="score-val">XX/50</div>
                    </div>
                    <div class="row justify-between items-center q-py-xs score-row">
                      <div class="score-label">2. Reading</div>
                      <div class="score-val">XX/50</div>
                    </div>
                    <div class="row justify-between items-center q-py-xs score-row">
                      <div class="score-label">Overall BUU-GET Score</div>
                      <div class="score-val text-weight-bold">XXX/100</div>
                    </div>
                    <q-separator class="score-separator q-my-xs" />
                    <div class="row justify-between items-center q-py-xs score-row-level">
                      <div class="score-label">Level</div>
                      <div class="row no-wrap score-level-val">
                        <div class="q-mr-xl">Band</div>
                        <div>X</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== Footer / Metadata Section ===== -->
        <div class="report-footer row justify-between items-center no-wrap">
          <div class="col row q-col-gutter-x-xl metadata-group">
            <div class="col-auto text-left">
              <div class="metadata-label">Report Issue Date:</div>
              <div class="metadata-value">XX XXX XXXX</div>
            </div>
            <div class="col-auto text-left">
              <div class="metadata-label">Score Valid Until:</div>
              <div class="metadata-value">XX XXX XXXX</div>
            </div>
          </div>
          <div class="col-auto text-right">
            <q-icon name="qr_code_2" size="48px" color="dark" class="qr-code-icon" />
          </div>
        </div>
      </div>

      <!-- Band Description Table Section (Separate Box) -->
      <div class="band-desc-block q-mt-lg">
        <div class="band-desc-box relative-position">
          <!-- Subtle Watermark Background -->
          <div class="watermark-bg no-pointer-events">GET</div>

          <div class="band-desc-section">
            <h3 class="band-desc-title text-center text-weight-bold q-mb-md">
              BUU GET Band Description
            </h3>

            <div class="band-table-container">
              <table class="band-table">
                <thead>
                  <tr>
                    <th class="text-center" style="width: 10%">Band</th>
                    <th class="text-center" style="width: 15%">Score</th>
                    <th class="text-center" style="width: 12%">CEFR</th>
                    <th class="text-center">Performance Descriptor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rule in bandRules" :key="rule.id">
                    <td class="text-center text-weight-bold">{{ rule.band }}</td>
                    <td class="text-center">{{ rule.minScore }}-{{ rule.maxScore }}</td>
                    <td class="text-center">{{ rule.cefr }}</td>
                    <td class="text-left descriptor-cell">{{ rule.descriptor }}</td>
                  </tr>
                  <tr v-if="!bandRules.length">
                    <td colspan="4" class="text-center text-grey-6 py-md">
                      No band descriptions defined
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="band-table-note text-left q-mt-md italic">
              The performance descriptor is taken from CEFR Overall Reading Comprehension Scale
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface BandRule {
  id: string;
  band: string;
  minScore: number;
  maxScore: number;
  cefr: string;
  descriptor: string;
}

// ===== Props =====
defineProps<{
  bandRules: BandRule[];
}>();

const reportRef = ref<HTMLElement | null>(null);

// ===== Action: Window Print =====
const windowPrint = (): void => {
  window.print();
};
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@100;200;300;400;500;600;700;800&display=swap');

.page-container-test {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  min-height: 100%;
  padding: 0;
}

.print-btn {
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-family: 'Sarabun', sans-serif;
  letter-spacing: 0.5px;
  font-size: 13px;
}

.report-wrapper {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  font-family: 'Outfit', 'Sarabun', 'Inter', sans-serif;
}

.report-card {
  width: 100%;
  background: linear-gradient(to bottom, #fafafa, #f0f4f8);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-black, #000000);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

/* ===== Header Area ===== */
.report-header {
  padding: 16px 20px;
  background-color: transparent;
  border-bottom: 1.5px solid var(--primary, #0d47a1) !important;

  .header-logo {
    height: 40px;
    object-fit: contain;
  }

  .header-title {
    font-family: var(--font-family-base) !important;
    font-weight: 500 !important;
    font-size: 16px !important;
    line-height: 120% !important;
    color: var(--primary, #0d47a1) !important;
    margin: 0 0 3px 0 !important;
    white-space: nowrap;
  }

  .header-subtitle {
    font-family: var(--font-family-base) !important;
    font-weight: 500 !important;
    font-size: 13px !important;
    line-height: 120% !important;
    color: var(--neutral-600, #334155) !important;
    margin: 0 !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

/* ===== Body Area ===== */
.report-body {
  position: relative;
  padding: 24px 20px;
  background: transparent;

  .content-container {
    position: relative;
    z-index: 1;
  }
}

/* ===== Watermark ===== */
.watermark-bg {
  position: absolute;
  top: 35%;
  left: 60%;
  transform: translate(-50%, -50%);
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 140px;
  line-height: 100%;
  color: var(--watermark-color, rgba(30, 137, 229, 0.07));
  z-index: 0;
  user-select: none;
  pointer-events: none;
}

/* ===== Profile Photo ===== */
.profile-photo-wrapper {
  width: 100px;
  height: 126px;
  background-color: #212121;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1.5px solid var(--border-black, #000000);
}

.photo-name {
  font-family: 'Outfit', 'Sarabun', sans-serif;
  font-size: 12px;
  line-height: 1;
}

/* ===== Detail Grid ===== */
.detail-grid-column {
  padding-left: 12px !important;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-group {
  display: flex;
  flex-direction: column;

  .info-label {
    font-family: var(--font-family-base) !important;
    font-size: 12px !important;
    color: var(--neutral-700, #334155) !important;
    font-weight: 500 !important;
    margin-bottom: 0px;
    line-height: 1.2;
  }

  .info-value {
    font-family: var(--font-family-base) !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: var(--primary, #0d47a1) !important;
    line-height: 1.3;
  }
}

/* ===== Score Section (no box) ===== */
.score-section {
  font-family: var(--font-family-base) !important;

  .score-header {
    font-family: var(--font-family-base) !important;
    font-size: 13px;
    color: var(--neutral-800, #1f2937);
    padding-bottom: 4px;
    text-decoration: underline;
    font-weight: 600;
  }

  .score-row {
    font-family: var(--font-family-base) !important;
    font-size: 12px;
    color: var(--neutral-700, #334155);
  }

  .score-separator {
    background-color: var(--border-black, #000000) !important;
    height: 1px;
    margin: 6px 0;
    opacity: 1;
  }

  .score-row-level {
    font-family: var(--font-family-base) !important;
    font-size: 12px;
    color: var(--neutral-700, #334155);
  }

  .score-level-val {
    font-family: var(--font-family-base) !important;
    font-size: 12px;
    color: var(--neutral-700, #334155);
    display: flex;
    gap: 48px;
  }
}

/* ===== Footer / Metadata Section ===== */
.report-footer {
  padding: 16px 20px;
  background-color: transparent;
  border-top: 1.5px solid var(--border-black, #000000);
  font-family: 'Sarabun', 'Outfit', sans-serif;

  .metadata-group {
    display: flex;
    gap: 32px;
  }

  .metadata-label {
    font-size: 11px;
    color: var(--neutral-800, #1f2937);
    font-weight: 500;
    line-height: 1.2;
  }

  .metadata-value {
    font-size: 13px;
    color: var(--primary, #0d47a1);
    font-weight: 600;
    margin-top: 4px;
  }

  .qr-code-icon {
    display: block;
  }
}

/* ===== Band Description Section ===== */
.band-desc-block {
  margin-top: 16px;
  text-align: left;
}

.band-desc-box {
  position: relative;
  background: linear-gradient(to bottom, #fafafa, #f0f4f8);
  border: 1.5px solid var(--border-black, #000000);
  border-radius: 6px;
  padding: 20px 24px;
  box-shadow: var(--shadow-md);

  .watermark-bg {
    left: 50% !important;
  }
}

.band-desc-section {
  position: relative;
  z-index: 1;
  text-align: left;
  font-family: 'Sarabun', 'Outfit', sans-serif;
}

.band-desc-title {
  font-family: var(--font-family-base) !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  color: var(--neutral-800, #1f2937);
  margin-top: 4px;
}

.band-table-container {
  width: 100%;
  overflow-x: auto;
}

.band-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-family-base) !important;
  font-size: 13px;
  line-height: 1.4;

  th,
  td {
    padding: 10px 8px;
    border: none;
  }

  thead {
    tr {
      border-bottom: 1.5px solid var(--border-black, #000000);
    }
  }

  th {
    background-color: transparent !important;
    color: var(--neutral-800, #1f2937);
    font-weight: 700;
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--neutral-300, #cbd5e1);

      &:last-child {
        border-bottom: 1.5px solid var(--border-black, #000000);
      }
    }
  }

  td {
    color: var(--neutral-800, #1f2937);
    vertical-align: top;
  }

  .descriptor-cell {
    font-size: 12px;
    white-space: normal;
    word-break: break-word;
  }
}

.band-table-note {
  font-family: var(--font-family-base) !important;
  font-size: 11px;
  color: var(--neutral-600, #475569);
  margin-bottom: 0;
  font-style: italic !important;
}

/* ===== Responsive Adaptability ===== */
@media (max-width: 480px) {
  .detail-grid-column {
    padding-left: 0 !important;
    margin-top: 12px;
  }
  .report-header {
    flex-direction: column;
    padding: 12px;
    gap: 8px;
    text-align: center;
  }
  .report-body {
    padding: 12px;
  }
  .watermark-bg {
    font-size: 6rem;
    left: 50%;
  }
}

/* ===== Print Optimization ===== */
@media print {
  .no-print {
    display: none !important;
  }
  .page-container-test {
    padding: 0 !important;
    background-color: transparent !important;
  }
  .report-wrapper {
    max-width: 100% !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
  .report-card {
    border: 0.1px solid var(--border-black) !important;
    box-shadow: none !important;
    background-color: #ffffff !important;
    background-image: none !important;
  }
  .band-desc-box {
    padding: 16px 20px;
    background-color: #ffffff !important;
    background-image: none !important;
    border: 1.5px solid var(--border-black) !important;
    box-shadow: none !important;
  }
  .report-footer {
    background-color: var(--neutral-50, #f8fafc) !important;
    background-image: none !important;
    border-top: 1.5px solid var(--border-black) !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
